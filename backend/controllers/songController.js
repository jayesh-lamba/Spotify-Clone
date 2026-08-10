const Song = require("../models/Song");
const Album = require("../models/Album");
const isValidObjectId = require("../utils/validateObjectId");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Helper: sanitize numeric query params
// ---------------------------------------------------------------------------
const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

// ---------------------------------------------------------------------------
// GET /api/songs
// Query: page, limit, genre, isTrending, sort (playsCount | createdAt)
// ---------------------------------------------------------------------------
const getSongs = async (req, res, next) => {
  try {
    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(1000, Math.max(1, toInt(req.query.limit, 20)));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.genre)      filter.genre      = new RegExp(req.query.genre, "i");
    if (req.query.isTrending) filter.isTrending = req.query.isTrending === "true";

    const sortMap = { playsCount: { playsCount: -1 }, createdAt: { createdAt: -1 } };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .populate("artist", "name image")
        .populate("album", "title coverImage releaseYear")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Song.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: songs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/songs/search?q=...&genre=...&page=&limit=
// ---------------------------------------------------------------------------
const searchSongs = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter 'q' is required." });
    }

    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip  = (page - 1) * limit;

    // Try text search first; fall back to regex if no text index hit
    const textFilter = { $text: { $search: q } };
    if (req.query.genre) textFilter.genre = new RegExp(req.query.genre, "i");

    const regexFilter = {
      $or: [
        { title:      new RegExp(q, "i") },
        { artistName: new RegExp(q, "i") },
        { genre:      new RegExp(q, "i") },
        { albumName:  new RegExp(q, "i") },
      ],
    };
    if (req.query.genre) regexFilter.genre = new RegExp(req.query.genre, "i");

    let songs = [];
    let total = 0;

    try {
      [songs, total] = await Promise.all([
        Song.find(textFilter)
          .populate("artist", "name image")
          .populate("album", "title coverImage")
          .sort({ score: { $meta: "textScore" }, playsCount: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Song.countDocuments(textFilter),
      ]);
    } catch (_) {
      // fallback to regex if text index unavailable
    }

    if (songs.length === 0) {
      [songs, total] = await Promise.all([
        Song.find(regexFilter)
          .populate("artist", "name image")
          .populate("album", "title coverImage")
          .sort({ playsCount: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Song.countDocuments(regexFilter),
      ]);
    }

    return res.status(200).json({
      success: true,
      query: q,
      data: songs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/songs/trending
// ---------------------------------------------------------------------------
const getTrendingSongs = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 10)));
    const songs = await Song.find({ isTrending: true })
      .populate("artist", "name image")
      .populate("album", "title coverImage")
      .sort({ playsCount: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: songs });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/songs/:id
// ---------------------------------------------------------------------------
const getSongById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findById(req.params.id)
      .populate("artist", "name image bio monthlyListeners")
      .populate("album", "title coverImage releaseYear")
      .lean();

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    return res.status(200).json({ success: true, data: song });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/songs/:id/stream  — Secure HTML5 Audio Streaming with Range Support
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GET /api/songs/:id/stream or /api/songs/:id/audio
// Secure HTML5 Audio Streaming with Range Support
// ---------------------------------------------------------------------------
const streamSong = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    let fullPath = "";
    const projectRoot = path.resolve(__dirname, "../../");

    if (song.filePath) {
      fullPath = path.isAbsolute(song.filePath)
        ? song.filePath
        : path.resolve(projectRoot, song.filePath);
    }

    if (!fullPath || !fs.existsSync(fullPath)) {
      // Fallback search in Music folder if filePath missing or moved
      const musicRoot = path.resolve(projectRoot, "Music");
      if (fs.existsSync(musicRoot)) {
        const titleNormalized = song.title ? song.title.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
        const findFile = (dir) => {
          try {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const f of files) {
              const p = path.join(dir, f.name);
              if (f.isDirectory() && f.name !== "node_modules" && f.name !== ".git") {
                const res = findFile(p);
                if (res) return res;
              } else if (f.isFile()) {
                const ext = path.extname(f.name).toLowerCase();
                const audioExts = new Set([".mp3", ".wav", ".ogg", ".opus", ".m4a", ".aac", ".flac", ".wma", ".alac"]);
                if (audioExts.has(ext)) {
                  const nameNorm = f.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                  if (titleNormalized && (nameNorm.includes(titleNormalized) || titleNormalized.includes(nameNorm))) {
                    return p;
                  }
                }
              }
            }
          } catch (_) {}
          return null;
        };
        const found = findFile(musicRoot);
        if (found) {
          fullPath = found;
          song.filePath = found;
          await song.save().catch(() => {});
        }
      }
    }

    if (!fullPath || !fs.existsSync(fullPath)) {
      // Fallback to bundled demo audio file if local file is missing on disk (e.g. on cloud host like Render)
      const demoAudioPath = path.resolve(__dirname, "../public/audio/demo.mp3");
      if (fs.existsSync(demoAudioPath)) {
        fullPath = demoAudioPath;
      } else {
        console.warn(`[Audio Stream Error] File not found on disk for song "${song.title}" (${song._id}): ${song.filePath || "No filePath"}`);
        return res.status(404).json({
          success: false,
          message: `Audio file for "${song.title}" not found on server disk.`,
          songId: song._id,
          filePath: song.filePath,
        });
      }
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      ".mp3": "audio/mpeg",
      ".flac": "audio/flac",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".opus": "audio/ogg",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
    };
    const contentType = mimeTypes[ext] || "audio/mpeg";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const file = fs.createReadStream(fullPath, { start, end });
      const head = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization",
        "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization",
        "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
        "Content-Length": fileSize,
        "Content-Type": contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/songs/:id/lyrics
// ---------------------------------------------------------------------------
const getLyrics = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findById(req.params.id).select("title artistName lyrics lyricsSource");
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: song._id,
        title: song.title,
        artistName: song.artistName,
        lyrics: song.lyrics || null,
        lyricsSource: song.lyricsSource || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/songs
// ---------------------------------------------------------------------------
const createSong = async (req, res, next) => {
  try {
    const {
      title, artist, artistName, album, albumName,
      duration, durationSeconds, audioUrl, coverImage,
      genre, isTrending, lyrics, filePath,
    } = req.body;

    if (!title || String(title).trim() === "") {
      return res.status(400).json({ success: false, message: "Song title is required." });
    }
    if (!artistName || String(artistName).trim() === "") {
      return res.status(400).json({ success: false, message: "Artist name is required." });
    }
    if (!duration || String(duration).trim() === "") {
      return res.status(400).json({ success: false, message: "Duration is required (e.g. 3:45)." });
    }

    const song = await Song.create({
      title: String(title).trim(),
      artist: artist || undefined,
      artistName: String(artistName).trim(),
      album: album || undefined,
      albumName: albumName ? String(albumName).trim() : "Single",
      duration: String(duration).trim(),
      durationSeconds: Number(durationSeconds || 0),
      audioUrl: audioUrl || "",
      coverImage: coverImage || "",
      lyrics: lyrics || null,
      filePath: filePath || undefined,
      genre: genre || "Pop",
      isTrending: Boolean(isTrending),
    });

    if (album) {
      await Album.findByIdAndUpdate(album, { $addToSet: { songs: song._id } });
    }

    return res.status(201).json({ success: true, message: "Song created.", data: song });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/songs/:id
// ---------------------------------------------------------------------------
const updateSong = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const allowed = [
      "title", "artistName", "album", "albumName",
      "duration", "durationSeconds", "audioUrl",
      "coverImage", "genre", "isTrending", "lyrics",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    return res.status(200).json({ success: true, message: "Song updated.", data: song });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/songs/:id
// ---------------------------------------------------------------------------
const deleteSong = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    if (song.album) {
      await Album.findByIdAndUpdate(song.album, { $pull: { songs: song._id } });
    }

    return res.status(200).json({ success: true, message: "Song deleted." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/songs/:id/play  — increment playsCount
// ---------------------------------------------------------------------------
const trackPlay = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { playsCount: 1 } },
      { new: true }
    ).select("title artistName playsCount");

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Play tracked.",
      data: { id: song._id, title: song.title, playsCount: song.playsCount },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/songs/recommendations  — Smart Recommendations Algorithm
// ---------------------------------------------------------------------------
/*
  RECOMMENDATION ALGORITHM LOGIC EXPLANATION:
  1. Retrieve user's listening history (recentlyPlayed) & saved tracks (likedSongs) from MongoDB.
  2. Extract favorite genres and top artists, calculating weighted affinity scores (Artist weight: 4, Genre weight: 3).
  3. Query database for songs matching top genres or artists, filtering out recently played IDs to maintain fresh recommendations.
  4. Fallback to top-trending & highest playsCount songs if user has no listening history or is unauthenticated.
  5. Return deduplicated list of real MongoDB Song documents.
*/
const getRecommendations = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 12)));
    let recommendedSongs = [];
    const User = require("../models/User");

    if (req.user) {
      const user = await User.findById(req.user._id)
        .populate("likedSongs", "genre artistName albumName")
        .populate("recentlyPlayed.song", "genre artistName albumName")
        .lean();

      if (user) {
        const genreScores = {};
        const artistScores = {};
        const playedSongIds = new Set();

        (user.likedSongs || []).forEach((s) => {
          if (s) {
            if (s.genre) genreScores[s.genre] = (genreScores[s.genre] || 0) + 3;
            if (s.artistName) artistScores[s.artistName] = (artistScores[s.artistName] || 0) + 4;
            playedSongIds.add(String(s._id));
          }
        });

        (user.recentlyPlayed || []).forEach((item) => {
          if (item?.song) {
            const s = item.song;
            if (s.genre) genreScores[s.genre] = (genreScores[s.genre] || 0) + 2;
            if (s.artistName) artistScores[s.artistName] = (artistScores[s.artistName] || 0) + 3;
            playedSongIds.add(String(s._id));
          }
        });

        const topGenres = Object.keys(genreScores).sort((a, b) => genreScores[b] - genreScores[a]).slice(0, 3);
        const topArtists = Object.keys(artistScores).sort((a, b) => artistScores[b] - artistScores[a]).slice(0, 3);

        if (topGenres.length > 0 || topArtists.length > 0) {
          const filter = {
            $or: [
              { genre: { $in: topGenres.map((g) => new RegExp(g, "i")) } },
              { artistName: { $in: topArtists.map((a) => new RegExp(a, "i")) } },
            ],
          };

          recommendedSongs = await Song.find(filter)
            .populate("artist", "name image")
            .populate("album", "title coverImage")
            .sort({ playsCount: -1 })
            .limit(limit * 2)
            .lean();

          // Filter out already liked/recently played if possible
          const fresh = recommendedSongs.filter((s) => !playedSongIds.has(String(s._id)));
          if (fresh.length >= 4) {
            recommendedSongs = fresh;
          }
        }
      }
    }

    // Fallback if not enough recommendations
    if (recommendedSongs.length < limit) {
      const existingIds = new Set(recommendedSongs.map((s) => String(s._id)));
      const fallback = await Song.find({ _id: { $nin: Array.from(existingIds) } })
        .populate("artist", "name image")
        .populate("album", "title coverImage")
        .sort({ isTrending: -1, playsCount: -1 })
        .limit(limit - recommendedSongs.length)
        .lean();

      recommendedSongs = [...recommendedSongs, ...fallback];
    }

    return res.status(200).json({
      success: true,
      count: recommendedSongs.slice(0, limit).length,
      data: recommendedSongs.slice(0, limit),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/admin/scan-music  — Trigger Music Directory Scanner
// ---------------------------------------------------------------------------
const scanMusicFiles = async (req, res, next) => {
  try {
    const scanMusic = require("../scanMusic");
    const stats = await scanMusic();
    return res.status(200).json({
      success: true,
      message: "Music library scan completed successfully.",
      data: stats || {
        scanned: 0,
        added: 0,
        artworkFound: 0,
        lyricsFound: 0,
        unsupported: 0,
        failed: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSongs,
  searchSongs,
  getTrendingSongs,
  getSongById,
  streamSong,
  getLyrics,
  createSong,
  updateSong,
  deleteSong,
  trackPlay,
  getRecommendations,
  scanMusicFiles,
};
