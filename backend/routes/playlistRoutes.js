const express = require("express");
const router  = express.Router();
const {
  getMyPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  togglePinPlaylist,
} = require("../controllers/playlistController");
const { protect } = require("../middleware/authMiddleware");

// All playlist routes require authentication
router.use(protect);

// GET  /api/playlists       — list my playlists
router.get("/", getMyPlaylists);

// POST /api/playlists
router.post("/", createPlaylist);

// GET  /api/playlists/:id
router.get("/:id", getPlaylistById);

// PUT  /api/playlists/:id
router.put("/:id", updatePlaylist);

// PUT  /api/playlists/:id/pin  — pin/unpin playlist
router.put("/:id/pin", togglePinPlaylist);

// DELETE /api/playlists/:id
router.delete("/:id", deletePlaylist);

// POST   /api/playlists/:id/songs          — add song
router.post("/:id/songs", addSongToPlaylist);

// PUT    /api/playlists/:id/songs/reorder  — reorder songs
router.put("/:id/songs/reorder", reorderPlaylistSongs);

// DELETE /api/playlists/:id/songs/:songId  — remove song
router.delete("/:id/songs/:songId", removeSongFromPlaylist);

module.exports = router;
