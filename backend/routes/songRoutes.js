const express = require("express");
const router  = express.Router();
const {
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
} = require("../controllers/songController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

// GET  /api/songs/search?q=...
router.get("/search", searchSongs);

// GET  /api/songs/trending
router.get("/trending", getTrendingSongs);

// GET  /api/songs/recommendations
router.get("/recommendations", optionalAuth, getRecommendations);

// GET  /api/songs
router.get("/", getSongs);

// POST /api/songs  (requires auth)
router.post("/", protect, createSong);

// GET  /api/songs/:id
router.get("/:id", getSongById);

// GET  /api/songs/:id/stream  — Secure audio streaming with Range support
router.get("/:id/stream", streamSong);

// GET  /api/songs/:id/audio   — Alias for audio streaming
router.get("/:id/audio", streamSong);

// GET  /api/songs/:id/lyrics
router.get("/:id/lyrics", getLyrics);

// PUT  /api/songs/:id  (requires auth)
router.put("/:id", protect, updateSong);

// DELETE /api/songs/:id  (requires auth)
router.delete("/:id", protect, deleteSong);

// POST /api/songs/:id/play  — track a play (auth optional but recommended)
router.post("/:id/play", trackPlay);

module.exports = router;
