/**
 * ORIVIO — Idempotent Database Seed Script
 *
 * Usage:  node backend/seed.js
 *
 * - Idempotent: safe to run multiple times; existing records are not duplicated.
 * - Uses upsert on unique identifiers (artist name, album title+artist, song title+artistName).
 * - Matches songs shown in the frontend: Blinding Lights, Devil Is a Lie,
 *   All Eyes On Me, Everyday Normal Guy 2, Happy Nation, That's Why, Starboy,
 *   Perfect, Night Changes, etc.
 * - Does NOT invent working audio URLs.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Artist   = require("./models/Artist");
const Album    = require("./models/Album");
const Song     = require("./models/Song");
const Playlist = require("./models/Playlist");
const User     = require("./models/User");

// ─── Seed Data ────────────────────────────────────────────────────────────────

const ARTISTS = [
  {
    name:            "The Weeknd",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/26035.jpg",
    bio:             "Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer, songwriter, and record producer. He is known for his sonic versatility and dark lyrical themes.",
    monthlyListeners: 85_000_000,
  },
  {
    name:            "Ed Sheeran",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/16938.jpg",
    bio:             "Edward Christopher Sheeran is an English singer, songwriter, record producer, and musician. He has sold more than 150 million records worldwide.",
    monthlyListeners: 70_000_000,
  },
  {
    name:            "One Direction",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/8652.jpg",
    bio:             "One Direction are a British-Irish pop boy band formed in London, England in 2010. The group consists of Niall Horan, Liam Payne, Harry Styles, Louis Tomlinson, and Zayn Malik.",
    monthlyListeners: 45_000_000,
  },
  {
    name:            "Post Malone",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/17045.jpg",
    bio:             "Austin Richard Post, known professionally as Post Malone, is an American rapper, singer, songwriter, and record producer.",
    monthlyListeners: 55_000_000,
  },
  {
    name:            "Billie Eilish",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/25777.jpg",
    bio:             "Billie Eilish Pirate Baird O'Connell is an American singer and songwriter known for her unconventional approach to pop music.",
    monthlyListeners: 60_000_000,
  },
  {
    name:            "Tommy Richman",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg",
    bio:             "Tommy Richman is an American singer and songwriter known for blending soul, R&B, and pop influences.",
    monthlyListeners: 12_000_000,
  },
  {
    name:            "Orivio Artist",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/11990.jpeg",
    bio:             "Orivio Artist is a featured musician on the ORIVIO platform, celebrated for genre-blending originals.",
    monthlyListeners: 8_000_000,
  },
  {
    name:            "Jon Lajoie",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/10635.jpg",
    bio:             "Jonathan Lajoie is a Canadian comedian, actor, singer, rapper, and filmmaker known for his comedic songs.",
    monthlyListeners: 5_000_000,
  },
  {
    name:            "Ace of Base",
    image:           "https://4kwallpapers.com/images/walls/thumbs_3t/11231.jpeg",
    bio:             "Ace of Base is a Swedish pop group formed in Gothenburg in 1987, known for their 1990s Eurodance hits.",
    monthlyListeners: 15_000_000,
  },
];

// Albums (title + artistName used as uniqueness key during upsert)
const ALBUMS_RAW = [
  {
    artistName:  "The Weeknd",
    title:       "After Hours",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/11990.jpeg",
    releaseYear: 2020,
  },
  {
    artistName:  "The Weeknd",
    title:       "Starboy",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/11231.jpeg",
    releaseYear: 2016,
  },
  {
    artistName:  "One Direction",
    title:       "Midnight Memories",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/8652.jpg",
    releaseYear: 2013,
  },
  {
    artistName:  "Ed Sheeran",
    title:       "Divide",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/16938.jpg",
    releaseYear: 2017,
  },
  {
    artistName:  "Post Malone",
    title:       "Hollywood's Bleeding",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/17045.jpg",
    releaseYear: 2019,
  },
  {
    artistName:  "Billie Eilish",
    title:       "Happier Than Ever",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/25777.jpg",
    releaseYear: 2021,
  },
  {
    artistName:  "Tommy Richman",
    title:       "Coyote",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/26035.jpg",
    releaseYear: 2024,
  },
  {
    artistName:  "Jon Lajoie",
    title:       "Everyday Normal Guy",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/10635.jpg",
    releaseYear: 2010,
  },
  {
    artistName:  "Ace of Base",
    title:       "Happy Nation",
    coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/11231.jpeg",
    releaseYear: 1992,
  },
];

// Songs (title + artistName used as uniqueness key)
const SONGS_RAW = [
  // ── The Weeknd ──────────────────────────────────────────────────────
  {
    title:           "Blinding Lights",
    artistName:      "The Weeknd",
    albumTitle:      "After Hours",
    duration:        "3:20",
    durationSeconds: 200,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/26035.jpg",
    genre:           "Synth-pop",
    isTrending:      true,
    playsCount:      4_200_000,
  },
  {
    title:           "Starboy",
    artistName:      "The Weeknd",
    albumTitle:      "Starboy",
    duration:        "3:51",
    durationSeconds: 231,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/7769.jpg",
    genre:           "R&B",
    isTrending:      true,
    playsCount:      3_800_000,
  },
  {
    title:           "Save Your Tears",
    artistName:      "The Weeknd",
    albumTitle:      "After Hours",
    duration:        "3:35",
    durationSeconds: 215,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/11990.jpeg",
    genre:           "Synth-pop",
    isTrending:      false,
    playsCount:      3_100_000,
  },
  {
    title:           "The Hills",
    artistName:      "The Weeknd",
    albumTitle:      "After Hours",
    duration:        "3:55",
    durationSeconds: 235,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/11990.jpeg",
    genre:           "R&B",
    isTrending:      false,
    playsCount:      2_900_000,
  },
  // ── Ed Sheeran ──────────────────────────────────────────────────────
  {
    title:           "Perfect",
    artistName:      "Ed Sheeran",
    albumTitle:      "Divide",
    duration:        "4:23",
    durationSeconds: 263,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/16938.jpg",
    genre:           "Pop",
    isTrending:      true,
    playsCount:      3_600_000,
  },
  {
    title:           "Shape of You",
    artistName:      "Ed Sheeran",
    albumTitle:      "Divide",
    duration:        "3:53",
    durationSeconds: 233,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/16938.jpg",
    genre:           "Pop",
    isTrending:      true,
    playsCount:      4_100_000,
  },
  {
    title:           "Thinking Out Loud",
    artistName:      "Ed Sheeran",
    albumTitle:      "Divide",
    duration:        "4:41",
    durationSeconds: 281,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/16938.jpg",
    genre:           "Pop",
    isTrending:      false,
    playsCount:      2_800_000,
  },
  // ── One Direction ───────────────────────────────────────────────────
  {
    title:           "Night Changes",
    artistName:      "One Direction",
    albumTitle:      "Midnight Memories",
    duration:        "3:59",
    durationSeconds: 239,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/10635.jpg",
    genre:           "Pop",
    isTrending:      true,
    playsCount:      2_500_000,
  },
  {
    title:           "Story of My Life",
    artistName:      "One Direction",
    albumTitle:      "Midnight Memories",
    duration:        "4:01",
    durationSeconds: 241,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/8652.jpg",
    genre:           "Pop",
    isTrending:      false,
    playsCount:      2_100_000,
  },
  // ── Post Malone ─────────────────────────────────────────────────────
  {
    title:           "Rockstar",
    artistName:      "Post Malone",
    albumTitle:      "Hollywood's Bleeding",
    duration:        "3:39",
    durationSeconds: 219,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/17045.jpg",
    genre:           "Hip-Hop",
    isTrending:      false,
    playsCount:      3_300_000,
  },
  {
    title:           "Circles",
    artistName:      "Post Malone",
    albumTitle:      "Hollywood's Bleeding",
    duration:        "3:35",
    durationSeconds: 215,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/17045.jpg",
    genre:           "Pop",
    isTrending:      false,
    playsCount:      2_700_000,
  },
  // ── Billie Eilish ───────────────────────────────────────────────────
  {
    title:           "Bad Guy",
    artistName:      "Billie Eilish",
    albumTitle:      "Happier Than Ever",
    duration:        "3:14",
    durationSeconds: 194,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/25777.jpg",
    genre:           "Electropop",
    isTrending:      false,
    playsCount:      3_900_000,
  },
  // ── Tommy Richman ───────────────────────────────────────────────────
  {
    title:           "Devil Is a Lie",
    artistName:      "Tommy Richman",
    albumTitle:      "Coyote",
    duration:        "3:20",
    durationSeconds: 200,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg",
    genre:           "R&B",
    isTrending:      true,
    playsCount:      5_500_000,
  },
  // ── Orivio Artist ───────────────────────────────────────────────────
  {
    title:           "All Eyes On Me",
    artistName:      "Orivio Artist",
    albumTitle:      null,  // Single
    albumName:       "Singles",
    duration:        "3:20",
    durationSeconds: 200,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/11990.jpeg",
    genre:           "Pop",
    isTrending:      true,
    playsCount:      1_800_000,
  },
  {
    title:           "That's Why",
    artistName:      "Orivio Artist",
    albumTitle:      null,  // Single
    albumName:       "Singles",
    duration:        "3:20",
    durationSeconds: 200,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/11990.jpeg",
    genre:           "Pop",
    isTrending:      false,
    playsCount:      950_000,
  },
  // ── Jon Lajoie ──────────────────────────────────────────────────────
  {
    title:           "Everyday Normal Guy 2",
    artistName:      "Jon Lajoie",
    albumTitle:      "Everyday Normal Guy",
    duration:        "3:20",
    durationSeconds: 200,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/10635.jpg",
    genre:           "Comedy",
    isTrending:      false,
    playsCount:      780_000,
  },
  // ── Ace of Base ─────────────────────────────────────────────────────
  {
    title:           "Happy Nation",
    artistName:      "Ace of Base",
    albumTitle:      "Happy Nation",
    duration:        "3:20",
    durationSeconds: 200,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/11231.jpeg",
    genre:           "Eurodance",
    isTrending:      false,
    playsCount:      2_300_000,
  },
  {
    title:           "The Sign",
    artistName:      "Ace of Base",
    albumTitle:      "Happy Nation",
    duration:        "3:08",
    durationSeconds: 188,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/11231.jpeg",
    genre:           "Eurodance",
    isTrending:      false,
    playsCount:      1_900_000,
  },
  // ── Anime Night (featured in Quick Picks) ───────────────────────────
  {
    title:           "Anime Night",
    artistName:      "Orivio Artist",
    albumTitle:      null,
    albumName:       "Singles",
    duration:        "3:45",
    durationSeconds: 225,
    coverImage:      "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg",
    genre:           "Anime",
    isTrending:      true,
    playsCount:      2_100_000,
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function log(msg)  { console.log(`  ✅ ${msg}`); }
function warn(msg) { console.log(`  ⚠️  ${msg}`); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    console.error("❌ MONGODB_URI is not set in .env. Seed aborted.");
    process.exit(1);
  }

  console.log("🌱 Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("✅ Connected.\n");

  // ── 1. Upsert Artists ──────────────────────────────────────────────
  console.log("👤 Seeding artists…");
  const artistMap = {}; // name → _id
  for (const a of ARTISTS) {
    const doc = await Artist.findOneAndUpdate(
      { name: a.name },
      { $setOnInsert: a },
      { upsert: true, new: true }
    );
    artistMap[a.name] = doc._id;
    log(`Artist: ${a.name}`);
  }

  // ── 2. Upsert Albums ───────────────────────────────────────────────
  console.log("\n💿 Seeding albums…");
  const albumMap = {}; // "title|artistName" → _id
  for (const a of ALBUMS_RAW) {
    const artistId = artistMap[a.artistName];
    if (!artistId) { warn(`Artist not found for album: ${a.title}`); continue; }

    const doc = await Album.findOneAndUpdate(
      { title: a.title, artist: artistId },
      { $setOnInsert: { ...a, artist: artistId } },
      { upsert: true, new: true }
    );
    albumMap[`${a.title}|${a.artistName}`] = doc._id;
    log(`Album: ${a.title} (${a.artistName})`);
  }

  // ── 3. Upsert Songs ────────────────────────────────────────────────
  console.log("\n🎵 Seeding songs…");
  const songIds = []; // collect all seeded song ids for demo playlist
  for (const s of SONGS_RAW) {
    const artistId = artistMap[s.artistName];
    if (!artistId) { warn(`Artist not found for song: ${s.title}`); continue; }

    const albumKey = s.albumTitle ? `${s.albumTitle}|${s.artistName}` : null;
    const albumId  = albumKey ? albumMap[albumKey] : undefined;

    const songData = {
      title:           s.title,
      artist:          artistId,
      artistName:      s.artistName,
      duration:        s.duration,
      durationSeconds: s.durationSeconds,
      coverImage:      s.coverImage || "",
      audioUrl:        "",  // No working audio URLs
      genre:           s.genre || "Pop",
      isTrending:      Boolean(s.isTrending),
      playsCount:      s.playsCount || 0,
      albumName:       s.albumTitle || s.albumName || "Single",
    };
    if (albumId) songData.album = albumId;

    const doc = await Song.findOneAndUpdate(
      { title: s.title, artistName: s.artistName },
      { $setOnInsert: songData },
      { upsert: true, new: true }
    );

    // Ensure song is in album's songs array
    if (albumId) {
      await Album.findByIdAndUpdate(albumId, { $addToSet: { songs: doc._id } });
    }

    songIds.push(doc._id);
    log(`Song: "${s.title}" — ${s.artistName}`);
  }

  // ── 4. Demo Playlist (public, no creator required) ─────────────────
  console.log("\n📋 Seeding demo playlist…");
  const DEMO_NAME = "ORIVIO Top Picks";

  // We need a creator user — upsert a demo user
  const demoEmail = "demo@orivio.app";
  const bcrypt    = require("bcryptjs");
  const salt      = await bcrypt.genSalt(10);
  const hash      = await bcrypt.hash("Orivio@2025", salt);

  const demoUser = await User.findOneAndUpdate(
    { email: demoEmail },
    { $setOnInsert: { username: "OrivioDemo", email: demoEmail, password: hash } },
    { upsert: true, new: true }
  );
  log(`Demo user: ${demoEmail}`);

  // Trending songs for the playlist
  const trendingSongIds = SONGS_RAW
    .filter((s) => s.isTrending)
    .map((s) => {
      // find its _id from songIds by matching index
      const idx = SONGS_RAW.indexOf(s);
      return songIds[idx];
    })
    .filter(Boolean);

  await Playlist.findOneAndUpdate(
    { name: DEMO_NAME, creator: demoUser._id },
    {
      $setOnInsert: {
        name:        DEMO_NAME,
        description: "Hand-picked trending tracks on ORIVIO.",
        coverImage:  "https://4kwallpapers.com/images/walls/thumbs_3t/26035.jpg",
        creator:     demoUser._id,
        privacy:     "Public",
        songs:       trendingSongIds,
      },
    },
    { upsert: true, new: true }
  );
  log(`Playlist: "${DEMO_NAME}"`);

  console.log("\n🎉 Seed complete!\n");
  console.log("─────────────────────────────────────────────────────");
  console.log(`  Artists seeded : ${ARTISTS.length}`);
  console.log(`  Albums seeded  : ${ALBUMS_RAW.length}`);
  console.log(`  Songs seeded   : ${SONGS_RAW.length}`);
  console.log(`  Playlist       : "${DEMO_NAME}"`);
  console.log(`  Demo user      : ${demoEmail} / Orivio@2025`);
  console.log("─────────────────────────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
