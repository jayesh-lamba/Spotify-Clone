const Album  = require("../models/Album");
const isValidObjectId = require("../utils/validateObjectId");

const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

// ---------------------------------------------------------------------------
// GET /api/albums
// ---------------------------------------------------------------------------
const getAlbums = async (req, res, next) => {
  try {
    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.artist && isValidObjectId(req.query.artist)) {
      filter.artist = req.query.artist;
    }

    const sort = req.query.sort === "releaseYear"
      ? { releaseYear: -1 }
      : { createdAt: -1 };

    const [albums, total] = await Promise.all([
      Album.find(filter)
        .populate("artist", "name image")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Album.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: albums,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/albums/search?q=...
// ---------------------------------------------------------------------------
const searchAlbums = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter 'q' is required." });
    }

    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip  = (page - 1) * limit;

    const filter = { title: new RegExp(q, "i") };

    const [albums, total] = await Promise.all([
      Album.find(filter)
        .populate("artist", "name image")
        .sort({ releaseYear: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Album.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      query: q,
      data: albums,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/albums/:id
// ---------------------------------------------------------------------------
const getAlbumById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid album ID." });
    }

    const album = await Album.findById(req.params.id)
      .populate("artist", "name image bio monthlyListeners")
      .populate("songs")
      .lean();

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found." });
    }

    return res.status(200).json({ success: true, data: album });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlbums, searchAlbums, getAlbumById };
