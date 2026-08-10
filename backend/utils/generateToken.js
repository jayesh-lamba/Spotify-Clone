const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for a given user ID.
 * JWT_SECRET must be set in environment variables.
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim() === "") {
    throw new Error(
      "JWT_SECRET environment variable is not configured. Cannot generate token."
    );
  }

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

module.exports = generateToken;
