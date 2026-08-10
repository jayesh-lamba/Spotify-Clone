const mongoose = require("mongoose");
const dns = require("dns");

try {
  // Fix local Node.js Windows/ISP DNS SRV lookup issues for MongoDB Atlas (querySrv ECONNREFUSED)
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

/**
 * Connect to MongoDB database
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === "") {
    console.warn("⚠️  [MongoDB] Warning: MONGODB_URI environment variable is not configured.");
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ [MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB] Connection error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
