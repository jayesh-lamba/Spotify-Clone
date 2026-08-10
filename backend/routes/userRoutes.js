const express = require("express");
const router  = express.Router();
const {
  getProfile,
  updateProfile,
  updateSettings,
  changePassword,
  deleteAccount,
} = require("../controllers/userController");
const {
  getLikedSongs,
  likeSong,
  unlikeSong,
  getLikeStatus,
} = require("../controllers/likedSongsController");
const {
  getRecentlyPlayed,
  recordRecentlyPlayed,
  clearRecentlyPlayed,
} = require("../controllers/recentlyPlayedController");
const { protect } = require("../middleware/authMiddleware");

// All /api/me routes require authentication
router.use(protect);

// ----- Profile -----
router.get("/profile",         getProfile);
router.put("/profile",         updateProfile);

// ----- Settings -----
router.put("/settings",        updateSettings);

// ----- Password -----
router.put("/change-password", changePassword);

// ----- Delete account -----
router.delete("/",             deleteAccount);

// ----- Liked Songs -----
router.get("/liked-songs",                    getLikedSongs);
router.post("/liked-songs/:songId",           likeSong);
router.delete("/liked-songs/:songId",         unlikeSong);
router.get("/liked-songs/:songId/status",     getLikeStatus);

// ----- Recently Played -----
router.get("/recently-played",    getRecentlyPlayed);
router.post("/recently-played",   recordRecentlyPlayed);
router.delete("/recently-played", clearRecentlyPlayed);

module.exports = router;
