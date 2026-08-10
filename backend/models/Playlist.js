const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Playlist creator is required"],
    },
    privacy: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fetching a user's playlists quickly
playlistSchema.index({ creator: 1, createdAt: -1 });

const Playlist = mongoose.model("Playlist", playlistSchema);

module.exports = Playlist;
