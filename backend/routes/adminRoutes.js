const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { protect } = require("../middleware/authMiddleware");
const { getAdminAnalytics } = require("../controllers/userController");
const {
  getMusicManagerSongs,
  scanMusic,
  uploadSong,
  uploadDirectory,
  updateSongMetadata,
  updateSongArtwork,
  updateSongLyrics,
  toggleWatchService,
  cleanMissing,
} = require("../controllers/adminController");

// ─── Configure Multer Storage ─────────────────────────────────────────────────
const tmpDir = path.resolve(__dirname, "../public/covers");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max for large FLAC audio files
});

// Require authentication for all admin / music manager operations
router.use(protect);

// GET  /api/admin/analytics  — system metrics dashboard
router.get("/analytics", getAdminAnalytics);

// GET  /api/admin/music-manager/songs — searchable song table for music manager
router.get("/music-manager/songs", getMusicManagerSongs);

// POST /api/admin/scan-music — trigger recursive music directory scan
router.post("/scan-music", scanMusic);

// POST /api/admin/upload-song — upload single audio file
router.post("/upload-song", upload.single("audio"), uploadSong);

// POST /api/admin/upload-directory — upload folder structure
router.post("/upload-directory", upload.array("files", 200), uploadDirectory);

// PUT  /api/admin/songs/:id/metadata — update song metadata
router.put("/songs/:id/metadata", updateSongMetadata);

// POST /api/admin/songs/:id/artwork — upload & update song cover artwork
router.post("/songs/:id/artwork", upload.single("artwork"), updateSongArtwork);

// PUT  /api/admin/songs/:id/lyrics — add / edit / replace lyrics
router.put("/songs/:id/lyrics", updateSongLyrics);

// POST /api/admin/watch — toggle filesystem watcher
router.post("/watch", toggleWatchService);

// POST /api/admin/clean-missing — remove records of missing audio files
router.post("/clean-missing", cleanMissing);

module.exports = router;
