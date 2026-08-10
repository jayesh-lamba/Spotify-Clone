import "./CreatePlaylist.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";

const FALLBACK_COVER = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

function CreatePlaylist() {
    const { isAuthenticated } = useAuth();
    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlayer();
    const navigate = useNavigate();

    // User's playlists list for dropdown selector
    const [myPlaylists, setMyPlaylists] = useState([]);
    const [createdPlaylist, setCreatedPlaylist] = useState(null);

    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState("Public");
    const [coverImage, setCoverImage] = useState("");

    // Real music library & search state
    const [allRealSongs, setAllRealSongs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    
    // Local selection state for songs added BEFORE/DURING creation
    const [selectedSongs, setSelectedSongs] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Load user playlists and complete real song library on mount
    const loadInitialData = useCallback(async () => {
        try {
            const songsRes = await api.getSongs({ limit: 500 });
            if (songsRes?.data) {
                setAllRealSongs(songsRes.data);
            }

            if (isAuthenticated) {
                const playlistRes = await api.getMyPlaylists();
                if (playlistRes?.data) {
                    setMyPlaylists(playlistRes.data);
                }
            }
        } catch (err) {
            console.warn("Failed to load initial library data:", err.message);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Load full details for a selected existing playlist
    const handleSelectPlaylist = async (playlistId) => {
        setErrorMsg("");
        setMessage("");
        if (!playlistId) {
            setCreatedPlaylist(null);
            setSelectedSongs([]);
            setName("");
            setDescription("");
            setCoverImage("");
            return;
        }

        try {
            const res = await api.getPlaylistById(playlistId);
            if (res?.data) {
                const pl = res.data;
                setCreatedPlaylist(pl);
                setName(pl.name || "");
                setDescription(pl.description || "");
                setCoverImage(pl.coverImage || "");
                setSelectedSongs(pl.songs || []);
                setMessage(`Loaded playlist "${pl.name}"`);
            }
        } catch (err) {
            setErrorMsg(err.message || "Failed to load playlist.");
        }
    };

    // Toggle song selection BEFORE/DURING creation or edit
    const handleAddSong = async (song) => {
        setErrorMsg("");
        setMessage("");
        const songId = song._id || song.id;

        // Check duplicate locally
        if (selectedSongs.some((s) => (s._id || s.id) === songId)) {
            setMessage(`"${song.title}" is already selected.`);
            return;
        }

        // If editing an ALREADY CREATED playlist in MongoDB, call API immediately
        if (createdPlaylist) {
            const targetPlaylistId = createdPlaylist._id || createdPlaylist.id;
            try {
                await api.addSongToPlaylist(targetPlaylistId, songId);
                setSelectedSongs((prev) => [...prev, song]);
                setMessage(`Added "${song.title}" to playlist!`);
                // Update count in myPlaylists array
                setMyPlaylists((prev) =>
                    prev.map((p) => {
                        if ((p._id || p.id) === targetPlaylistId) {
                            return { ...p, songs: [...(p.songs || []), song] };
                        }
                        return p;
                    })
                );
            } catch (err) {
                setErrorMsg(err.message || "Failed to add song to playlist.");
            }
        } else {
            // Unsaved new playlist: add to local state BEFORE saving
            setSelectedSongs((prev) => [...prev, song]);
            setMessage(`Selected "${song.title}" (${selectedSongs.length + 1} total selected)`);
        }
    };

    // Remove song from current selection or playlist
    const handleRemoveSong = async (songId) => {
        setErrorMsg("");
        setMessage("");

        // If playlist is already saved in MongoDB
        if (createdPlaylist) {
            const targetPlaylistId = createdPlaylist._id || createdPlaylist.id;
            try {
                await api.removeSongFromPlaylist(targetPlaylistId, songId);
                setSelectedSongs((prev) => prev.filter((s) => (s._id || s.id) !== songId));
                setMessage("Song removed from playlist.");

                setMyPlaylists((prev) =>
                    prev.map((p) => {
                        if ((p._id || p.id) === targetPlaylistId) {
                            return {
                                ...p,
                                songs: (p.songs || []).filter((s) => (s._id || s.id || s) !== songId),
                            };
                        }
                        return p;
                    })
                );
            } catch (err) {
                setErrorMsg(err.message || "Failed to remove song.");
            }
        } else {
            // Unsaved selection: remove from local state
            setSelectedSongs((prev) => prev.filter((s) => (s._id || s.id) !== songId));
            setMessage("Song unselected.");
        }
    };

    // Submit and Create the playlist in MongoDB with ALL selected song IDs
    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setMessage("");

        if (!isAuthenticated) {
            setErrorMsg("Please log in to create a playlist.");
            return;
        }

        if (!name.trim()) {
            setErrorMsg("Playlist name is required.");
            return;
        }

        setSubmitting(true);
        try {
            const songIds = selectedSongs.map((s) => String(s._id || s.id || s)).filter(Boolean);
            const res = await api.createPlaylist({
                name: name.trim(),
                description: description.trim(),
                privacy,
                coverImage: coverImage.trim() || undefined,
                songs: songIds,
            });

            if (res?.success && res.data) {
                const newPl = res.data;
                setCreatedPlaylist(newPl);
                if (Array.isArray(newPl.songs)) {
                    setSelectedSongs(newPl.songs);
                }
                setMyPlaylists((prev) => [newPl, ...prev]);
                const count = newPl.songs ? newPl.songs.length : songIds.length;
                setMessage(`Playlist "${newPl.name}" created with ${count} songs! Saved to MongoDB.`);
            }
        } catch (err) {
            setErrorMsg(err.message || "Failed to create playlist.");
        } finally {
            setSubmitting(false);
        }
    };

    // Live search real songs
    const handleSongSearch = (e) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (!val.trim()) {
            setSearchResults([]);
            return;
        }

        const query = val.toLowerCase();
        const filtered = allRealSongs.filter(
            (song) =>
                (song.title && song.title.toLowerCase().includes(query)) ||
                (song.artistName && song.artistName.toLowerCase().includes(query)) ||
                (song.albumName && song.albumName.toLowerCase().includes(query)) ||
                (song.genre && song.genre.toLowerCase().includes(query))
        );
        setSearchResults(filtered);
    };

    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_COVER;
    };

    const isCurrentPlaying = (song) => {
        if (!isPlaying || !currentSong || !song) return false;
        const songId = song._id || song.id;
        const currentId = currentSong._id || currentSong.id;
        return Boolean(songId && currentId && String(songId) === String(currentId));
    };

    const handlePlayClick = (e, song, queue) => {
        e.stopPropagation();
        const songId = song._id || song.id;
        const currentId = currentSong?._id || currentSong?.id;

        if (songId && currentId && String(songId) === String(currentId)) {
            togglePlayPause();
        } else {
            playSong(song, queue);
        }
    };

    const displayedSongsList = searchQuery.trim() ? searchResults : allRealSongs;

    return (
        <main className="CreatePlaylist-page">

            {/* HEADER */}
            <div className="create-playlist-header">
                <p className="create-playlist-label">YOUR MUSIC</p>
                <h1>{createdPlaylist ? `Editing: ${createdPlaylist.name}` : "Create Playlist"}</h1>
                <p>Build custom playlists with real songs imported from your music library.</p>

                {errorMsg && (
                    <div style={{ color: "#ff6b6b", marginTop: "12px", fontSize: "14px", fontWeight: "600" }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "6px" }}></i>
                        {errorMsg}
                    </div>
                )}

                {message && (
                    <div style={{ color: "#ff9500", marginTop: "12px", fontSize: "14px", fontWeight: "600" }}>
                        <i className="fa-solid fa-circle-check" style={{ marginRight: "6px" }}></i>
                        {message}
                    </div>
                )}
            </div>

            {/* PLAYLIST SELECTION DROPDOWN */}
            {isAuthenticated && myPlaylists.length > 0 && (
                <section className="cp-select-bar">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <i className="fa-solid fa-list" style={{ color: "var(--accent-orange)", fontSize: "16px" }}></i>
                        <span className="cp-select-label">Select Playlist:</span>
                        <select
                            value={createdPlaylist?._id || ""}
                            onChange={(e) => handleSelectPlaylist(e.target.value)}
                            className="cp-select-dropdown"
                        >
                            <option value="">+ Create New Playlist</option>
                            {myPlaylists.map((pl) => (
                                <option key={pl._id || pl.id} value={pl._id || pl.id}>
                                    {pl.name} ({pl.songs?.length || 0} songs)
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/library")}
                        className="cp-btn-secondary"
                    >
                        View in Your Library →
                    </button>
                </section>
            )}

            {/* CREATION FORM */}
            <section className="playlist-creator">

                <div className="playlist-cover-section">
                    <div className="playlist-cover">
                        {coverImage ? (
                            <img
                                src={coverImage}
                                alt="Cover Preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                                onError={handleImgError}
                            />
                        ) : selectedSongs[0]?.coverImage ? (
                            <img
                                src={selectedSongs[0].coverImage}
                                alt="Cover Preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                                onError={handleImgError}
                            />
                        ) : (
                            <>
                                <i className="fa-solid fa-music"></i>
                                <span>Cover Image</span>
                            </>
                        )}
                    </div>

                    <button
                        className="cover-button"
                        type="button"
                        onClick={() => {
                            const url = prompt("Enter cover image URL:");
                            if (url) setCoverImage(url);
                        }}
                    >
                        <i className="fa-solid fa-image"></i>
                        Set Cover URL
                    </button>
                </div>

                <div className="playlist-details">
                    <form onSubmit={handleCreatePlaylist}>
                        <div className="input-group">
                            <label>Playlist Name</label>
                            <input
                                type="text"
                                placeholder="My Favorite Songs"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Description</label>
                            <textarea
                                placeholder="Add an optional description..."
                                rows="3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="input-group">
                            <label>Privacy</label>
                            <select
                                value={privacy}
                                onChange={(e) => setPrivacy(e.target.value)}
                            >
                                <option value="Public">Public</option>
                                <option value="Private">Private</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <button
                                type="submit"
                                className="create-playlist-button"
                                disabled={submitting}
                            >
                                <i className={`fa-solid ${createdPlaylist ? "fa-floppy-disk" : "fa-plus"}`}></i>
                                {submitting ? "Saving..." : createdPlaylist ? "Save Changes" : `Create Playlist (${selectedSongs.length} songs)`}
                            </button>

                            {createdPlaylist && (
                                <button
                                    type="button"
                                    onClick={() => handleSelectPlaylist("")}
                                    className="cp-btn-secondary"
                                >
                                    + New Playlist
                                </button>
                            )}
                        </div>
                    </form>
                </div>

            </section>

            {/* SELECTED SONGS PREVIEW SECTION (BEFORE OR AFTER CREATION) */}
            <section className="cp-selected-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h2 className="cp-section-title">
                            {createdPlaylist
                                ? `Songs in "${createdPlaylist.name}" (${selectedSongs.length})`
                                : `Selected Songs for New Playlist (${selectedSongs.length})`}
                        </h2>
                        <p className="cp-section-subtitle">
                            {createdPlaylist
                                ? "Songs saved in this playlist."
                                : "Songs selected below will be included when you click Create Playlist."}
                        </p>
                    </div>

                    {selectedSongs.length > 0 && (
                        <button
                            onClick={() => playSong(selectedSongs[0], selectedSongs)}
                            className="cp-add-btn"
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px" }}
                        >
                            <i className="fa-solid fa-play"></i> Play Queue
                        </button>
                    )}
                </div>

                {selectedSongs.length === 0 ? (
                    <div className="cp-empty-notice">
                        No songs selected yet. Click <strong>"+ Add"</strong> on any song in the library section below!
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {selectedSongs.map((song, idx) => (
                            <div
                                key={song._id || song.id || idx}
                                className="cp-song-row"
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                    <span className="cp-song-duration" style={{ width: "20px" }}>{idx + 1}</span>
                                    <img
                                        src={song.coverImage || FALLBACK_COVER}
                                        alt={song.title}
                                        style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
                                        onError={handleImgError}
                                    />
                                    <div style={{ minWidth: 0 }}>
                                        <div className="cp-song-title">{song.title}</div>
                                        <div className="cp-song-artist">{song.artistName || "Unknown Artist"}</div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    <span className="cp-song-duration">{song.duration || "0:00"}</span>
                                    <div
                                        onClick={(e) => handlePlayClick(e, song, selectedSongs)}
                                        className="cp-play-mini-btn"
                                        title="Play track"
                                    >
                                        <i className={`fa-solid ${isCurrentPlaying(song) ? "fa-pause" : "fa-play"}`}></i>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveSong(song._id || song.id)}
                                        className="cp-trash-btn"
                                        title="Remove song"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ADD SONGS / BROWSE REAL LIBRARY */}
            <section className="add-songs-section" style={{ marginTop: "35px" }}>
                <div className="add-songs-header">
                    <div>
                        <h2>Select Songs from Real Library</h2>
                        <p>
                            {searchQuery.trim()
                                ? `Showing results for "${searchQuery}"`
                                : `Browse all ${allRealSongs.length} real imported songs from your music library.`}
                        </p>
                    </div>
                </div>

                <div className="playlist-search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="text"
                        placeholder="Search real songs by title, artist, album, or genre..."
                        value={searchQuery}
                        onChange={handleSongSearch}
                    />
                    {searchQuery && (
                        <i
                            className="fa-solid fa-xmark"
                            style={{ cursor: "pointer", marginLeft: "auto", color: "#888" }}
                            onClick={() => setSearchQuery("")}
                        ></i>
                    )}
                </div>

                <div style={{ marginTop: "20px" }}>
                    {displayedSongsList.length === 0 ? (
                        <div className="cp-empty-notice">
                            No songs found matching "{searchQuery}".
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {displayedSongsList.map((song) => {
                                const songId = song._id || song.id;
                                const isAdded = selectedSongs.some((s) => (s._id || s.id) === songId);

                                return (
                                    <div
                                        key={songId}
                                        className="cp-song-row"
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                            <img
                                                src={song.coverImage || FALLBACK_COVER}
                                                alt={song.title}
                                                style={{ width: "42px", height: "42px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
                                                onError={handleImgError}
                                            />
                                            <div style={{ minWidth: 0 }}>
                                                <div className="cp-song-title">{song.title}</div>
                                                <div className="cp-song-artist">
                                                    {song.artistName || "Unknown Artist"}
                                                    {song.albumName ? ` • ${song.albumName}` : ""}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                            <span className="cp-song-duration">{song.duration || "0:00"}</span>
                                            <button
                                                onClick={() => handleAddSong(song)}
                                                disabled={isAdded}
                                                className={`cp-add-btn ${isAdded ? "added" : ""}`}
                                                title={
                                                    isAdded
                                                        ? "Song is already selected for this playlist"
                                                        : "Add song to playlist selection"
                                                }
                                            >
                                                {isAdded ? "Added ✓" : "+ Add"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

        </main>
    );
}

export default CreatePlaylist;