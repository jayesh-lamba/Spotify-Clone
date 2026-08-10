import "./Library.css";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import LikeButton from "../components/LikeButton";

const FALLBACK_COVER = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

function Library() {
    const { isAuthenticated } = useAuth();
    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlayer();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get("tab") || "playlists";

    const [playlists, setPlaylists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [allSongs, setAllSongs] = useState([]);
    const [likedSongs, setLikedSongs] = useState([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        let isMounted = true;
        async function fetchLibraryData() {
            try {
                const promises = [
                    api.getAlbums({ limit: 50 }),
                    api.getArtists({ limit: 50 }),
                    api.getSongs({ limit: 500 }),
                ];

                if (isAuthenticated) {
                    promises.push(api.getMyPlaylists());
                    promises.push(api.getLikedSongs());
                    promises.push(api.getRecentlyPlayed());
                }

                const results = await Promise.allSettled(promises);
                if (!isMounted) return;

                if (results[0].status === "fulfilled" && results[0].value?.data) {
                    setAlbums(results[0].value.data);
                }
                if (results[1].status === "fulfilled" && results[1].value?.data) {
                    setArtists(results[1].value.data);
                }
                if (results[2].status === "fulfilled" && results[2].value?.data) {
                    setAllSongs(results[2].value.data);
                }

                if (isAuthenticated) {
                    if (results[3]?.status === "fulfilled" && results[3]?.value?.data) {
                        setPlaylists(results[3].value.data);
                    }
                    if (results[4]?.status === "fulfilled" && results[4]?.value?.data) {
                        setLikedSongs(results[4].value.data);
                    }
                    if (results[5]?.status === "fulfilled" && results[5]?.value?.data) {
                        setRecentlyPlayed(results[5].value.data);
                    }
                }
            } catch (err) {
                console.warn("Library data fetch warning:", err.message);
            }
        }

        fetchLibraryData();
        return () => { isMounted = false; };
    }, [isAuthenticated, location.search]);

    const handleOpenPlaylist = async (playlistId) => {
        try {
            const res = await api.getPlaylistById(playlistId);
            if (res?.data) {
                setSelectedPlaylist(res.data);
            }
        } catch (err) {
            console.warn("Failed to load playlist:", err.message);
        }
    };

    const handleDeletePlaylist = async (playlistId) => {
        if (!window.confirm("Are you sure you want to delete this playlist?")) return;
        try {
            await api.deletePlaylist(playlistId);
            setPlaylists((prev) => prev.filter((p) => (p._id || p.id) !== playlistId));
            if (selectedPlaylist && (selectedPlaylist._id || selectedPlaylist.id) === playlistId) {
                setSelectedPlaylist(null);
            }
        } catch (err) {
            alert(err.message || "Failed to delete playlist");
        }
    };

    const handleRemovePlaylistSong = async (playlistId, songId) => {
        try {
            await api.removeSongFromPlaylist(playlistId, songId);
            setSelectedPlaylist((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    songs: prev.songs.filter((s) => (s._id || s.id) !== songId),
                };
            });
            // Update playlist in main list
            setPlaylists((prev) =>
                prev.map((p) => {
                    if ((p._id || p.id) === playlistId) {
                        return {
                            ...p,
                            songs: (p.songs || []).filter((s) => (s._id || s.id || s) !== songId),
                        };
                    }
                    return p;
                })
            );
        } catch (err) {
            console.warn("Remove song error:", err.message);
        }
    };

    // ── Drag-and-drop reorder state ──────────────────────────────────────────
    const dragSrcIdx = useRef(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);
    const reorderTimerRef = useRef(null);

    const handleDragStart = useCallback((e, idx) => {
        dragSrcIdx.current = idx;
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIdx(idx);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverIdx(null);
    }, []);

    const handleDrop = useCallback(async (e, dropIdx) => {
        e.preventDefault();
        setDragOverIdx(null);
        const srcIdx = dragSrcIdx.current;
        if (srcIdx === null || srcIdx === dropIdx || !selectedPlaylist) return;

        const newSongs = [...selectedPlaylist.songs];
        const [moved] = newSongs.splice(srcIdx, 1);
        newSongs.splice(dropIdx, 0, moved);

        // Optimistic UI update
        setSelectedPlaylist((prev) => ({ ...prev, songs: newSongs }));

        // Debounce the API call (100ms)
        if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
        reorderTimerRef.current = setTimeout(async () => {
            try {
                const playlistId = selectedPlaylist._id || selectedPlaylist.id;
                const songIds = newSongs.map((s) => s._id || s.id);
                await api.reorderPlaylistSongs(playlistId, songIds);
                // Update the main playlists list too
                setPlaylists((prev) => prev.map((p) => {
                    if ((p._id || p.id) === playlistId) return { ...p, songs: newSongs };
                    return p;
                }));
            } catch (err) {
                console.warn("Reorder failed:", err.message);
            }
        }, 100);
        dragSrcIdx.current = null;
    }, [selectedPlaylist]);

    const handleDragEnd = useCallback(() => {
        dragSrcIdx.current = null;
        setDragOverIdx(null);
    }, []);
    // ── end drag-and-drop ────────────────────────────────────────────────────


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

    // Filter helper
    const filterBySearch = (items, fields = ["title", "name", "artistName"]) => {
        if (!searchTerm.trim()) return items;
        const term = searchTerm.toLowerCase();
        return items.filter((item) =>
            fields.some((f) => item[f] && String(item[f]).toLowerCase().includes(term))
        );
    };

    const filteredPlaylists = filterBySearch(playlists, ["name", "description"]);
    const filteredAlbums = filterBySearch(albums, ["title", "artistName"]);
    const filteredArtists = filterBySearch(artists, ["name"]);
    const filteredAllSongs = filterBySearch(allSongs, ["title", "artistName", "albumName"]);
    const filteredLikedSongs = filterBySearch(likedSongs, ["title", "artistName", "albumName"]);

    return (
        <main className="Library-page">

            {/* =================================
                LIBRARY HEADER
            ================================= */}
            <section className="library-header">
                <div className="library-title">
                    <span className="library-label">YOUR MUSIC</span>
                    <h1>Your Library</h1>
                    <p>Your music, playlists, saved albums, and favorite songs.</p>
                </div>

                <NavLink to="/create-playlist" className="create-button">
                    <i className="fa-solid fa-plus"></i>
                    Create Playlist
                </NavLink>
            </section>

            {/* =================================
                LIBRARY STATS BAR
            ================================= */}
            <section className="library-stats">
                <div className="stat-card">
                    <div className="stat-icon"><i className="fa-solid fa-list"></i></div>
                    <div>
                        <span>PLAYLISTS</span>
                        <strong>{playlists.length}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon"><i className="fa-solid fa-music"></i></div>
                    <div>
                        <span>ALL SONGS</span>
                        <strong>{allSongs.length}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon"><i className="fa-solid fa-compact-disc"></i></div>
                    <div>
                        <span>ALBUMS</span>
                        <strong>{albums.length}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon"><i className="fa-solid fa-heart"></i></div>
                    <div>
                        <span>LIKED SONGS</span>
                        <strong>{likedSongs.length}</strong>
                    </div>
                </div>
            </section>

            {/* =================================
                FILTERS & SEARCH BAR
            ================================= */}
            <section className="library-filters-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "25px" }}>
                <div className="library-filters">
                    <NavLink
                        to="/library"
                        end
                        className={({ isActive }) =>
                            `filter ${activeTab === "playlists" ? "active" : ""}`
                        }
                    >
                        Playlists ({playlists.length})
                    </NavLink>

                    <NavLink
                        to="/library?tab=all-songs"
                        className={() => `filter ${activeTab === "all-songs" ? "active" : ""}`}
                    >
                        All Songs ({allSongs.length})
                    </NavLink>

                    <NavLink
                        to="/library?tab=liked"
                        className={() => `filter ${activeTab === "liked" ? "active" : ""}`}
                    >
                        Liked Songs ({likedSongs.length})
                    </NavLink>

                    <NavLink
                        to="/library?tab=recent"
                        className={() => `filter ${activeTab === "recent" ? "active" : ""}`}
                    >
                        Recently Played
                    </NavLink>

                    <NavLink
                        to="/library?tab=artists"
                        className={() => `filter ${activeTab === "artists" ? "active" : ""}`}
                    >
                        Artists ({artists.length})
                    </NavLink>

                    <NavLink
                        to="/library?tab=albums"
                        className={() => `filter ${activeTab === "albums" ? "active" : ""}`}
                    >
                        Albums ({albums.length})
                    </NavLink>

                    <NavLink
                        to="/library?tab=podcasts"
                        className={() => `filter ${activeTab === "podcasts" ? "active" : ""}`}
                    >
                        Podcasts
                    </NavLink>
                </div>

                {/* Filter Search Input */}
                <div className="lib-search-box">
                    <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--text-muted)", marginRight: "8px", fontSize: "13px" }}></i>
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="lib-search-input"
                    />
                    {searchTerm && (
                        <i
                            className="fa-solid fa-xmark"
                            style={{ color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", marginLeft: "6px" }}
                            onClick={() => setSearchTerm("")}
                        ></i>
                    )}
                </div>
            </section>

            {/* =================================
                PLAYLIST DETAILS MODAL / VIEW
            ================================= */}
            {selectedPlaylist && (
                <section className="lib-playlist-detail-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                            <img
                                src={selectedPlaylist.coverImage || selectedPlaylist.songs?.[0]?.coverImage || FALLBACK_COVER}
                                alt={selectedPlaylist.name}
                                style={{ width: "100px", height: "100px", borderRadius: "8px", objectFit: "cover" }}
                                onError={handleImgError}
                            />
                            <div>
                                <span style={{ color: "var(--accent-orange)", fontSize: "11px", fontWeight: "800", letterSpacing: "2px" }}>PLAYLIST</span>
                                <h2 className="lib-playlist-title">{selectedPlaylist.name}</h2>
                                <p className="lib-playlist-desc">{selectedPlaylist.description || "No description."}</p>
                                <span className="lib-playlist-stats">
                                    {selectedPlaylist.songs?.length || 0} songs • Created by {selectedPlaylist.creator?.username || "You"}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {selectedPlaylist.songs?.length > 0 ? (
                                <button
                                    onClick={() => playSong(selectedPlaylist.songs[0], selectedPlaylist.songs)}
                                    style={{ background: "var(--accent-orange)", color: "#000", border: "none", padding: "10px 22px", borderRadius: "24px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <i className="fa-solid fa-play"></i> Play Playlist
                                </button>
                            ) : (
                                <button
                                    disabled
                                    style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "none", padding: "10px 22px", borderRadius: "24px", fontWeight: "bold", cursor: "not-allowed", display: "flex", alignItems: "center", gap: "8px" }}
                                    title="Add songs to play this playlist"
                                >
                                    <i className="fa-solid fa-play"></i> Play Playlist
                                </button>
                            )}
                            <button
                                onClick={() => handleDeletePlaylist(selectedPlaylist._id || selectedPlaylist.id)}
                                style={{ background: "rgba(255, 107, 107, 0.15)", color: "#ff6b6b", border: "1px solid rgba(255, 107, 107, 0.4)", padding: "10px 16px", borderRadius: "24px", cursor: "pointer" }}
                                title="Delete Playlist"
                            >
                                <i className="fa-solid fa-trash"></i>
                            </button>
                            <button
                                onClick={() => setSelectedPlaylist(null)}
                                className="lib-btn-close"
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>

                    {/* Songs in Playlist */}
                    {selectedPlaylist.songs?.length === 0 ? (
                        <div className="lib-empty-notice">This playlist is empty. Add songs from Search or All Songs!</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {selectedPlaylist.songs.map((song, idx) => (
                                <div
                                    key={song._id || song.id || idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => playSong(song, selectedPlaylist.songs)}
                                    className="lib-song-row"
                                    style={{
                                        background: dragOverIdx === idx ? "rgba(255,149,0,0.15)" : undefined,
                                        borderColor: dragOverIdx === idx ? "var(--accent-orange)" : undefined,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                                        {/* Drag handle */}
                                        <span
                                            title="Drag to reorder"
                                            className="lib-drag-handle"
                                            onClick={(e) => e.stopPropagation()}
                                        >⠿</span>
                                        <span className="lib-song-duration" style={{ width: "20px", flexShrink: 0 }}>{idx + 1}</span>
                                        <img src={song.coverImage || FALLBACK_COVER} alt={song.title} style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} onError={handleImgError} />
                                        <div style={{ minWidth: 0 }}>
                                            <div className="lib-song-title">{song.title}</div>
                                            <div className="lib-song-artist">{song.artistName || "Artist"}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                                        <span className="lib-song-duration">{song.duration || "0:00"}</span>
                                        <LikeButton song={song} size="sm" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemovePlaylistSong(selectedPlaylist._id || selectedPlaylist.id, song._id || song.id); }}
                                            style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "13px" }}
                                            title="Remove from playlist"
                                        >
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* =================================
                PLAYLISTS TAB
            ================================= */}
            {activeTab === "playlists" && (
                <section className="library-section">
                    <div className="library-section-header">
                        <div>
                            <h2>Playlists</h2>
                            <p>Playlists created by you and saved playlists.</p>
                        </div>
                        <span className="section-badge">PLAYLISTS</span>
                    </div>

                    {!isAuthenticated ? (
                        <div className="lib-empty-notice">
                            Please <NavLink to="/login" style={{ color: "var(--accent-orange)", textDecoration: "underline" }}>log in</NavLink> to view and manage your playlists.
                        </div>
                    ) : filteredPlaylists.length === 0 ? (
                        <div className="lib-empty-notice">
                            <i className="fa-solid fa-list" style={{ fontSize: "32px", color: "var(--text-muted)", marginBottom: "10px", display: "block" }}></i>
                            <h3 style={{ color: "var(--text-primary)", margin: "0 0 6px" }}>No Playlists Yet</h3>
                            <p style={{ margin: "0 0 16px", fontSize: "14px" }}>Create your first playlist and start building your collection.</p>
                            <NavLink to="/create-playlist" style={{ background: "var(--accent-orange)", color: "#000", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", textDecoration: "none" }}>
                                + Create Playlist
                            </NavLink>
                        </div>
                    ) : (
                        <div className="library-grid">
                            {filteredPlaylists.map((playlist) => (
                                <div
                                    key={playlist._id || playlist.id}
                                    className="library-card"
                                    onClick={() => handleOpenPlaylist(playlist._id || playlist.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="image-placeholder">
                                        <img
                                            src={playlist.coverImage || playlist.songs?.[0]?.coverImage || FALLBACK_COVER}
                                            alt={playlist.name}
                                            onError={handleImgError}
                                        />
                                        <div
                                            className="card-play"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (playlist.songs?.length) playSong(playlist.songs[0], playlist.songs);
                                                else handleOpenPlaylist(playlist._id || playlist.id);
                                            }}
                                        >
                                            <i className="fa-solid fa-play"></i>
                                        </div>
                                    </div>
                                    <h3>{playlist.name}</h3>
                                    <p>{playlist.songs?.length || 0} songs</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* =================================
                ALL SONGS TAB
            ================================= */}
            {activeTab === "all-songs" && (
                <section className="library-section">
                    <div className="library-section-header">
                        <div>
                            <h2>All Imported Songs</h2>
                            <p>Browse all real songs in your ORIVIO library.</p>
                        </div>
                        <span className="section-badge">{filteredAllSongs.length} SONGS</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {filteredAllSongs.map((song, index) => (
                            <div
                                key={song._id || song.id || index}
                                className="lib-song-row"
                                onClick={() => playSong(song, filteredAllSongs)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                                    <span className="lib-song-duration" style={{ width: "24px", flexShrink: 0 }}>{index + 1}</span>
                                    <img src={song.coverImage || FALLBACK_COVER} alt={song.title} style={{ width: "42px", height: "42px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} onError={handleImgError} />
                                    <div style={{ minWidth: 0 }}>
                                        <h3 className="lib-song-title">{song.title}</h3>
                                        <p className="lib-song-artist">{song.artistName || song.artist?.name || "Artist"}</p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                                    <span className="lib-song-duration">{song.albumName || "Single"}</span>
                                    <span className="lib-song-duration">{song.duration || "0:00"}</span>
                                    <LikeButton song={song} size="sm" />
                                    <div
                                        onClick={(e) => handlePlayClick(e, song, filteredAllSongs)}
                                        style={{ background: "var(--accent-orange)", color: "#000", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px" }}
                                    >
                                        <i className={`fa-solid ${isCurrentPlaying(song) ? "fa-pause" : "fa-play"}`}></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* =================================
                LIKED SONGS TAB
            ================================= */}
            {activeTab === "liked" && (
                <section className="library-section">
                    <div className="library-section-header">
                        <div>
                            <h2>Liked Songs</h2>
                            <p>Songs you have marked with a heart.</p>
                        </div>
                        <span className="section-badge">LIKED</span>
                    </div>

                    {!isAuthenticated ? (
                        <div className="lib-empty-notice">
                            Please <NavLink to="/login" style={{ color: "var(--accent-orange)", textDecoration: "underline" }}>log in</NavLink> to view your liked songs.
                        </div>
                    ) : filteredLikedSongs.length === 0 ? (
                        <div className="lib-empty-notice">
                            You haven't liked any songs yet. Go to Home or Search to like your favorite songs!
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {filteredLikedSongs.map((song, index) => (
                                <div
                                    key={song._id || song.id || index}
                                    className="lib-song-row"
                                    onClick={() => playSong(song, filteredLikedSongs)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                                        <span className="lib-song-duration" style={{ width: "24px", flexShrink: 0 }}>{index + 1}</span>
                                        <img src={song.coverImage || FALLBACK_COVER} alt={song.title} style={{ width: "42px", height: "42px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} onError={handleImgError} />
                                        <div style={{ minWidth: 0 }}>
                                            <h3 className="lib-song-title">{song.title}</h3>
                                            <p className="lib-song-artist">{song.artistName || "Artist"}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                                        <span className="lib-song-duration">{song.duration || "0:00"}</span>
                                        <LikeButton song={song} size="sm" />
                                        <div
                                            onClick={(e) => handlePlayClick(e, song, filteredLikedSongs)}
                                            style={{ background: "var(--accent-orange)", color: "#000", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px" }}
                                        >
                                            <i className={`fa-solid ${isCurrentPlaying(song) ? "fa-pause" : "fa-play"}`}></i>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* =================================
                RECENTLY PLAYED TAB
            ================================= */}
            {activeTab === "recent" && (
                <section className="library-section">
                    <div className="library-section-header">
                        <div>
                            <h2>Recently Played</h2>
                            <p>Tracks you've listened to recently.</p>
                        </div>
                        <span className="section-badge">RECENT</span>
                    </div>

                    {!isAuthenticated ? (
                        <div className="lib-empty-notice">
                            Please <NavLink to="/login" style={{ color: "var(--accent-orange)", textDecoration: "underline" }}>log in</NavLink> to see your playback history.
                        </div>
                    ) : recentlyPlayed.length === 0 ? (
                        <div className="lib-empty-notice">
                            No recently played songs yet. Start playing music to see your history here!
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {recentlyPlayed.map((item, index) => {
                                const song = item.song || item;
                                return (
                                    <div
                                        key={song._id || song.id || index}
                                        className="lib-song-row"
                                        onClick={() => song.title && playSong(song, allSongs)}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                                            <span className="lib-song-duration" style={{ width: "24px", flexShrink: 0 }}>{index + 1}</span>
                                            <img src={song.coverImage || FALLBACK_COVER} alt={song.title || "Song"} style={{ width: "42px", height: "42px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} onError={handleImgError} />
                                            <div style={{ minWidth: 0 }}>
                                                <h3 className="lib-song-title">{song.title}</h3>
                                                <p className="lib-song-artist">{song.artistName || "Artist"}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                                            <span className="lib-song-duration">{song.duration || "0:00"}</span>
                                            <LikeButton song={song} size="sm" />
                                            <div
                                                onClick={(e) => handlePlayClick(e, song, allSongs)}
                                                style={{ background: "var(--accent-orange)", color: "#000", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px" }}
                                            >
                                                <i className={`fa-solid ${isCurrentPlaying(song) ? "fa-pause" : "fa-play"}`}></i>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* =================================
                ARTISTS TAB
            ================================= */}
            {activeTab === "artists" && (
                <section className="library-section">
                    <div className="library-section-header">
                        <div>
                            <h2>Artists</h2>
                            <p>Artists in your library.</p>
                        </div>
                        <span className="section-badge">ARTISTS</span>
                    </div>

                    {filteredArtists.length === 0 ? (
                        <div className="lib-empty-notice">No artists found matching "{searchTerm}".</div>
                    ) : (
                        <div className="library-grid">
                            {filteredArtists.map((artist) => (
                                <div key={artist._id || artist.id} className="library-card">
                                    <div className="image-placeholder">
                                        <img
                                            src={artist.image || FALLBACK_COVER}
                                            alt={artist.name}
                                            style={{ borderRadius: "50%" }}
                                            onError={handleImgError}
                                        />
                                    </div>
                                    <h3>{artist.name}</h3>
                                    <p>Artist</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* =================================
                ALBUMS TAB
            ================================= */}
            {activeTab === "albums" && (
                <section className="library-section">
                    <div className="library-section-header">
                        <div>
                            <h2>Albums</h2>
                            <p>Albums in your library.</p>
                        </div>
                        <span className="section-badge">ALBUMS</span>
                    </div>

                    {filteredAlbums.length === 0 ? (
                        <div className="lib-empty-notice">No albums found matching "{searchTerm}".</div>
                    ) : (
                        <div className="library-grid">
                            {filteredAlbums.map((album) => (
                                <div key={album._id || album.id} className="library-card">
                                    <div className="image-placeholder">
                                        <img
                                            src={album.coverImage || FALLBACK_COVER}
                                            alt={album.title}
                                            onError={handleImgError}
                                        />
                                    </div>
                                    <h3>{album.title}</h3>
                                    <p>{album.artistName || album.artist?.name || "Album"}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* =================================
                PODCASTS TAB
            ================================= */}
            {activeTab === "podcasts" && (
                <section className="library-section">
                    <div className="library-section-header">
                        <div>
                            <h2>Podcasts</h2>
                            <p>Saved shows and episodes.</p>
                        </div>
                    </div>
                    <div className="lib-empty-notice">
                        No saved podcasts available right now.
                    </div>
                </section>
            )}

        </main>
    );
}

export default Library;