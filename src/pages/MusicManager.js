import React, { useState, useEffect } from "react";
import "./MusicManager.css";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { useToast } from "../context/ToastContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60";

function MusicManager() {
  const { playSong } = usePlayer();
  const { addToast: showToast } = useToast();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recentlyAdded");
  const [watching, setWatching] = useState(false);

  // Modals
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showAddDirModal, setShowAddDirModal] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [activeTab, setActiveTab] = useState("metadata"); // 'metadata' | 'lyrics' | 'artwork'

  // Upload form states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSubDir, setUploadSubDir] = useState("");
  const [uploading, setUploading] = useState(false);

  // Directory upload
  const [folderFiles, setFolderFiles] = useState([]);

  // Edit Song Metadata form
  const [metaForm, setMetaForm] = useState({
    title: "",
    artistName: "",
    albumName: "",
    albumArtist: "",
    genre: "",
    year: "",
    trackNumber: "",
    discNumber: "",
    composer: "",
    lyrics: "",
    lyricsSource: "",
  });

  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkPreview, setArtworkPreview] = useState("");

  // ── Fetch songs ──────────────────────────────────────────────────────────────
  const fetchSongs = async () => {
    try {
      setLoading(true);
      const params = { sort: sortBy, limit: 500 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.getMusicManagerSongs(params);
      if (res.success) {
        setSongs(res.data || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load library", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, sortBy]);

  // ── Trigger Scan ─────────────────────────────────────────────────────────────
  const handleScanLibrary = async () => {
    try {
      setScanning(true);
      showToast("Scanning Music directory...", "info");
      const res = await api.scanMusicLibrary();
      if (res.success) {
        setScanResult(res.data);
        showToast(
          `Scan complete! Discovered: ${res.data.discovered}, Imported: ${res.data.imported}, Updated: ${res.data.updated}`,
          "success"
        );
        fetchSongs();
      }
    } catch (err) {
      showToast(err.message || "Scan failed", "error");
    } finally {
      setScanning(false);
    }
  };

  // ── Toggle File Watcher ───────────────────────────────────────────────────────
  const handleToggleWatch = async () => {
    try {
      const nextState = !watching;
      const res = await api.toggleWatchService(nextState);
      if (res.success) {
        setWatching(res.watching);
        showToast(
          res.watching ? "Filesystem watching active" : "Filesystem watching disabled",
          "info"
        );
      }
    } catch (err) {
      showToast(err.message || "Watcher toggle failed", "error");
    }
  };

  // ── Clean Missing Records ─────────────────────────────────────────────────────
  const handleCleanMissing = async () => {
    if (
      !window.confirm(
        "Remove database entries for missing audio files? Physical files will NOT be deleted."
      )
    )
      return;
    try {
      const res = await api.cleanMissingSongs();
      if (res.success) {
        showToast(`Cleaned ${res.removedCount} missing records`, "success");
        fetchSongs();
      }
    } catch (err) {
      showToast(err.message || "Clean missing failed", "error");
    }
  };

  // ── Upload Single Song ────────────────────────────────────────────────────────
  const handleUploadSongSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("Please select an audio file", "error");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("audio", uploadFile);
      if (uploadSubDir.trim()) {
        formData.append("subDir", uploadSubDir.trim());
      }

      const res = await api.uploadSongFile(formData);
      if (res.success) {
        showToast(`Uploaded "${res.data.title}" successfully!`, "success");
        setShowAddSongModal(false);
        setUploadFile(null);
        setUploadSubDir("");
        fetchSongs();
      }
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  // ── Import Directory ──────────────────────────────────────────────────────────
  const handleFolderSelect = (e) => {
    setFolderFiles(Array.from(e.target.files || []));
  };

  const handleUploadFolderSubmit = async (e) => {
    e.preventDefault();
    if (!folderFiles.length) {
      showToast("Please select a folder containing audio files", "error");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      folderFiles.forEach((file) => {
        formData.append("files", file);
        formData.append("relativePaths", file.webkitRelativePath || file.name);
      });

      const res = await api.uploadDirectoryStructure(formData);
      if (res.success) {
        showToast(`Imported folder (${folderFiles.length} files) successfully!`, "success");
        setShowAddDirModal(false);
        setFolderFiles([]);
        fetchSongs();
      }
    } catch (err) {
      showToast(err.message || "Directory import failed", "error");
    } finally {
      setUploading(false);
    }
  };

  // ── Open Edit Modal ───────────────────────────────────────────────────────────
  const handleOpenEditModal = (song, defaultTab = "metadata") => {
    setEditingSong(song);
    setActiveTab(defaultTab);
    setMetaForm({
      title: song.title || "",
      artistName: song.artistName || "",
      albumName: song.albumName || "",
      albumArtist: song.albumArtist || "",
      genre: song.genre || "Pop",
      year: song.year || "",
      trackNumber: song.trackNumber || "",
      discNumber: song.discNumber || "",
      composer: song.composer || "",
      lyrics: song.lyrics || "",
      lyricsSource: song.lyricsSource || "",
    });
    setArtworkPreview(song.coverImage || "");
    setArtworkFile(null);
  };

  // ── Save Metadata ─────────────────────────────────────────────────────────────
  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    if (!editingSong) return;

    try {
      const res = await api.updateSongMetadata(
        editingSong.id || editingSong._id,
        metaForm
      );
      if (res.success) {
        showToast("Metadata updated successfully!", "success");
        fetchSongs();
      }
    } catch (err) {
      showToast(err.message || "Failed to save metadata", "error");
    }
  };

  // ── Save Lyrics ───────────────────────────────────────────────────────────────
  const handleSaveLyrics = async () => {
    if (!editingSong) return;

    try {
      const res = await api.updateSongLyrics(editingSong.id || editingSong._id, {
        lyrics: metaForm.lyrics,
        lyricsSource: metaForm.lyricsSource,
      });
      if (res.success) {
        showToast("Lyrics saved successfully!", "success");
        fetchSongs();
      }
    } catch (err) {
      showToast(err.message || "Failed to save lyrics", "error");
    }
  };

  // ── Upload Artwork ────────────────────────────────────────────────────────────
  const handleSaveArtwork = async () => {
    if (!editingSong || !artworkFile) {
      showToast("Select a new image file first", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("artwork", artworkFile);
      const res = await api.updateSongArtwork(
        editingSong.id || editingSong._id,
        formData
      );
      if (res.success) {
        showToast("Artwork updated successfully!", "success");
        setArtworkPreview(res.data.coverImage);
        fetchSongs();
      }
    } catch (err) {
      showToast(err.message || "Failed to upload artwork", "error");
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <main className="MusicManager-page">
      {/* ── Page Header ── */}
      <header className="mm-header">
        <div className="mm-header-left">
          <span className="mm-badge">LOCAL LIBRARY</span>
          <h1>🎵 Music Library Manager</h1>
          <p>
            Scan, upload, import directories, and edit metadata for your ORIVIO
            music library.
          </p>
        </div>

        <div className="mm-header-actions">
          <button
            onClick={handleScanLibrary}
            disabled={scanning}
            className="mm-btn mm-btn-primary"
            id="btn-scan-library"
          >
            <i
              className={`fa-solid ${
                scanning ? "fa-spinner fa-spin" : "fa-arrows-rotate"
              }`}
            ></i>
            {scanning ? "Scanning…" : "Scan Library"}
          </button>

          <button
            onClick={() => setShowAddSongModal(true)}
            className="mm-btn mm-btn-secondary"
            id="btn-add-song"
          >
            <i className="fa-solid fa-plus"></i> Add Song
          </button>

          <button
            onClick={() => setShowAddDirModal(true)}
            className="mm-btn mm-btn-secondary"
            id="btn-import-dir"
          >
            <i className="fa-solid fa-folder-plus"></i> Import Folder
          </button>

          <button
            onClick={handleToggleWatch}
            className={`mm-btn ${watching ? "mm-btn-active" : "mm-btn-secondary"}`}
            title="Auto-detect new files in backend Music folder"
            id="btn-watch-folder"
          >
            <i className={`fa-solid ${watching ? "fa-eye" : "fa-eye-slash"}`}></i>
            {watching ? "Watching" : "Watch Folder"}
          </button>

          <button
            onClick={handleCleanMissing}
            className="mm-btn mm-btn-danger"
            title="Clean DB entries for deleted audio files"
            id="btn-clean-missing"
          >
            <i className="fa-solid fa-broom"></i> Clean Missing
          </button>
        </div>
      </header>

      {/* ── Scan Result Banner ── */}
      {scanResult && (
        <section className="mm-scan-banner">
          <div className="mm-scan-stats">
            <div>
              <span>Discovered</span>
              <strong>{scanResult.discovered}</strong>
            </div>
            <div>
              <span>Imported</span>
              <strong>{scanResult.imported}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{scanResult.updated}</strong>
            </div>
            <div>
              <span>Missing</span>
              <strong>{scanResult.missing || 0}</strong>
            </div>
            <div>
              <span>Errors</span>
              <strong
                style={{ color: scanResult.failed ? "#ff6b6b" : "inherit" }}
              >
                {scanResult.failed}
              </strong>
            </div>
            <button
              className="mm-dismiss-btn"
              onClick={() => setScanResult(null)}
              title="Dismiss"
            >
              ✕
            </button>
          </div>

          {scanResult.failures && scanResult.failures.length > 0 && (
            <div className="mm-scan-errors">
              <strong>⚠ Errors:</strong>
              <ul>
                {scanResult.failures.map((f, i) => (
                  <li key={i}>
                    <code>{f.file}</code>: {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── Filter Bar ── */}
      <section className="mm-controls">
        <div className="mm-search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search title, artist, album, genre…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="mm-search-input"
          />
          {searchQuery && (
            <button
              className="mm-clear-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mm-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="mm-status-filter"
          >
            <option value="all">All Status</option>
            <option value="available">✓ Available</option>
            <option value="missing">⚠ Missing</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            id="mm-sort-select"
          >
            <option value="recentlyAdded">Recently Added</option>
            <option value="title">Title A→Z</option>
            <option value="artist">Artist A→Z</option>
            <option value="album">Album A→Z</option>
            <option value="duration">Duration</option>
          </select>

          <span className="mm-count-badge">{songs.length} songs</span>
        </div>
      </section>

      {/* ── Song Table ── */}
      {loading ? (
        <div className="mm-state-panel">
          <i className="fa-solid fa-spinner fa-spin mm-icon-large"></i>
          <p>Loading music library…</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="mm-state-panel">
          <i className="fa-solid fa-music mm-icon-large mm-icon-orange"></i>
          <h3>No Songs Found</h3>
          <p>
            Click <strong>Scan Library</strong> to index your local audio files, or{" "}
            <strong>Add Song</strong> to upload directly.
          </p>
          <button
            onClick={handleScanLibrary}
            className="mm-btn mm-btn-primary"
            style={{ marginTop: "16px" }}
          >
            <i className="fa-solid fa-arrows-rotate"></i> Scan Now
          </button>
        </div>
      ) : (
        <section className="mm-table-wrapper">
          <table className="mm-table" aria-label="Music library songs">
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th>Title / Artist</th>
                <th className="hide-sm">Album</th>
                <th>Dur.</th>
                <th className="hide-sm">Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, idx) => (
                <tr
                  key={song.id || song._id}
                  className={`mm-row ${song.isMissing ? "mm-row-missing" : ""}`}
                >
                  <td className="mm-col-idx">{idx + 1}</td>

                  <td className="mm-col-cover">
                    <img
                      src={song.coverImage || FALLBACK_COVER}
                      alt={song.title}
                      onError={(e) => {
                        e.target.src = FALLBACK_COVER;
                      }}
                    />
                  </td>

                  <td className="mm-col-title">
                    <div className="mm-title-text">{song.title}</div>
                    <div className="mm-artist-text">{song.artistName}</div>
                  </td>

                  <td className="mm-col-album hide-sm">{song.albumName}</td>

                  <td className="mm-col-duration">{song.duration || "—"}</td>

                  <td className="mm-col-path hide-sm">
                    <code title={song.displayPath}>{song.displayPath || "Music/"}</code>
                  </td>

                  <td className="mm-col-status">
                    {song.isMissing ? (
                      <span className="mm-pill mm-pill-missing">⚠ Missing</span>
                    ) : (
                      <span className="mm-pill mm-pill-avail">✓ Available</span>
                    )}
                  </td>

                  <td className="mm-col-actions">
                    <button
                      onClick={() => playSong(song, songs)}
                      className="mm-icon-btn mm-icon-btn-play"
                      title="Play"
                    >
                      <i className="fa-solid fa-play"></i>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(song, "metadata")}
                      className="mm-icon-btn mm-icon-btn-edit"
                      title="Edit Metadata"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(song, "lyrics")}
                      className="mm-icon-btn mm-icon-btn-lyrics"
                      title="Edit Lyrics"
                    >
                      <i className="fa-solid fa-quote-right"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL: ADD SINGLE SONG
      ═══════════════════════════════════════════════════ */}
      {showAddSongModal && (
        <div className="mm-overlay" role="dialog" aria-modal="true">
          <div className="mm-modal">
            <div className="mm-modal-head">
              <h2>➕ Add New Song</h2>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="mm-modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSongSubmit} className="mm-modal-body">
              <div className="mm-field">
                <label>Audio File (.mp3, .flac, .ogg, .opus, .m4a, .wav)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  required
                />
              </div>

              <div className="mm-field">
                <label>
                  Target Subdirectory <em>(optional)</em>
                </label>
                <input
                  type="text"
                  placeholder='e.g. Hindi/Artist A  or  Pop/2026 Hits'
                  value={uploadSubDir}
                  onChange={(e) => setUploadSubDir(e.target.value)}
                />
                <span className="mm-hint">
                  File is placed inside <code>Music/&lt;subdir&gt;/</code>
                </span>
              </div>

              <div className="mm-modal-foot">
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="mm-btn mm-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="mm-btn mm-btn-primary"
                >
                  {uploading ? "Uploading & Indexing…" : "Upload & Index"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL: IMPORT DIRECTORY
      ═══════════════════════════════════════════════════ */}
      {showAddDirModal && (
        <div className="mm-overlay" role="dialog" aria-modal="true">
          <div className="mm-modal">
            <div className="mm-modal-head">
              <h2>📁 Import Folder</h2>
              <button
                onClick={() => setShowAddDirModal(false)}
                className="mm-modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadFolderSubmit} className="mm-modal-body">
              <div className="mm-field">
                <label>Select a Folder (preserves nested subdirectory structure)</label>
                {/* webkitdirectory lets browser pick entire folder */}
                <input
                  type="file"
                  /* eslint-disable-next-line react/no-unknown-property */
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleFolderSelect}
                  required
                />
                {folderFiles.length > 0 && (
                  <div className="mm-file-count">
                    <i className="fa-solid fa-file-audio"></i>{" "}
                    <strong>{folderFiles.length}</strong> files selected
                  </div>
                )}
              </div>

              <div className="mm-modal-foot">
                <button
                  type="button"
                  onClick={() => setShowAddDirModal(false)}
                  className="mm-btn mm-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !folderFiles.length}
                  className="mm-btn mm-btn-primary"
                >
                  {uploading ? "Importing…" : "Import & Index"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL: EDIT METADATA / LYRICS / ARTWORK
      ═══════════════════════════════════════════════════ */}
      {editingSong && (
        <div className="mm-overlay" role="dialog" aria-modal="true">
          <div className="mm-modal mm-modal-lg">
            <div className="mm-modal-head">
              <h2 className="mm-edit-title">
                <span className="mm-edit-icon">✏️</span> {editingSong.title}
              </h2>
              <button
                onClick={() => setEditingSong(null)}
                className="mm-modal-close"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="mm-tabs" role="tablist">
              {[
                { key: "metadata", label: "📝 Metadata" },
                { key: "lyrics",   label: "📜 Lyrics" },
                { key: "artwork",  label: "🖼 Artwork" },
              ].map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  className={`mm-tab ${activeTab === t.key ? "mm-tab-active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mm-modal-body">
              {/* ── Metadata Tab ── */}
              {activeTab === "metadata" && (
                <form onSubmit={handleSaveMetadata} className="mm-meta-grid">
                  {[
                    { label: "Song Title *", key: "title", type: "text", required: true },
                    { label: "Artist *",     key: "artistName", type: "text", required: true },
                    { label: "Album",        key: "albumName",  type: "text" },
                    { label: "Album Artist", key: "albumArtist",type: "text" },
                    { label: "Genre",        key: "genre",      type: "text" },
                    { label: "Year",         key: "year",       type: "number" },
                    { label: "Track #",      key: "trackNumber",type: "number" },
                    { label: "Disc #",       key: "discNumber", type: "number" },
                  ].map(({ label, key, type, required }) => (
                    <div className="mm-field" key={key}>
                      <label>{label}</label>
                      <input
                        type={type}
                        value={metaForm[key]}
                        onChange={(e) =>
                          setMetaForm({ ...metaForm, [key]: e.target.value })
                        }
                        required={required}
                      />
                    </div>
                  ))}

                  <div className="mm-field mm-field-full">
                    <label>Composer</label>
                    <input
                      type="text"
                      value={metaForm.composer}
                      onChange={(e) =>
                        setMetaForm({ ...metaForm, composer: e.target.value })
                      }
                    />
                  </div>

                  <div className="mm-modal-foot mm-field-full">
                    <button type="submit" className="mm-btn mm-btn-primary">
                      <i className="fa-solid fa-floppy-disk"></i> Save Metadata
                    </button>
                  </div>
                </form>
              )}

              {/* ── Lyrics Tab ── */}
              {activeTab === "lyrics" && (
                <div className="mm-lyrics-editor">
                  <div className="mm-field">
                    <label>
                      Lyrics{" "}
                      <em>
                        (Plain text or LRC timestamps: <code>[00:12.34] Line…</code>)
                      </em>
                    </label>
                    <textarea
                      rows={14}
                      value={metaForm.lyrics}
                      onChange={(e) =>
                        setMetaForm({ ...metaForm, lyrics: e.target.value })
                      }
                      placeholder="[00:00.00] Enter synchronized or plain lyrics here…"
                    />
                  </div>

                  <div className="mm-modal-foot">
                    <button
                      type="button"
                      onClick={() => setMetaForm({ ...metaForm, lyrics: "" })}
                      className="mm-btn mm-btn-danger"
                    >
                      <i className="fa-solid fa-trash"></i> Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLyrics}
                      className="mm-btn mm-btn-primary"
                    >
                      <i className="fa-solid fa-floppy-disk"></i> Save Lyrics
                    </button>
                  </div>
                </div>
              )}

              {/* ── Artwork Tab ── */}
              {activeTab === "artwork" && (
                <div className="mm-artwork-editor">
                  <div className="mm-artwork-preview">
                    <img
                      src={artworkPreview || FALLBACK_COVER}
                      alt="Cover preview"
                      onError={(e) => {
                        e.target.src = FALLBACK_COVER;
                      }}
                    />
                    <div className="mm-artwork-label">Current Cover</div>
                  </div>

                  <div className="mm-field">
                    <label>
                      Upload New Cover Image (.jpg, .png, .webp)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setArtworkFile(file);
                          setArtworkPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>

                  <div className="mm-modal-foot">
                    <button
                      type="button"
                      onClick={handleSaveArtwork}
                      className="mm-btn mm-btn-primary"
                      disabled={!artworkFile}
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i> Upload Cover
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MusicManager;
