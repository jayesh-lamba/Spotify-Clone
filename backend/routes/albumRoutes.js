const express = require("express");
const router  = express.Router();
const {
  getAlbums,
  searchAlbums,
  getAlbumById,
} = require("../controllers/albumController");

// GET /api/albums/search?q=...
router.get("/search", searchAlbums);

// GET /api/albums
router.get("/", getAlbums);

// GET /api/albums/:id
router.get("/:id", getAlbumById);

module.exports = router;
