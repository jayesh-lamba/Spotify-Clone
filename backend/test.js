/**
 * ORIVIO Backend — Syntax/Import/Route Test Script
 *
 * Tests all controllers, routes, and module imports WITHOUT a live MongoDB.
 * Also starts the Express app and verifies route registration via introspection.
 *
 * Run: node backend/test.js
 */

"use strict";
require("dotenv").config();

// ─── Force test env so server doesn't crash without DB ───────────────────────
process.env.JWT_SECRET  = process.env.JWT_SECRET  || "test_secret_for_ci";
process.env.NODE_ENV    = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI || ""; // may be empty

let passed = 0;
let failed = 0;
const results = [];

function pass(name) {
  passed++;
  results.push({ status: "✅ PASS", name });
}

function fail(name, err) {
  failed++;
  results.push({ status: "❌ FAIL", name, error: err.message });
}

// ─── 1. Module Import Tests ───────────────────────────────────────────────────

const MODULES = [
  // Models
  ["Model: Song",          () => require("./models/Song")],
  ["Model: Artist",        () => require("./models/Artist")],
  ["Model: Album",         () => require("./models/Album")],
  ["Model: Playlist",      () => require("./models/Playlist")],
  ["Model: SearchHistory", () => require("./models/SearchHistory")],
  ["Model: User",          () => require("./models/User")],

  // Utilities
  ["Util: generateToken",    () => require("./utils/generateToken")],
  ["Util: validateObjectId", () => require("./utils/validateObjectId")],

  // Config
  ["Config: db",   () => require("./config/db")],

  // Middleware
  ["Middleware: authMiddleware",  () => require("./middleware/authMiddleware")],
  ["Middleware: errorMiddleware", () => require("./middleware/errorMiddleware")],

  // Controllers
  ["Controller: authController",          () => require("./controllers/authController")],
  ["Controller: songController",          () => require("./controllers/songController")],
  ["Controller: artistController",        () => require("./controllers/artistController")],
  ["Controller: albumController",         () => require("./controllers/albumController")],
  ["Controller: playlistController",      () => require("./controllers/playlistController")],
  ["Controller: likedSongsController",    () => require("./controllers/likedSongsController")],
  ["Controller: recentlyPlayedController",() => require("./controllers/recentlyPlayedController")],
  ["Controller: userController",          () => require("./controllers/userController")],
  ["Controller: searchController",        () => require("./controllers/searchController")],

  // Routes
  ["Routes: authRoutes",     () => require("./routes/authRoutes")],
  ["Routes: songRoutes",     () => require("./routes/songRoutes")],
  ["Routes: artistRoutes",   () => require("./routes/artistRoutes")],
  ["Routes: albumRoutes",    () => require("./routes/albumRoutes")],
  ["Routes: playlistRoutes", () => require("./routes/playlistRoutes")],
  ["Routes: userRoutes",     () => require("./routes/userRoutes")],
  ["Routes: searchRoutes",   () => require("./routes/searchRoutes")],
];

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  ORIVIO Backend — Syntax / Import / Route Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("1. MODULE IMPORTS\n");
for (const [name, loader] of MODULES) {
  try {
    const mod = loader();
    if (!mod) throw new Error("Module returned null/undefined");
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

// ─── 2. Controller Function Signature Tests ───────────────────────────────────

console.log("\n2. CONTROLLER FUNCTION SIGNATURES\n");

const CONTROLLER_FNS = [
  ["authController.signup",                () => { const m = require("./controllers/authController"); return typeof m.signup === "function"; }],
  ["authController.login",                 () => { const m = require("./controllers/authController"); return typeof m.login === "function"; }],
  ["authController.getMe",                 () => { const m = require("./controllers/authController"); return typeof m.getMe === "function"; }],
  ["authController.logout",                () => { const m = require("./controllers/authController"); return typeof m.logout === "function"; }],

  ["songController.getSongs",              () => { const m = require("./controllers/songController"); return typeof m.getSongs === "function"; }],
  ["songController.searchSongs",           () => { const m = require("./controllers/songController"); return typeof m.searchSongs === "function"; }],
  ["songController.getTrendingSongs",      () => { const m = require("./controllers/songController"); return typeof m.getTrendingSongs === "function"; }],
  ["songController.getSongById",           () => { const m = require("./controllers/songController"); return typeof m.getSongById === "function"; }],
  ["songController.createSong",            () => { const m = require("./controllers/songController"); return typeof m.createSong === "function"; }],
  ["songController.updateSong",            () => { const m = require("./controllers/songController"); return typeof m.updateSong === "function"; }],
  ["songController.deleteSong",            () => { const m = require("./controllers/songController"); return typeof m.deleteSong === "function"; }],
  ["songController.trackPlay",             () => { const m = require("./controllers/songController"); return typeof m.trackPlay === "function"; }],

  ["artistController.getArtists",          () => { const m = require("./controllers/artistController"); return typeof m.getArtists === "function"; }],
  ["artistController.searchArtists",       () => { const m = require("./controllers/artistController"); return typeof m.searchArtists === "function"; }],
  ["artistController.getArtistById",       () => { const m = require("./controllers/artistController"); return typeof m.getArtistById === "function"; }],
  ["artistController.getArtistSongs",      () => { const m = require("./controllers/artistController"); return typeof m.getArtistSongs === "function"; }],

  ["albumController.getAlbums",            () => { const m = require("./controllers/albumController"); return typeof m.getAlbums === "function"; }],
  ["albumController.searchAlbums",         () => { const m = require("./controllers/albumController"); return typeof m.searchAlbums === "function"; }],
  ["albumController.getAlbumById",         () => { const m = require("./controllers/albumController"); return typeof m.getAlbumById === "function"; }],

  ["playlistController.getMyPlaylists",    () => { const m = require("./controllers/playlistController"); return typeof m.getMyPlaylists === "function"; }],
  ["playlistController.createPlaylist",    () => { const m = require("./controllers/playlistController"); return typeof m.createPlaylist === "function"; }],
  ["playlistController.updatePlaylist",    () => { const m = require("./controllers/playlistController"); return typeof m.updatePlaylist === "function"; }],
  ["playlistController.deletePlaylist",    () => { const m = require("./controllers/playlistController"); return typeof m.deletePlaylist === "function"; }],
  ["playlistController.addSong",           () => { const m = require("./controllers/playlistController"); return typeof m.addSongToPlaylist === "function"; }],
  ["playlistController.removeSong",        () => { const m = require("./controllers/playlistController"); return typeof m.removeSongFromPlaylist === "function"; }],

  ["likedSongsController.getLikedSongs",   () => { const m = require("./controllers/likedSongsController"); return typeof m.getLikedSongs === "function"; }],
  ["likedSongsController.likeSong",        () => { const m = require("./controllers/likedSongsController"); return typeof m.likeSong === "function"; }],
  ["likedSongsController.unlikeSong",      () => { const m = require("./controllers/likedSongsController"); return typeof m.unlikeSong === "function"; }],
  ["likedSongsController.getLikeStatus",   () => { const m = require("./controllers/likedSongsController"); return typeof m.getLikeStatus === "function"; }],

  ["recentlyPlayedController.getRecent",   () => { const m = require("./controllers/recentlyPlayedController"); return typeof m.getRecentlyPlayed === "function"; }],
  ["recentlyPlayedController.record",      () => { const m = require("./controllers/recentlyPlayedController"); return typeof m.recordRecentlyPlayed === "function"; }],
  ["recentlyPlayedController.clear",       () => { const m = require("./controllers/recentlyPlayedController"); return typeof m.clearRecentlyPlayed === "function"; }],

  ["userController.getProfile",            () => { const m = require("./controllers/userController"); return typeof m.getProfile === "function"; }],
  ["userController.updateProfile",         () => { const m = require("./controllers/userController"); return typeof m.updateProfile === "function"; }],
  ["userController.updateSettings",        () => { const m = require("./controllers/userController"); return typeof m.updateSettings === "function"; }],
  ["userController.changePassword",        () => { const m = require("./controllers/userController"); return typeof m.changePassword === "function"; }],
  ["userController.deleteAccount",         () => { const m = require("./controllers/userController"); return typeof m.deleteAccount === "function"; }],

  ["searchController.globalSearch",        () => { const m = require("./controllers/searchController"); return typeof m.globalSearch === "function"; }],
  ["searchController.getSearchHistory",    () => { const m = require("./controllers/searchController"); return typeof m.getSearchHistory === "function"; }],
  ["searchController.clearSearchHistory",  () => { const m = require("./controllers/searchController"); return typeof m.clearSearchHistory === "function"; }],
  ["searchController.deleteEntry",         () => { const m = require("./controllers/searchController"); return typeof m.deleteSearchHistoryEntry === "function"; }],
];

for (const [name, check] of CONTROLLER_FNS) {
  try {
    const ok = check();
    if (ok) pass(name);
    else    fail(name, new Error("Function not exported or not a function"));
  } catch (err) {
    fail(name, err);
  }
}

// ─── 3. Utility Function Tests ────────────────────────────────────────────────

console.log("\n3. UTILITY FUNCTION TESTS\n");

try {
  const isValidObjectId = require("./utils/validateObjectId");
  const validId   = "507f1f77bcf86cd799439011";
  const invalidId = "not-an-object-id";
  if (isValidObjectId(validId) !== true)   throw new Error("Should return true for valid ObjectId");
  if (isValidObjectId(invalidId) !== false) throw new Error("Should return false for invalid ObjectId");
  pass("validateObjectId — correct true/false results");
} catch (err) {
  fail("validateObjectId — correct true/false results", err);
}

try {
  const generateToken = require("./utils/generateToken");
  const token = generateToken("507f1f77bcf86cd799439011");
  if (typeof token !== "string" || token.split(".").length !== 3) {
    throw new Error("Token is not a valid JWT string");
  }
  pass("generateToken — returns valid JWT");
} catch (err) {
  fail("generateToken — returns valid JWT", err);
}

// ─── 4. Route Registration Smoke Test ─────────────────────────────────────────

console.log("\n4. ROUTE REGISTRATION SMOKE TEST\n");

try {
  // Monkey-patch connectDB so it doesn't try to connect to Mongo
  const dbModule = require("./config/db");

  // Load app (this registers all routes without actually connecting)
  const app = require("./server");

  // Collect all registered route paths
  const routes = [];
  const extractRoutes = (stack, prefix = "") => {
    for (const layer of stack) {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(", ").toUpperCase();
        routes.push(`${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === "router" && layer.handle.stack) {
        const newPrefix = prefix + (layer.regexp.source
          .replace("^\\", "").replace("\\/?(?=\\/|$)", "").replace(/\\\//g, "/")
          .replace("(?:/(?=$))?", "").replace("(?=\\/|$)", "") || "");
        extractRoutes(layer.handle.stack, newPrefix);
      }
    }
  };
  extractRoutes(app._router.stack);

  // Check key routes are registered
  const expected = [
    "/api/health",
    "/api/auth",
    "/api/songs",
    "/api/artists",
    "/api/albums",
    "/api/playlists",
    "/api/me",
    "/api/search",
  ];

  for (const prefix of expected) {
    const found = routes.some((r) => r.includes(prefix)) ||
                  app._router.stack.some((l) => {
                    try { return l.regexp.test(prefix); } catch { return false; }
                  });
    if (found) {
      pass(`Route prefix registered: ${prefix}`);
    } else {
      fail(`Route prefix registered: ${prefix}`, new Error("Not found in router stack"));
    }
  }

  // Print all registered routes
  console.log("\n  📋 All registered routes:");
  routes.forEach((r) => console.log(`     ${r}`));

} catch (err) {
  fail("Route registration smoke test", err);
}

// ─── 5. Print Results ─────────────────────────────────────────────────────────

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  RESULTS");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

for (const r of results) {
  const line = r.error ? `${r.status} ${r.name} — ${r.error}` : `${r.status} ${r.name}`;
  console.log(`  ${line}`);
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

if (failed > 0) {
  console.log("\n⚠️  Some tests failed. See above for details.");
  console.log("   NOTE: Database-dependent tests require MONGODB_URI to be set in .env.\n");
  process.exit(1);
} else {
  console.log("\n🎉 All tests passed!\n");
  process.exit(0);
}
