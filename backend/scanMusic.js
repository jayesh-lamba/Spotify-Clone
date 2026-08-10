/**
 * ORIVIO Music Library Scanner (CLI Entry Point)
 * ════════════════════════════════════════════════════════════════════════════
 * Run:  node scanMusic.js   (or npm run scan-music)
 * Reuses scannerService to perform a complete recursive scan of Music/.
 * ════════════════════════════════════════════════════════════════════════════
 */

"use strict";

const dotenv   = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const { MUSIC_ROOT, COVERS_DIR, runLibraryScan } = require("./services/scannerService");

async function main() {
  console.log("\n🎵 ORIVIO Music Library Scanner");
  console.log("══════════════════════════════════════════════════════");
  console.log(`📂 Music Root : ${MUSIC_ROOT}`);
  console.log(`💾 Covers Dir : ${COVERS_DIR}`);
  console.log("══════════════════════════════════════════════════════\n");

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log("⏳ Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ MongoDB connected: ${MONGODB_URI}\n`);

  console.log("🔍 Running recursive music library scan...");
  const stats = await runLibraryScan();

  console.log("\n══════════════════════════════════════════════════════");
  console.log("                 📊 SCAN REPORT");
  console.log("══════════════════════════════════════════════════════");
  console.log(`  Total audio files discovered     : ${stats.discovered}`);
  console.log(`  Newly imported to MongoDB        : ${stats.imported}`);
  console.log(`  Updated (already existed)        : ${stats.updated}`);
  console.log(`  Missing files detected           : ${stats.missing}`);
  console.log(`  Failed to process                : ${stats.failed}`);
  console.log("══════════════════════════════════════════════════════");

  if (stats.failures.length > 0) {
    console.log("\n❌ Failed Files:");
    for (const f of stats.failures) {
      console.log(`   ${f.file}: ${f.reason}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n🎵 ORIVIO Music Library Scan Complete!\n");
}

main().catch((err) => {
  console.error("\n❌ Scanner crashed:", err.message);
  mongoose.disconnect().then(() => process.exit(1));
});
