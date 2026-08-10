const Song          = require("../models/Song");
const Artist        = require("../models/Artist");
const Album         = require("../models/Album");
const Playlist      = require("../models/Playlist");
const SearchHistory = require("../models/SearchHistory");
const isValidObjectId = require("../utils/validateObjectId");

const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

// ---------------------------------------------------------------------------
// GET /api/search?q=...&type=all|songs|artists|albums|playlists
// ---------------------------------------------------------------------------
const globalSearch = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter 'q' is required." });
    }

    const type  = req.query.type || "all";
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 30)));

    // --- Natural Query Parsing ---
    let cleanQuery = q;
    let artistFilter = null;
    let yearFilter = null;
    let genreFilter = null;

    // Pattern 1: "Songs by <Artist>" or "by <Artist>"
    const byMatch = q.match(/(?:songs\s+by|by)\s+(.+)/i);
    if (byMatch && byMatch[1]) {
      artistFilter = new RegExp(byMatch[1].trim(), "i");
      cleanQuery = byMatch[1].trim();
    }

    // Pattern 2: "songs from <Year>" or "from <Year>" or 4-digit year
    const yearMatch = q.match(/(?:songs\s+from|from|\b)(\d{4})(?:\s+songs)?\b/i);
    if (yearMatch && yearMatch[1]) {
      yearFilter = parseInt(yearMatch[1], 10);
    }

    // Pattern 3: "<Genre> songs"
    const genreMatch = q.match(/^([a-zA-Z\s]+)\s+songs$/i);
    if (genreMatch && genreMatch[1] && !byMatch) {
      genreFilter = new RegExp(genreMatch[1].trim(), "i");
    }

    const regex = new RegExp(cleanQuery, "i");
    const results = {};

    if (type === "all" || type === "songs") {
      const songQueryOr = [
        { title: regex },
        { artistName: regex },
        { genre: regex },
        { albumName: regex },
      ];

      const songFilter = { $or: songQueryOr };
      if (artistFilter) songFilter.$or.push({ artistName: artistFilter });
      if (genreFilter) songFilter.$or.push({ genre: genreFilter });

      results.songs = await Song.find(songFilter)
        .populate("artist", "name image")
        .populate("album", "title coverImage releaseYear")
        .sort({ playsCount: -1 })
        .limit(limit)
        .lean();

      if (yearFilter) {
        // Filter or prioritize songs matching releaseYear on populated album or createdAt
        results.songs = results.songs.filter(
          (s) => (s.album && s.album.releaseYear === yearFilter) ||
                 (s.createdAt && new Date(s.createdAt).getFullYear() === yearFilter)
        );
      }
    }

    if (type === "all" || type === "artists") {
      results.artists = await Artist.find({ name: artistFilter || regex })
        .sort({ monthlyListeners: -1 })
        .limit(limit)
        .lean();
    }

    if (type === "all" || type === "albums") {
      const albumFilterObj = { title: regex };
      if (yearFilter) albumFilterObj.releaseYear = yearFilter;
      results.albums = await Album.find(albumFilterObj)
        .populate("artist", "name")
        .sort({ releaseYear: -1 })
        .limit(limit)
        .lean();
    }

    if (type === "all" || type === "playlists") {
      results.playlists = await Playlist.find({ name: regex, privacy: "Public" })
        .populate("creator", "username profileImage")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    // Save to search history for authenticated users
    if (req.user) {
      try {
        await SearchHistory.create({ user: req.user._id, query: q });
      } catch (_) {
        // Non-blocking: ignore save error
      }
    }

    return res.status(200).json({
      success: true,
      query: q,
      type,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/search/history  — get user's search history
// ---------------------------------------------------------------------------
const getSearchHistory = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 20)));

    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ searchedAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/search/history  — clear all search history
// ---------------------------------------------------------------------------
const clearSearchHistory = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    return res.status(200).json({ success: true, message: "Search history cleared." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/search/history/:id  — delete one history entry
// ---------------------------------------------------------------------------
const deleteSearchHistoryEntry = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid history entry ID." });
    }

    const entry = await SearchHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "History entry not found." });
    }

    return res.status(200).json({ success: true, message: "History entry deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
  getSearchHistory,
  clearSearchHistory,
  deleteSearchHistoryEntry,
};
