import "./Search.css";
import { NavLink, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import LikeButton from "../components/LikeButton";

const FALLBACK_COVER = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get("q") || "";

    const [searchTerm, setSearchTerm] = useState(queryParam);
    const [searchResults, setSearchResults] = useState(null);
    const [allSongs, setAllSongs] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlayer();
    const { isAuthenticated } = useAuth();

    // Update input term when URL parameter changes
    useEffect(() => {
        setSearchTerm(queryParam);
    }, [queryParam]);

    // Fetch all real songs on mount for Browse All view
    useEffect(() => {
        let isMounted = true;
        api.getSongs({ limit: 500 })
            .then((res) => {
                if (isMounted && res?.data?.length) {
                    setAllSongs(res.data);
                }
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    // Fetch user search history if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            api.getSearchHistory()
                .then((res) => {
                    if (res?.data) setHistory(res.data);
                })
                .catch(() => {});
        } else {
            setHistory([]);
        }
    }, [isAuthenticated]);

    // Perform global search when query changes
    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (!trimmed) {
            setSearchResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        const timer = setTimeout(async () => {
            try {
                const res = await api.globalSearch(trimmed, "all", 50);
                if (res?.data) {
                    setSearchResults(res.data);
                    // Refresh search history after searching if logged in
                    if (isAuthenticated) {
                        api.getSearchHistory()
                            .then((hRes) => { if (hRes?.data) setHistory(hRes.data); })
                            .catch(() => {});
                    }
                } else {
                    setSearchResults({ songs: [], artists: [], albums: [] });
                }
            } catch (err) {
                console.warn("Search API error:", err.message);
                // Fallback: local search across allSongs if backend search fails
                const regex = new RegExp(trimmed, "i");
                const localFiltered = allSongs.filter(
                    (s) =>
                        regex.test(s.title || "") ||
                        regex.test(s.artistName || "") ||
                        regex.test(s.albumName || "") ||
                        regex.test(s.genre || "")
                );
                setSearchResults({ songs: localFiltered, artists: [], albums: [] });
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, isAuthenticated, allSongs]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.trim()) {
            setSearchParams({ q: val });
        } else {
            setSearchParams({});
        }
    };

    const handleDeleteHistory = async (e, historyId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.deleteSearchHistoryEntry(historyId);
            setHistory((prev) => prev.filter((item) => item._id !== historyId));
        } catch (_) {}
    };

    const handleClearAllHistory = async () => {
        try {
            await api.clearSearchHistory();
            setHistory([]);
        } catch (_) {}
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

    // Determine displayed songs
    const isSearching = Boolean(searchTerm.trim());
    const displayedSongs = isSearching
        ? (searchResults?.songs || [])
        : allSongs;

    const topResult = isSearching
        ? (searchResults?.artists?.[0] || searchResults?.songs?.[0] || null)
        : (allSongs[0] || null);

    return (
        <div className="Search-page">

            {/* ========================================
                SEARCH HEADER & BAR
            ======================================== */}
            <section className="search-section">
                <h1>Search</h1>

                <div className="search-bar">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="text"
                        placeholder="What do you want to play? (title, artist, album, genre)"
                        value={searchTerm}
                        onChange={handleInputChange}
                        autoFocus
                    />
                    {searchTerm && (
                        <i
                            className="fa-solid fa-xmark"
                            style={{ cursor: "pointer", marginLeft: "auto" }}
                            onClick={() => { setSearchTerm(""); setSearchParams({}); }}
                            title="Clear search"
                        ></i>
                    )}
                </div>
            </section>

            {/* ========================================
                SEARCH HISTORY (Only when not searching & history exists)
            ======================================== */}
            {!isSearching && isAuthenticated && history.length > 0 && (
                <section className="search-history">
                    <div className="section-heading-row">
                        <h2>Recent Searches</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span className="section-count">{history.length} items</span>
                            <button
                                onClick={handleClearAllHistory}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ff9500",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                }}
                            >
                                Clear all
                            </button>
                        </div>
                    </div>

                    <div className="history-list">
                        {history.map((item) => (
                            <NavLink
                                key={item._id}
                                to={`/search?q=${encodeURIComponent(item.query)}`}
                                className={({ isActive }) =>
                                    `history-item ${isActive ? "active" : ""}`
                                }
                            >
                                <i className="fa-solid fa-clock-rotate-left"></i>
                                <span>{item.query}</span>
                                {item._id && (
                                    <i
                                        className="fa-solid fa-xmark"
                                        style={{ marginLeft: "auto", cursor: "pointer", opacity: 0.7 }}
                                        onClick={(e) => handleDeleteHistory(e, item._id)}
                                        title="Remove search"
                                    ></i>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </section>
            )}

            {/* ========================================
                BROWSE CATEGORIES (When not searching)
            ======================================== */}
            {!isSearching && (
                <section className="browse-all">
                    <div className="section-heading-row">
                        <h2>Browse all</h2>
                        <span className="section-count">Explore Categories</span>
                    </div>

                    <div className="browse-grid">
                        <NavLink to="/search?q=Music" className="browse-card">
                            <h3>Music</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/26703.jpg" alt="Music" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>

                        <NavLink to="/search?q=Podcast" className="browse-card">
                            <h3>Podcasts</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/22688.jpg" alt="Podcast" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>

                        <NavLink to="/search?q=Charts" className="browse-card">
                            <h3>Charts</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/25578.jpg" alt="Charts" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>

                        <NavLink to="/search?q=Releases" className="browse-card">
                            <h3>Releases</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/26757.jpg" alt="Releases" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>

                        <NavLink to="/search?q=Hindi" className="browse-card">
                            <h3>Hindi</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/25125.jpg" alt="Hindi" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>

                        <NavLink to="/search?q=English" className="browse-card">
                            <h3>English</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/16901.jpg" alt="English" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>

                        <NavLink to="/search?q=Bollywood" className="browse-card">
                            <h3>Bollywood</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_2t/25075.jpg" alt="Bollywood" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>

                        <NavLink to="/search?q=Workout" className="browse-card">
                            <h3>Workout</h3>
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/17504.png" alt="Workout" />
                            <span className="browse-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                        </NavLink>
                    </div>
                </section>
            )}

            {/* ========================================
                TOP RESULT (When searching or browse)
            ======================================== */}
            {topResult && (
                <section className="top-result">
                    <div className="section-heading-row">
                        <h2>Top Result</h2>
                        <span className="section-count">Best match</span>
                    </div>

                    <div
                        className="top-result-card"
                        onClick={() => playSong(topResult, displayedSongs)}
                        style={{ cursor: "pointer" }}
                    >
                        <img
                            src={topResult.image || topResult.coverImage || FALLBACK_COVER}
                            alt={topResult.name || topResult.title}
                            onError={handleImgError}
                        />

                        <div className="top-result-info">
                            <span className="top-result-label">
                                {topResult.name ? "ARTIST" : "SONG"}
                            </span>
                            <h3>{topResult.name || topResult.title}</h3>
                            <p>{topResult.artistName || topResult.artist?.name || (topResult.name ? "Artist" : "Song")}</p>
                        </div>

                        <div
                            className="top-play-button"
                            onClick={(e) => handlePlayClick(e, topResult, displayedSongs)}
                        >
                            <i className={`fa-solid ${isCurrentPlaying(topResult) ? "fa-pause" : "fa-play"}`}></i>
                        </div>
                    </div>
                </section>
            )}

            {/* ========================================
                SONGS RESULTS LIST
            ======================================== */}
            <section className="songs-section">
                <div className="section-heading-row">
                    <h2>{isSearching ? `Songs matching "${searchTerm}"` : `All Real Songs (${allSongs.length})`}</h2>
                    <span className="section-count">
                        {loading ? "Searching..." : `${displayedSongs.length} songs`}
                    </span>
                </div>

                {loading ? (
                    <div style={{ color: "#888", padding: "20px 0", fontSize: "14px" }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i>
                        Searching ORIVIO library...
                    </div>
                ) : displayedSongs.length === 0 ? (
                    <div style={{ color: "#888", padding: "30px 0", textAlign: "left" }}>
                        <i className="fa-solid fa-music" style={{ fontSize: "28px", marginBottom: "10px", display: "block", color: "#555" }}></i>
                        <p style={{ margin: "0 0 5px", fontSize: "16px", fontWeight: "600", color: "#ccc" }}>
                            No results found for "{searchTerm}"
                        </p>
                        <p style={{ margin: 0, fontSize: "13px" }}>
                            Try searching for another song title, artist, album, or genre.
                        </p>
                    </div>
                ) : (
                    displayedSongs.map((song) => (
                        <div
                            key={song._id || song.id}
                            className="song-result"
                            onClick={() => playSong(song, displayedSongs)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="song-details">
                                <img
                                    src={song.coverImage || FALLBACK_COVER}
                                    alt={song.title}
                                    onError={handleImgError}
                                />
                                <div>
                                    <h3>{song.title}</h3>
                                    <p>
                                        {song.artistName || song.artist?.name || "Artist"}
                                        {song.albumName ? ` • ${song.albumName}` : ""}
                                    </p>
                                </div>
                            </div>

                            <span>{song.duration || "0:00"}</span>

                            <LikeButton song={song} size="sm" />

                            <div
                                className="result-play"
                                onClick={(e) => handlePlayClick(e, song, displayedSongs)}
                                title={isCurrentPlaying(song) ? "Pause" : "Play"}
                            >
                                <i className={`fa-solid ${isCurrentPlaying(song) ? "fa-pause" : "fa-play"}`}></i>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* ========================================
                SEARCH DISCOVERY FOOTER
            ======================================== */}
            <section className="search-discovery">
                <div>
                    <span>KEEP EXPLORING</span>
                    <h2>Your next favorite song is waiting.</h2>
                    <p>Search for an artist, song, album or genre and discover something new.</p>
                </div>

                <NavLink to="/library" className="search-library-button">
                    Open Library
                    <i className="fa-solid fa-arrow-right"></i>
                </NavLink>
            </section>

        </div>
    );
}

export default Search;