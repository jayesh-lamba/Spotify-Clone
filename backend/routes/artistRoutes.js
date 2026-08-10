const express = require("express");
const router  = express.Router();
const {
  getArtists,
  searchArtists,
  getArtistById,
  getArtistSongs,
} = require("../controllers/artistController");

// GET /api/artists/search?q=...
router.get("/search", searchArtists);

// GET /api/artists
router.get("/", getArtists);

// GET /api/artists/:id
router.get("/:id", getArtistById);

// GET /api/artists/:id/songs
router.get("/:id/songs", getArtistSongs);

module.exports = router;
