const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to protect routes requiring authentication.
 * Reads Authorization: Bearer <token> header, verifies the JWT,
 * fetches the user, and attaches a safe user object to req.user.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check for Authorization header with Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token is missing.",
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    return res.status(500).json({
      success: false,
      message: "Server misconfiguration: JWT_SECRET is not set.",
    });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, secret);

    // Fetch user from DB, explicitly excluding password
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User no longer exists.",
      });
    }

    // Attach safe user object to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token has expired.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Access denied. Invalid token.",
    });
  }
};

/**
 * Optional auth middleware: attaches user to req.user if a valid token is present,
 * but does NOT reject the request if no token is provided. Useful for endpoints
 * that return personalized data when authenticated but still serve unauthenticated users.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // proceed without user
  }

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") return next();

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select("-password");
    if (user) req.user = user;
  } catch (_) {
    // Invalid token: proceed without user (do not reject)
  }
  next();
};

module.exports = { protect, optionalAuth };
