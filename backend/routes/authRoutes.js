const express = require("express");
const router = express.Router();
const { signup, login, getMe, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me  (protected)
router.get("/me", protect, getMe);

// POST /api/auth/logout
router.post("/logout", logout);

module.exports = router;
