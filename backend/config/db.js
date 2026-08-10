const mongoose = require("mongoose");

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
