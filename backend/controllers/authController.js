const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ---------------------------------------------------------------------------
// Helper: build a safe user object — never exposes password field
// ---------------------------------------------------------------------------
const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  profileImage: user.profileImage,
  role: user.role || "user",
  pinnedPlaylists: user.pinnedPlaylists || [],
  settings: user.settings,
});

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------
const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // --- Validation ---
    if (!username || String(username).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    if (String(username).trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 2 characters.",
      });
    }

    if (!email || String(email).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // --- Check for duplicate account ---
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    // --- Create user ---
    const user = await User.create({
      username: String(username).trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // --- Generate token ---
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // --- Validation ---
    if (!email || String(email).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // --- Find user, explicitly select password for comparison ---
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    // Generic error: don't reveal whether the email exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // --- Compare passwords ---
    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // --- Generate token ---
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me   (protected)
// ---------------------------------------------------------------------------
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware (password already excluded)
    return res.status(200).json({
      success: true,
      user: safeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
const logout = async (req, res, next) => {
  try {
    // JWT is stateless: the server cannot invalidate a token.
    // The client is responsible for deleting the stored token.
    return res.status(200).json({
      success: true,
      message:
        "Logged out successfully. Please remove your token from client storage.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, logout };
