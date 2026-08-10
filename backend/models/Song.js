const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
      index: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
    },
    artistName: {
      type: String,
      required: [true, "Artist name is required"],
      trim: true,
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },
    albumName: {
      type: String,
      default: "Single",
      trim: true,
    },
    albumArtist: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "Song duration format is required"],
      trim: true,
    },
    durationSeconds: {
      type: Number,
      required: [true, "Song duration in seconds is required"],
      min: [0, "Duration seconds cannot be negative"],
    },
    audioUrl: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    lyrics: {
      type: String,
      default: null,
    },
    lyricsSource: {
      type: String,
      default: null,
    },
    genre: {
      type: String,
      default: "Pop",
      trim: true,
    },
    year: {
      type: Number,
      default: null,
    },
    trackNumber: {
      type: Number,
      default: null,
    },
    discNumber: {
      type: Number,
      default: null,
    },
    composer: {
      type: String,
      default: "",
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    filePath: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    fileHash: {
      type: String,
      default: "",
    },
    playsCount: {
      type: Number,
      default: 0,
      min: [0, "Plays count cannot be negative"],
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search functionality across title, artist name, album name, and genre
songSchema.index({ title: "text", artistName: "text", genre: "text", albumName: "text" });

// Additional indexes for trending and popular sorting
songSchema.index({ isTrending: -1, playsCount: -1 });

const Song = mongoose.model("Song", songSchema);

module.exports = Song;
