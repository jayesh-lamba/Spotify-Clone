const express    = require("express");
const cors       = require("cors");
const dotenv     = require("dotenv");
const mongoose   = require("mongoose");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const path       = require("path");
const connectDB  = require("./config/db");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

// Route imports
const authRoutes     = require("./routes/authRoutes");
const songRoutes     = require("./routes/songRoutes");
const artistRoutes   = require("./routes/artistRoutes");
const albumRoutes    = require("./routes/albumRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const userRoutes     = require("./routes/userRoutes");
const searchRoutes   = require("./routes/searchRoutes");
const adminRoutes    = require("./routes/adminRoutes");

// Load environment variables
dotenv.config();

// Initialize Express App
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────────

// Set security HTTP headers (relaxed media-src for local audio streaming)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", "data:", "blob:", "http://localhost:3000", "http://localhost:5001", "https:"],
        mediaSrc:    ["'self'", "blob:", "http://localhost:5001", "http://localhost:3000"],
        connectSrc:  ["'self'", "http://localhost:3000", "http://localhost:5001"],
        fontSrc:     ["'self'", "https://fonts.gstatic.com"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow cross-origin audio/image requests
  })
);

// CORS — allow the React dev server and same-origin
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Global rate limiter: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(globalLimiter);

// Stricter limiter for auth routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
  },
});

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Static: Album Artwork ────────────────────────────────────────────────────
// Serves files from backend/public/covers/ at GET /api/covers/:filename
const COVERS_DIR = path.join(__dirname, "public", "covers");
if (!require("fs").existsSync(COVERS_DIR)) {
  require("fs").mkdirSync(COVERS_DIR, { recursive: true });
}
app.use("/api/covers", express.static(COVERS_DIR, {
  maxAge: "7d",
  setHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  },
}));

// ─── Database Connection ──────────────────────────────────────────────────────
connectDB();

// ─── Root Endpoint ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ORIVIO Backend API Server is running",
    environment: process.env.NODE_ENV || "development",
    version: "2.0.0",
  });
});

// ─── Health Check (preserved exactly) ────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: "ORIVIO API is running",
    database: {
      status: dbConnected ? "connected" : "disconnected",
      connected: dbConnected,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",      authLimiter, authRoutes);
app.use("/api/songs",     songRoutes);
app.use("/api/artists",   artistRoutes);
app.use("/api/albums",    albumRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/me",        userRoutes);
app.use("/api/search",    searchRoutes);
app.use("/api/admin",     adminRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
// 404 Handler for Unknown Routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 ORIVIO Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`🎵 API Base URL:     http://localhost:${PORT}/api`);
});

module.exports = app;
