/**
 * ORIVIO Music Scanner Service
 * ════════════════════════════════════════════════════════════════════════════
 * Core service module for scanning local audio files, extracting embedded ID3
 * and Vorbis metadata, handling cover artwork, upserting Mongoose models,
 * detecting missing files, and supporting directory watching.
 * ════════════════════════════════════════════════════════════════════════════
 */

"use strict";

const path   = require("path");
const fs     = require("fs");
const crypto = require("crypto");
const Song   = require("../models/Song");
const Artist = require("../models/Artist");
const Album  = require("../models/Album");

// Configuration paths
const PROJECT_ROOT = path.resolve(__dirname, "../../");
const MUSIC_ROOT   = path.join(PROJECT_ROOT, "Music");
const COVERS_DIR   = path.resolve(__dirname, "../public/covers");
const PORT         = process.env.PORT || 5001;
const BACKEND_URL  = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const AUDIO_EXTS   = new Set([".mp3", ".wav", ".ogg", ".opus", ".m4a", ".aac", ".flac", ".wma", ".alac"]);
const IMAGE_EXTS   = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
const BROWSER_COMPAT = new Set([".mp3", ".ogg", ".opus", ".m4a", ".aac", ".wav", ".flac"]);
const SKIP_DIRS    = new Set(["node_modules", ".git", "build", "dist", "coverage"]);

let parseFile;
async function loadMusicMetadata() {
  if (!parseFile) {
    const mm = await import("music-metadata");
    parseFile = mm.parseFile;
  }
}

function ensureDirs() {
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }
  if (!fs.existsSync(MUSIC_ROOT)) {
    fs.mkdirSync(MUSIC_ROOT, { recursive: true });
  }
}

// ─── Recursive Directory Walker ──────────────────────────────────────────────
function walkDir(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (AUDIO_EXTS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// ─── Artwork Collector & Matcher ─────────────────────────────────────────────
function collectArtworkImages() {
  const imageFiles = [];
  const searchDirs = [
    path.join(MUSIC_ROOT, "images"),
    path.join(MUSIC_ROOT, ".thumbnails"),
    path.join(MUSIC_ROOT, "thumbnails"),
    path.join(MUSIC_ROOT, "thumbnail"),
  ];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (IMAGE_EXTS.has(ext)) {
          imageFiles.push({
            fullPath: path.join(dir, entry.name),
            name: entry.name.toLowerCase().replace(/\.[^.]+$/, ""),
          });
        }
      }
    } catch {}
  }
  return imageFiles;
}

function findMatchingArtwork(title, artistName, albumName, artworkImages) {
  if (!artworkImages || !artworkImages.length) return null;
  const normalize = (str) =>
    (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const titleN  = normalize(title);
  const artistN = normalize(artistName);
  const albumN  = normalize(albumName);

  let bestScore = 0;
  let bestImage = null;

  for (const img of artworkImages) {
    const imgN = normalize(img.name);
    let score = 0;

    if (titleN && imgN.includes(titleN))   score += 10;
    if (albumN && imgN.includes(albumN))   score += 8;
    if (artistN && imgN.includes(artistN)) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestImage = img.fullPath;
    }
  }
  return bestScore >= 5 ? bestImage : null;
}

function saveEmbeddedArtwork(pictures, songHash) {
  if (!pictures || !pictures.length || !pictures[0].data) return null;
  ensureDirs();
  const pic = pictures[0];
  const mimeToExt = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  const ext = mimeToExt[pic.format] || ".jpg";
  const filename = `${songHash}${ext}`;
  const outPath  = path.join(COVERS_DIR, filename);

  try {
    fs.writeFileSync(outPath, pic.data);
    return filename;
  } catch (err) {
    console.warn(`  ⚠ Could not save artwork: ${err.message}`);
    return null;
  }
}

function copyArtworkToCovers(srcPath, songHash) {
  if (!srcPath || !fs.existsSync(srcPath)) return null;
  ensureDirs();
  const ext = path.extname(srcPath).toLowerCase();
  const filename = `local_${songHash}${ext}`;
  const outPath = path.join(COVERS_DIR, filename);

  if (fs.existsSync(outPath)) return filename;
  try {
    fs.copyFileSync(srcPath, outPath);
    return filename;
  } catch {
    return null;
  }
}

// ─── Filename Parser ─────────────────────────────────────────────────────────
function parseFilename(filename) {
  let base = filename.replace(/\.[^.]+$/, "");
  base = base
    .replace(/^SpotiDownloader\.com\s*-\s*/i, "")
    .replace(/_spotdown\.org$/i, "")
    .replace(/_spotdown\.org\./i, "");

  const dashParts = base.split(" - ");
  if (dashParts.length >= 2) {
    const titlePart = dashParts[0].trim();
    const restPart  = dashParts.slice(1).join(" - ").trim();
    const commaParts = restPart.split(",");
    const artistPart = commaParts[0].trim();
    const albumPart  = commaParts.length >= 2 && !commaParts[1].trim().match(/^\d+$/)
      ? commaParts[1].trim()
      : null;

    return { title: titlePart, artistName: artistPart, albumName: albumPart || "Single" };
  }

  return { title: base.trim(), artistName: "Unknown Artist", albumName: "Single" };
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function hashFilePath(filePath) {
  return crypto.createHash("sha1").update(filePath).digest("hex").slice(0, 16);
}

function extractLyrics(meta) {
  if (meta.native) {
    for (const tags of Object.values(meta.native)) {
      for (const tag of tags) {
        if (tag.id === "LYRICS" || tag.id === "UNSYNCEDLYRICS" || tag.id === "©lyr") {
          if (tag.value && typeof tag.value === "string" && tag.value.trim()) {
            return tag.value.trim();
          }
        }
        if (tag.id === "USLT" && tag.value && tag.value.text) {
          return tag.value.text.trim();
        }
      }
    }
  }
  return null;
}

// ─── Model Upserts ────────────────────────────────────────────────────────────
async function upsertArtist(name) {
  if (!name || name === "Unknown Artist") return null;
  const trimmed = name.trim();
  let artist = await Artist.findOne({ name: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  if (!artist) {
    artist = await Artist.create({ name: trimmed });
  }
  return artist._id;
}

async function upsertAlbum(albumName, artistName, year, artistId) {
  if (!albumName || albumName === "Single") return null;
  const trimmed = albumName.trim();
  const artistN = (artistName || "Various Artists").trim();

  let album = await Album.findOne({
    title: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    artistName: artistN,
  });

  if (!album) {
    album = await Album.create({
      title: trimmed,
      artistName: artistN,
      ...(artistId && { artist: artistId }),
      releaseYear: year || null,
      coverImage: "",
      songs: [],
    });
  }
  return album._id;
}

// ─── Process Single Audio File ────────────────────────────────────────────────
async function processAudioFile(filePath, artworkImages = null) {
  await loadMusicMetadata();
  ensureDirs();

  if (!artworkImages) {
    artworkImages = collectArtworkImages();
  }

  const filename = path.basename(filePath);
  const ext      = path.extname(filename).toLowerCase();
  const fileHash = hashFilePath(filePath);

  let meta;
  try {
    meta = await parseFile(filePath, { duration: true, skipCovers: false });
  } catch (err) {
    return { error: err.message, filePath };
  }

  const common = meta.common || {};
  const format = meta.format || {};
  const fromFilename = parseFilename(filename);

  const title      = common.title?.trim()      || fromFilename.title;
  const artistName = common.artist?.trim()     || common.albumartist?.trim() || fromFilename.artistName;
  const albumName  = common.album?.trim()      || fromFilename.albumName;
  const genre      = (common.genre && common.genre[0]) || "Pop";
  const year       = common.year               || null;
  const trackNum   = common.track?.no          || null;
  const durationS  = format.duration           || 0;
  const duration   = formatDuration(durationS);
  const lyrics     = extractLyrics(meta);

  let coverImageFile = null;
  if (common.picture && common.picture.length > 0) {
    coverImageFile = saveEmbeddedArtwork(common.picture, fileHash);
  }
  if (!coverImageFile) {
    const localArt = findMatchingArtwork(title, artistName, albumName, artworkImages);
    if (localArt) {
      coverImageFile = copyArtworkToCovers(localArt, fileHash);
    }
  }

  const coverImageUrl = coverImageFile
    ? `${BACKEND_URL}/api/covers/${encodeURIComponent(coverImageFile)}`
    : "";

  const artistId = await upsertArtist(artistName);
  const albumId  = await upsertAlbum(albumName, artistName, year, artistId);

  const songData = {
    title,
    artistName,
    albumName: albumName || "Single",
    duration,
    durationSeconds: Math.round(durationS),
    coverImage: coverImageUrl,
    lyrics: lyrics || null,
    genre,
    year,
    trackNumber: trackNum,
    filePath,
    fileHash,
    isAvailable: true,
    ...(artistId && { artist: artistId }),
    ...(albumId  && { album:  albumId  }),
  };

  const existing = await Song.findOne({ filePath });
  let song;
  let isNew = false;

  if (existing) {
    Object.assign(existing, songData);
    existing.audioUrl = `${BACKEND_URL}/api/songs/${existing._id}/stream`;
    await existing.save();
    song = existing;
  } else {
    song = await Song.create({ ...songData, audioUrl: "", playsCount: 0 });
    song.audioUrl = `${BACKEND_URL}/api/songs/${song._id}/stream`;
    await song.save();
    isNew = true;
  }

  if (albumId) {
    await Album.findByIdAndUpdate(albumId, { $addToSet: { songs: song._id } });
  }

  return { song, isNew, isUpdated: !isNew, filePath };
}

// ─── Complete Recursive Library Scan ─────────────────────────────────────────
async function runLibraryScan(targetSubdir = "") {
  ensureDirs();
  await loadMusicMetadata();

  const scanRoot = targetSubdir
    ? path.resolve(MUSIC_ROOT, targetSubdir)
    : MUSIC_ROOT;

  // Security check: ensure scanRoot is strictly inside MUSIC_ROOT
  if (!scanRoot.startsWith(MUSIC_ROOT)) {
    throw new Error("Invalid target directory — path traversal prohibited.");
  }

  if (!fs.existsSync(scanRoot)) {
    throw new Error(`Target directory does not exist: ${scanRoot}`);
  }

  const artworkImages = collectArtworkImages();
  const audioFiles    = walkDir(scanRoot);

  const stats = {
    discovered: audioFiles.length,
    imported: 0,
    updated: 0,
    unchanged: 0,
    missing: 0,
    failed: 0,
    failures: [],
  };

  for (const fp of audioFiles) {
    try {
      const res = await processAudioFile(fp, artworkImages);
      if (res.error) {
        stats.failed++;
        stats.failures.push({ file: path.basename(fp), reason: res.error });
      } else if (res.isNew) {
        stats.imported++;
      } else {
        stats.updated++;
      }
    } catch (err) {
      stats.failed++;
      stats.failures.push({ file: path.basename(fp), reason: err.message });
    }
  }

  // ── Missing Files Check ──
  const allIndexedSongs = await Song.find({ filePath: { $exists: true, $ne: "" } });
  for (const song of allIndexedSongs) {
    if (song.filePath && !fs.existsSync(song.filePath)) {
      stats.missing++;
      if (song.isAvailable !== false) {
        song.isAvailable = false;
        await song.save().catch(() => {});
      }
    } else if (song.isAvailable === false && fs.existsSync(song.filePath)) {
      song.isAvailable = true;
      await song.save().catch(() => {});
    }
  }

  // ── Update Trending songs ──
  await Song.updateMany({}, { $set: { isTrending: false } });
  const topSongs = await Song.find({ isAvailable: { $ne: false } }).sort({ playsCount: -1 }).limit(20);
  if (topSongs.length > 0) {
    const ids = topSongs.map((s) => s._id);
    await Song.updateMany({ _id: { $in: ids } }, { $set: { isTrending: true } });
  }

  return stats;
}

// ─── Clean Missing Songs ─────────────────────────────────────────────────────
async function cleanMissingSongs() {
  const missingSongs = await Song.find({ filePath: { $exists: true, $ne: "" } });
  let count = 0;
  for (const song of missingSongs) {
    if (!fs.existsSync(song.filePath)) {
      await Song.findByIdAndDelete(song._id);
      count++;
    }
  }
  return count;
}

// ─── File Watcher Service ────────────────────────────────────────────────────
let watcherInstance = null;
function toggleWatcher(enabled, onFileEvent) {
  if (!enabled) {
    if (watcherInstance) {
      watcherInstance.close();
      watcherInstance = null;
    }
    return { watching: false };
  }

  if (watcherInstance) {
    return { watching: true };
  }

  ensureDirs();
  try {
    watcherInstance = fs.watch(MUSIC_ROOT, { recursive: true }, async (eventType, filename) => {
      if (!filename || SKIP_DIRS.has(filename)) return;
      const ext = path.extname(filename).toLowerCase();
      if (AUDIO_EXTS.has(ext)) {
        const fullPath = path.join(MUSIC_ROOT, filename);
        if (fs.existsSync(fullPath)) {
          await processAudioFile(fullPath).catch(() => {});
          if (onFileEvent) onFileEvent("add", filename);
        }
      }
    });
    return { watching: true };
  } catch (err) {
    return { watching: false, error: err.message };
  }
}

module.exports = {
  PROJECT_ROOT,
  MUSIC_ROOT,
  COVERS_DIR,
  AUDIO_EXTS,
  IMAGE_EXTS,
  walkDir,
  collectArtworkImages,
  findMatchingArtwork,
  saveEmbeddedArtwork,
  copyArtworkToCovers,
  parseFilename,
  hashFilePath,
  extractLyrics,
  upsertArtist,
  upsertAlbum,
  processAudioFile,
  runLibraryScan,
  cleanMissingSongs,
  toggleWatcher,
};
