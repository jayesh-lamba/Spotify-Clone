const User = require("../models/User");
const Song = require("../models/Song");
const isValidObjectId = require("../utils/validateObjectId");

// ---------------------------------------------------------------------------
// GET /api/me/liked-songs
// ---------------------------------------------------------------------------
const getLikedSongs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "likedSongs",
        populate: [
          { path: "artist", select: "name image" },
          { path: "album",  select: "title coverImage" },
        ],
      })
      .select("likedSongs")
      .lean();

    return res.status(200).json({
      success: true,
      count: user.likedSongs.length,
      data: user.likedSongs,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/me/liked-songs/:songId  — like a song
// ---------------------------------------------------------------------------
const likeSong = async (req, res, next) => {
  try {
    const { songId } = req.params;
    if (!isValidObjectId(songId)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const song = await Song.findById(songId).lean();
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    const user = await User.findById(req.user._id).select("likedSongs");
    const alreadyLiked = user.likedSongs.some((id) => String(id) === String(songId));

    if (alreadyLiked) {
      return res.status(409).json({ success: false, message: "Song is already liked." });
    }

    user.likedSongs.push(songId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Song liked.",
      data: { songId, liked: true, totalLiked: user.likedSongs.length },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/me/liked-songs/:songId  — unlike a song
// ---------------------------------------------------------------------------
const unlikeSong = async (req, res, next) => {
  try {
    const { songId } = req.params;
    if (!isValidObjectId(songId)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const user = await User.findById(req.user._id).select("likedSongs");
    const before = user.likedSongs.length;
    user.likedSongs = user.likedSongs.filter((id) => String(id) !== String(songId));

    if (user.likedSongs.length === before) {
      return res.status(404).json({ success: false, message: "Song not found in liked songs." });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Song unliked.",
      data: { songId, liked: false, totalLiked: user.likedSongs.length },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/me/liked-songs/:songId/status
// ---------------------------------------------------------------------------
const getLikeStatus = async (req, res, next) => {
  try {
    const { songId } = req.params;
    if (!isValidObjectId(songId)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const user = await User.findById(req.user._id).select("likedSongs").lean();
    const liked = user.likedSongs.some((id) => String(id) === String(songId));

    return res.status(200).json({ success: true, data: { songId, liked } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLikedSongs, likeSong, unlikeSong, getLikeStatus };
