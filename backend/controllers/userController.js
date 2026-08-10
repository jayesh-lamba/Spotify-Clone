const bcrypt = require("bcryptjs");
const User   = require("../models/User");

// ---------------------------------------------------------------------------
// Helper: build a safe user object — never exposes password field
// ---------------------------------------------------------------------------
const safeUser = (user) => ({
  id:           user._id,
  username:     user.username,
  email:        user.email,
  profileImage: user.profileImage,
  role:         user.role || "user",
  pinnedPlaylists: user.pinnedPlaylists || [],
  settings:     user.settings,
  createdAt:    user.createdAt,
});

// ---------------------------------------------------------------------------
// GET /api/me/profile
// ---------------------------------------------------------------------------
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, data: safeUser(user) });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/me/profile  — update username / email / profileImage
// ---------------------------------------------------------------------------
const updateProfile = async (req, res, next) => {
  try {
    const { username, email, profileImage } = req.body;

    if (username !== undefined && String(username).trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 2 characters.",
      });
    }

    const updates = {};
    if (username !== undefined) updates.username = String(username).trim();
    if (profileImage !== undefined) updates.profileImage = String(profileImage).trim();

    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      // Check if email already taken by another user
      const existing = await User.findOne({
        email: cleanEmail,
        _id: { $ne: req.user._id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use by another account.",
        });
      }
      updates.email = cleanEmail;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided to update." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/me/settings  — update user settings (partial)
// ---------------------------------------------------------------------------
const ALLOWED_SETTINGS = [
  "audioQuality",
  "autoplay",
  "crossfade",
  "theme",
  "animations",
  "newReleasesNotif",
  "recommendationsNotif",
  "privateSession",
  "personalizedRecs",
];

const VALID_AUDIO_QUALITY = ["Automatic", "Low", "Normal", "High"];
const VALID_THEME         = ["Dark", "Light", "System Default"];

const updateSettings = async (req, res, next) => {
  try {
    const updates = {};

    for (const key of ALLOWED_SETTINGS) {
      if (req.body[key] === undefined) continue;

      // Validate enums
      if (key === "audioQuality" && !VALID_AUDIO_QUALITY.includes(req.body[key])) {
        return res.status(400).json({
          success: false,
          message: `audioQuality must be one of: ${VALID_AUDIO_QUALITY.join(", ")}.`,
        });
      }
      if (key === "theme" && !VALID_THEME.includes(req.body[key])) {
        return res.status(400).json({
          success: false,
          message: `theme must be one of: ${VALID_THEME.join(", ")}.`,
        });
      }

      updates[`settings.${key}`] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid settings fields provided." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Settings updated.",
      data: { settings: user.settings },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/me/change-password
// ---------------------------------------------------------------------------
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: "Current password is required." });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    // Fetch user with password field
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    const salt         = await bcrypt.genSalt(10);
    user.password      = await bcrypt.hash(String(newPassword), salt);
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/me  — delete account (protected; requires confirmation)
// ---------------------------------------------------------------------------
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password confirmation is required." });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Password is incorrect." });
    }

    await user.deleteOne();

    return res.status(200).json({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/analytics  — Admin dashboard metrics
// ---------------------------------------------------------------------------
const getAdminAnalytics = async (req, res, next) => {
  try {
    const Song = require("../models/Song");
    const Artist = require("../models/Artist");
    const Album = require("../models/Album");
    const Playlist = require("../models/Playlist");

    const [
      totalUsers,
      totalSongs,
      totalArtists,
      totalAlbums,
      totalPlaylists,
      topPlayedSongs,
      recentSongs,
    ] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Artist.countDocuments(),
      Album.countDocuments(),
      Playlist.countDocuments(),
      Song.find().sort({ playsCount: -1 }).limit(10).lean(),
      Song.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSongs,
        totalArtists,
        totalAlbums,
        totalPlaylists,
        topPlayedSongs,
        recentSongs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSettings,
  changePassword,
  deleteAccount,
  getAdminAnalytics,
};
