const User = require("../models/User");
const Song = require("../models/Song");
const isValidObjectId = require("../utils/validateObjectId");

const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

const MAX_RECENTLY_PLAYED = 50;

// ---------------------------------------------------------------------------
// GET /api/me/recently-played
// ---------------------------------------------------------------------------
const getRecentlyPlayed = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 20)));

    const user = await User.findById(req.user._id)
      .populate({
        path: "recentlyPlayed.song",
        populate: [
          { path: "artist", select: "name image" },
          { path: "album",  select: "title coverImage" },
        ],
      })
      .select("recentlyPlayed")
      .lean();

    // Sort by playedAt desc and cap
    const recent = (user.recentlyPlayed || [])
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt))
      .slice(0, limit);

    return res.status(200).json({ success: true, count: recent.length, data: recent });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/me/recently-played  — record a play
// Body: { songId }
// Also increments the song's playsCount.
// ---------------------------------------------------------------------------
const recordRecentlyPlayed = async (req, res, next) => {
  try {
    const { songId } = req.body;
    if (!songId || !isValidObjectId(songId)) {
      return res.status(400).json({ success: false, message: "Valid songId is required." });
    }

    const song = await Song.findById(songId).lean();
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    const user = await User.findById(req.user._id).select("recentlyPlayed");

    // Remove any existing entry for the same song to avoid duplicates
    user.recentlyPlayed = user.recentlyPlayed.filter(
      (entry) => String(entry.song) !== String(songId)
    );

    // Prepend new entry
    user.recentlyPlayed.unshift({ song: songId, playedAt: new Date() });

    // Trim to max size
    if (user.recentlyPlayed.length > MAX_RECENTLY_PLAYED) {
      user.recentlyPlayed = user.recentlyPlayed.slice(0, MAX_RECENTLY_PLAYED);
    }

    // Increment playsCount on the song (fire-and-forget)
    Song.findByIdAndUpdate(songId, { $inc: { playsCount: 1 } }).exec().catch(() => {});

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Play recorded.",
      data: { songId, playedAt: user.recentlyPlayed[0].playedAt },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/me/recently-played  — clear all recently played
// ---------------------------------------------------------------------------
const clearRecentlyPlayed = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { recentlyPlayed: [] } });
    return res.status(200).json({ success: true, message: "Recently played history cleared." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecentlyPlayed, recordRecentlyPlayed, clearRecentlyPlayed };
