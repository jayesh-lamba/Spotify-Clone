/**
 * ORIVIO Admin & Music Manager Controller
 * ════════════════════════════════════════════════════════════════════════════
 * Controller handling music scanning, audio/folder uploads, metadata edits,
 * artwork changes, lyrics edits, missing file cleanup, and directory watching.
 * ════════════════════════════════════════════════════════════════════════════
 */

"use strict";

const fs = require("fs");
const path = require("path");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const isValidObjectId = require("../utils/validateObjectId");
const {
  MUSIC_ROOT,
  COVERS_DIR,
  runLibraryScan,
  processAudioFile,
  cleanMissingSongs,
  toggleWatcher,
  upsertArtist,
  upsertAlbum,
} = require("../services/scannerService");

// Helper to sanitize absolute file paths for client privacy & security
function sanitizePath(fullPath) {
  if (!fullPath) return "";
  const relative = path.relative(MUSIC_ROOT, fullPath);
  return `Music/${relative.replace(/\\/g, "/")}`;
}

// ─── GET /api/admin/music-manager/songs ─────────────────────────────────────
const getMusicManagerSongs = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 200));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const q = new RegExp(req.query.search, "i");
      filter.$or = [{ title: q }, { artistName: q }, { albumName: q }, { genre: q }];
    }
    if (req.query.status === "available") filter.isAvailable = { $ne: false };
    if (req.query.status === "missing")   filter.isAvailable = false;

    const sortMap = {
      title: { title: 1 },
      artist: { artistName: 1 },
      album: { albumName: 1 },
      duration: { durationSeconds: -1 },
      recentlyAdded: { createdAt: -1 },
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    const [songs, total] = await Promise.all([
      Song.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Song.countDocuments(filter),
    ]);

    // Format safe paths
    const formatted = songs.map((song) => ({
      ...song,
      id: song._id,
      displayPath: sanitizePath(song.filePath),
      isMissing: song.isAvailable === false,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/scan-music ──────────────────────────────────────────────
const scanMusic = async (req, res, next) => {
  try {
    const targetSubdir = req.body?.targetSubdir || "";
    const stats = await runLibraryScan(targetSubdir);

    return res.status(200).json({
      success: true,
      message: "Music library scan complete.",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/upload-song ─────────────────────────────────────────────
const uploadSong = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No audio file provided." });
    }

    const subDir = (req.body.subDir || "").trim();
    let targetDir = MUSIC_ROOT;

    if (subDir) {
      targetDir = path.resolve(MUSIC_ROOT, subDir);
      if (!targetDir.startsWith(MUSIC_ROOT)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Path traversal prohibited." });
      }
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, req.file.originalname);
    fs.renameSync(req.file.path, targetFilePath);

    const scanResult = await processAudioFile(targetFilePath);

    if (scanResult.error) {
      return res.status(500).json({
        success: false,
        message: `File uploaded but metadata scan failed: ${scanResult.error}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Song "${scanResult.song.title}" uploaded and indexed successfully.`,
      data: {
        ...scanResult.song.toObject(),
        displayPath: sanitizePath(targetFilePath),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/upload-directory ───────────────────────────────────────
const uploadDirectory = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files provided in folder upload." });
    }

    const relativePaths = req.body.relativePaths;
    const pathsArray = Array.isArray(relativePaths)
      ? relativePaths
      : typeof relativePaths === "string"
      ? [relativePaths]
      : [];

    let importedCount = 0;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const relPath = pathsArray[i] || file.originalname;

      // Restrict path traversal
      const safeRelPath = relPath.replace(/^(\.\.[\/\\])+/, "");
      const targetPath = path.resolve(MUSIC_ROOT, safeRelPath);

      if (!targetPath.startsWith(MUSIC_ROOT)) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        continue;
      }

      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.renameSync(file.path, targetPath);
      await processAudioFile(targetPath).catch(() => {});
      importedCount++;
    }

    const stats = await runLibraryScan();

    return res.status(201).json({
      success: true,
      message: `Imported folder structure (${importedCount} files). Library rescanned.`,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/admin/songs/:id/metadata ───────────────────────────────────────
const updateSongMetadata = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    const {
      title,
      artistName,
      albumName,
      albumArtist,
      genre,
      year,
      trackNumber,
      discNumber,
      composer,
      lyrics,
    } = req.body;

    if (title && String(title).trim()) song.title = String(title).trim();
    if (artistName && String(artistName).trim()) song.artistName = String(artistName).trim();
    if (albumName !== undefined) song.albumName = String(albumName).trim() || "Single";
    if (albumArtist !== undefined) song.albumArtist = String(albumArtist).trim();
    if (genre !== undefined) song.genre = String(genre).trim() || "Pop";
    if (year !== undefined) song.year = year ? Number(year) : null;
    if (trackNumber !== undefined) song.trackNumber = trackNumber ? Number(trackNumber) : null;
    if (discNumber !== undefined) song.discNumber = discNumber ? Number(discNumber) : null;
    if (composer !== undefined) song.composer = String(composer).trim();
    if (lyrics !== undefined) song.lyrics = lyrics || null;

    // Update Artist / Album relationships if names changed
    if (artistName) {
      const artistId = await upsertArtist(song.artistName);
      if (artistId) song.artist = artistId;
    }
    if (albumName) {
      const albumId = await upsertAlbum(song.albumName, song.artistName, song.year, song.artist);
      if (albumId) song.album = albumId;
    }

    await song.save();

    return res.status(200).json({
      success: true,
      message: "Song metadata updated successfully.",
      data: {
        ...song.toObject(),
        displayPath: sanitizePath(song.filePath),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/songs/:id/artwork ───────────────────────────────────────
const updateSongArtwork = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No artwork file uploaded." });
    }

    const PORT = process.env.PORT || 5001;
    const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

    const filename = path.basename(req.file.path);
    const coverUrl = `${BACKEND_URL}/api/covers/${encodeURIComponent(filename)}`;

    song.coverImage = coverUrl;
    await song.save();

    // Update album cover image if linked
    if (song.album) {
      await Album.findByIdAndUpdate(song.album, { coverImage: coverUrl });
    }

    return res.status(200).json({
      success: true,
      message: "Song artwork updated.",
      data: { coverImage: coverUrl },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/admin/songs/:id/lyrics ─────────────────────────────────────────
const updateSongLyrics = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    const { lyrics, lyricsSource } = req.body;
    song.lyrics = lyrics || null;
    if (lyricsSource !== undefined) song.lyricsSource = lyricsSource || null;

    await song.save();

    return res.status(200).json({
      success: true,
      message: "Song lyrics updated successfully.",
      data: { lyrics: song.lyrics, lyricsSource: song.lyricsSource },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/watch ───────────────────────────────────────────────────
let isWatchingEnabled = false;
const toggleWatchService = async (req, res, next) => {
  try {
    const { enable } = req.body;
    isWatchingEnabled = Boolean(enable);

    const result = toggleWatcher(isWatchingEnabled);
    return res.status(200).json({
      success: true,
      message: isWatchingEnabled ? "File watching enabled." : "File watching disabled.",
      watching: result.watching,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/clean-missing ──────────────────────────────────────────
const cleanMissing = async (req, res, next) => {
  try {
    const removedCount = await cleanMissingSongs();
    return res.status(200).json({
      success: true,
      message: `Cleaned ${removedCount} missing database records.`,
      removedCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/seed ───────────────────────────────────────────────────
const triggerSeedDatabase = async (req, res, next) => {
  try {
    const { runSeed } = require("../seed");
    const result = await runSeed();
    return res.status(200).json({
      success: true,
      message: "Database seeded successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMusicManagerSongs,
  scanMusic,
  uploadSong,
  uploadDirectory,
  updateSongMetadata,
  updateSongArtwork,
  updateSongLyrics,
  toggleWatchService,
  cleanMissing,
  triggerSeedDatabase,
};

