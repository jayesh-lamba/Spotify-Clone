const express = require("express");
const router  = express.Router();
const {
  globalSearch,
  getSearchHistory,
  clearSearchHistory,
  deleteSearchHistoryEntry,
} = require("../controllers/searchController");
const { protect } = require("../middleware/authMiddleware");

// Public search (saves history if user is authenticated)
// Middleware: optionally attach user from token without blocking
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  const token  = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return next();

  try {
    const jwt  = require("jsonwebtoken");
    const User = require("../models/User");
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.userId).select("-password").lean();
  } catch (_) {
    // Invalid token — just proceed unauthenticated
  }
  next();
};

// GET /api/search?q=...
router.get("/", optionalAuth, globalSearch);

// History routes — require auth
router.get("/history",       protect, getSearchHistory);
router.delete("/history",    protect, clearSearchHistory);
router.delete("/history/:id", protect, deleteSearchHistoryEntry);

module.exports = router;
