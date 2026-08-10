const Playlist = require("../models/Playlist");
const Song     = require("../models/Song");
const isValidObjectId = require("../utils/validateObjectId");

const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

// ---------------------------------------------------------------------------
// Helper: verify caller owns the playlist (or playlist is public for reads)
// ---------------------------------------------------------------------------
const assertOwner = (playlist, userId) => {
  return String(playlist.creator._id || playlist.creator) === String(userId);
};

// ---------------------------------------------------------------------------
// GET /api/playlists  — current user's playlists
// ---------------------------------------------------------------------------
const getMyPlaylists = async (req, res, next) => {
  try {
    const page  = Math.max(1, toInt(req.query.page,  1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 50)));
    const skip  = (page - 1) * limit;

    const [playlists, total] = await Promise.all([
      Playlist.find({ creator: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("songs", "title artistName albumName duration durationSeconds coverImage playsCount genre audioUrl")
        .lean(),
      Playlist.countDocuments({ creator: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: playlists,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/playlists/:id
// ---------------------------------------------------------------------------
const getPlaylistById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID." });
    }

    const playlist = await Playlist.findById(req.params.id)
      .populate("creator", "username profileImage")
      .populate("songs", "title artistName albumName duration durationSeconds coverImage playsCount genre audioUrl")
      .lean();

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found." });
    }

    // Private playlists: only owner may see them
    if (
      playlist.privacy === "Private" &&
      String(playlist.creator._id || playlist.creator) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied. This playlist is private." });
    }

    return res.status(200).json({ success: true, data: playlist });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/playlists
// ---------------------------------------------------------------------------
const createPlaylist = async (req, res, next) => {
  try {
    const { name, description, coverImage, privacy, songs, songIds } = req.body;

    if (!name || String(name).trim() === "") {
      return res.status(400).json({ success: false, message: "Playlist name is required." });
    }

    const rawSongs = Array.isArray(songs) ? songs : Array.isArray(songIds) ? songIds : [];
    const candidateIds = [];
    const seen = new Set();
    for (const s of rawSongs) {
      const id = String(s?._id || s?.id || s);
      if (isValidObjectId(id) && !seen.has(id)) {
        seen.add(id);
        candidateIds.push(id);
      }
    }

    let songList = [];
    if (candidateIds.length > 0) {
      const dbSongs = await Song.find({ _id: { $in: candidateIds } }).select("_id").lean();
      const validDbIds = new Set(dbSongs.map((s) => String(s._id)));
      songList = candidateIds.filter((id) => validDbIds.has(id));
    }

    const created = await Playlist.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      coverImage: coverImage || "",
      creator: req.user._id,
      privacy: privacy === "Private" ? "Private" : "Public",
      songs: songList,
    });

    const playlist = await Playlist.findById(created._id)
      .populate("creator", "username profileImage")
      .populate("songs", "title artistName albumName duration durationSeconds coverImage playsCount genre audioUrl")
      .lean();

    return res.status(201).json({ success: true, message: "Playlist created.", data: playlist });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/playlists/:id
// ---------------------------------------------------------------------------
const updatePlaylist = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID." });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found." });
    }
    if (!assertOwner(playlist, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this playlist." });
    }

    const allowed = ["name", "description", "coverImage", "privacy"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) playlist[key] = req.body[key];
    }

    await playlist.save();

    return res.status(200).json({ success: true, message: "Playlist updated.", data: playlist });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/playlists/:id
// ---------------------------------------------------------------------------
const deletePlaylist = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID." });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found." });
    }
    if (!assertOwner(playlist, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this playlist." });
    }

    await playlist.deleteOne();

    return res.status(200).json({ success: true, message: "Playlist deleted." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/playlists/:id/songs  — add a song
// Body: { songId }
// ---------------------------------------------------------------------------
const addSongToPlaylist = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID." });
    }

    const { songId } = req.body;
    if (!songId || !isValidObjectId(songId)) {
      return res.status(400).json({ success: false, message: "Valid songId is required." });
    }

    const [playlist, song] = await Promise.all([
      Playlist.findById(req.params.id),
      Song.findById(songId).lean(),
    ]);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found." });
    }
    if (!assertOwner(playlist, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this playlist." });
    }
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    const alreadyIn = playlist.songs.some((s) => String(s) === String(songId));
    if (alreadyIn) {
      return res.status(409).json({ success: false, message: "Song is already in this playlist." });
    }

    playlist.songs.push(songId);
    await playlist.save();

    return res.status(200).json({
      success: true,
      message: "Song added to playlist.",
      data: { playlistId: playlist._id, songId },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/playlists/:id/songs/:songId  — remove a song
// ---------------------------------------------------------------------------
const removeSongFromPlaylist = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID." });
    }
    if (!isValidObjectId(req.params.songId)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found." });
    }
    if (!assertOwner(playlist, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this playlist." });
    }

    const before = playlist.songs.length;
    playlist.songs = playlist.songs.filter((s) => String(s) !== String(req.params.songId));

    if (playlist.songs.length === before) {
      return res.status(404).json({ success: false, message: "Song not found in this playlist." });
    }

    await playlist.save();

    return res.status(200).json({ success: true, message: "Song removed from playlist." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/playlists/:id/songs/reorder
// Body: { songs: ["id1", "id2", ...] } — full reordered array of song IDs
// ---------------------------------------------------------------------------
const reorderPlaylistSongs = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID." });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found." });
    }
    if (!assertOwner(playlist, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this playlist." });
    }

    const { songs: newOrderRaw } = req.body;
    if (!Array.isArray(newOrderRaw)) {
      return res.status(400).json({ success: false, message: "songs must be an array of song IDs." });
    }

    // Validate all incoming IDs
    const incomingIds = newOrderRaw.map((s) => String(s?._id || s?.id || s));
    if (incomingIds.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ success: false, message: "All song IDs must be valid ObjectIds." });
    }

    // Ensure the set matches exactly — no phantom additions or removals
    const existingSet = new Set(playlist.songs.map(String));
    const incomingSet = new Set(incomingIds);

    if (existingSet.size !== incomingSet.size) {
      return res.status(400).json({ success: false, message: "Reorder array must contain the same songs as the playlist." });
    }
    for (const id of incomingSet) {
      if (!existingSet.has(id)) {
        return res.status(400).json({ success: false, message: `Song ${id} is not in this playlist.` });
      }
    }

    playlist.songs = incomingIds;
    await playlist.save();

    const updated = await Playlist.findById(playlist._id)
      .populate("creator", "username profileImage")
      .populate("songs", "title artistName albumName duration durationSeconds coverImage playsCount genre audioUrl")
      .lean();

    return res.status(200).json({ success: true, message: "Playlist order updated.", data: updated });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/playlists/:id/pin  — Pin / Unpin a playlist for current user
// ---------------------------------------------------------------------------
const togglePinPlaylist = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID." });
    }

    const User = require("../models/User");
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const playlistIdStr = String(req.params.id);
    const existingIndex = user.pinnedPlaylists.findIndex((id) => String(id) === playlistIdStr);

    let isPinned = false;
    if (existingIndex > -1) {
      user.pinnedPlaylists.splice(existingIndex, 1);
      isPinned = false;
    } else {
      user.pinnedPlaylists.push(req.params.id);
      isPinned = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: isPinned ? "Playlist pinned to library top." : "Playlist unpinned.",
      isPinned,
      pinnedPlaylists: user.pinnedPlaylists,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  togglePinPlaylist,
};
