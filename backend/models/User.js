const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema(
  {
    audioQuality: {
      type: String,
      enum: ["Automatic", "Low", "Normal", "High"],
      default: "Automatic",
    },
    autoplay: {
      type: Boolean,
      default: true,
    },
    crossfade: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      enum: ["Dark", "Light", "System Default"],
      default: "Dark",
    },
    animations: {
      type: Boolean,
      default: true,
    },
    newReleasesNotif: {
      type: Boolean,
      default: true,
    },
    recommendationsNotif: {
      type: Boolean,
      default: true,
    },
    privateSession: {
      type: Boolean,
      default: false,
    },
    personalizedRecs: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const recentlyPlayedSchema = new mongoose.Schema(
  {
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    pinnedPlaylists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    recentlyPlayed: [recentlyPlayedSchema],
    settings: {
      type: userSettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
