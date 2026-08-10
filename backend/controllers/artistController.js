const Artist = require("../models/Artist");
const Song   = require("../models/Song");
const isValidObjectId = require("../utils/validateObjectId");

const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

// ---------------------------------------------------------------------------
// GET /api/artists
// ---------------------------------------------------------------------------
const getArtists = async (req, res, next) => {
  try {
    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip  = (page - 1) * limit;

    const sort = req.query.sort === "listeners"
      ? { monthlyListeners: -1 }
      : { name: 1 };

    const [artists, total] = await Promise.all([
      Artist.find().sort(sort).skip(skip).limit(limit).lean(),
      Artist.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: artists,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/artists/search?q=...
// ---------------------------------------------------------------------------
const searchArtists = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter 'q' is required." });
    }

    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip  = (page - 1) * limit;

    const filter = { name: new RegExp(q, "i") };

    const [artists, total] = await Promise.all([
      Artist.find(filter).sort({ monthlyListeners: -1 }).skip(skip).limit(limit).lean(),
      Artist.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      query: q,
      data: artists,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/artists/:id
// ---------------------------------------------------------------------------
const getArtistById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid artist ID." });
    }

    const artist = await Artist.findById(req.params.id).lean();
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found." });
    }

    // Fetch the artist's songs
    const songs = await Song.find({ artist: artist._id })
      .sort({ playsCount: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ success: true, data: { ...artist, songs } });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/artists/:id/songs
// ---------------------------------------------------------------------------
const getArtistSongs = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid artist ID." });
    }

    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip  = (page - 1) * limit;

    const filter = { artist: req.params.id };

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .populate("album", "title coverImage")
        .sort({ playsCount: -1, createdAt: -1 })
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

module.exports = { getArtists, searchArtists, getArtistById, getArtistSongs };
