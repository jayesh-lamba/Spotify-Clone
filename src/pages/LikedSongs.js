import "./LikedSongs.css";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import { useLikedSongs } from "../context/LikedSongsContext";
import LikeButton from "../components/LikeButton";

const FALLBACK_COVER = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

function LikedSongs() {
    const { isAuthenticated } = useAuth();
    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlayer();
    const { likedIds } = useLikedSongs();

    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("Recently Added");

    // Reload liked songs from API whenever likedIds set changes (e.g. unliked from another page)
    useEffect(() => {
        let isMounted = true;

        async function fetchLikedSongs() {
            if (!isAuthenticated) { setSongs([]); return; }
            setLoading(true);
            try {
                const res = await api.getLikedSongs();
                if (res?.data && isMounted) {
                    setSongs(res.data);
                }
            } catch (err) {
                console.warn("Liked songs fetch error:", err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchLikedSongs();
        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, likedIds.size]);

    const isCurrentPlaying = (song) => {
        if (!isPlaying || !currentSong || !song) return false;
        return String(song._id || song.id) === String(currentSong._id || currentSong.id);
    };

    const handlePlayClick = (e, song, queue) => {
        e.stopPropagation();
        if (isCurrentPlaying(song)) {
            togglePlayPause();
        } else {
            playSong(song, queue);
        }
    };

    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_COVER;
    };

    // Filter songs by IDs still in likedIds set (removes unliked songs instantly)
    const filteredByLiked = songs.filter((s) => likedIds.has(String(s._id || s.id)));

    const displaySongs = filteredByLiked
        .filter((song) => {
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            return (
                song.title?.toLowerCase().includes(term) ||
                song.artistName?.toLowerCase().includes(term) ||
                song.albumName?.toLowerCase().includes(term)
            );
        })
        .sort((a, b) => {
            if (sortBy === "Song") return (a.title || "").localeCompare(b.title || "");
            if (sortBy === "Artist") return (a.artistName || "").localeCompare(b.artistName || "");
            if (sortBy === "Album") return (a.albumName || "").localeCompare(b.albumName || "");
            return 0; // Recently Added — preserve API order
        });

    return (
        <main className="LikedSongs-page">

            {/* =================================
                HEADER
            ================================= */}
            <section className="liked-header">
                <div className="liked-icon">
                    <i className="fa-solid fa-heart"></i>
                </div>
                <div className="liked-info">
                    <p className="liked-label">PLAYLIST</p>
                    <h1>Liked Songs</h1>
                    <p>Your favorite songs, all in one place.</p>
                    <span>{displaySongs.length} song{displaySongs.length !== 1 ? "s" : ""}</span>
                </div>
            </section>


            {/* =================================
                CONTROLS
            ================================= */}
            <section className="liked-controls">
                <button
                    className="liked-play-button"
                    onClick={() => displaySongs.length > 0 && playSong(displaySongs[0], displaySongs)}
                    disabled={displaySongs.length === 0}
                    title="Play all liked songs"
                >
                    <i className="fa-solid fa-play"></i>
                    Play All
                </button>

                <div className="liked-search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="text"
                        placeholder="Search in Liked Songs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <i
                            className="fa-solid fa-xmark"
                            style={{ cursor: "pointer", marginLeft: "auto", opacity: 0.6 }}
                            onClick={() => setSearchTerm("")}
                        ></i>
                    )}
                </div>

                <select
                    className="liked-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="Recently Added">Recently Added</option>
                    <option value="Song">Song</option>
                    <option value="Artist">Artist</option>
                    <option value="Album">Album</option>
                </select>
            </section>


            {/* =================================
                SONG LIST
            ================================= */}
            <section className="song-list">

                {!isAuthenticated ? (
                    <div className="liked-empty-state">
                        <i className="fa-solid fa-lock" style={{ fontSize: "40px", color: "#444", marginBottom: "16px" }}></i>
                        <h3>Log in to see your Liked Songs</h3>
                        <p>Your liked songs are saved to your account.</p>
                    </div>
                ) : loading ? (
                    <div className="liked-empty-state">
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "28px", color: "#ff9500", marginBottom: "12px" }}></i>
                        <p>Loading your liked songs…</p>
                    </div>
                ) : displaySongs.length === 0 ? (
                    <div className="liked-empty-state">
                        <i className="fa-regular fa-heart" style={{ fontSize: "48px", color: "#444", marginBottom: "16px" }}></i>
                        <h3>No liked songs yet</h3>
                        <p>
                            {searchTerm
                                ? `No results for "${searchTerm}"`
                                : "Like songs from Home, Search, or your playlists to see them here."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header row */}
                        <div className="song-list-header">
                            <span>#</span>
                            <span>Title</span>
                            <span>Album</span>
                            <span>Duration</span>
                        </div>

                        {displaySongs.map((song, index) => (
                            <div
                                key={song._id || song.id || index}
                                className={`liked-song ${isCurrentPlaying(song) ? "liked-song--active" : ""}`}
                                onClick={() => playSong(song, displaySongs)}
                                style={{ cursor: "pointer" }}
                            >
                                <span className="song-number">
                                    {isCurrentPlaying(song)
                                        ? <i className="fa-solid fa-volume-high" style={{ color: "#ff9500", fontSize: "12px" }}></i>
                                        : index + 1
                                    }
                                </span>

                                <div className="song-title">
                                    <div className="song-image">
                                        {song.coverImage ? (
                                            <img
                                                src={song.coverImage}
                                                alt={song.title}
                                                style={{ width: "100%", height: "100%", borderRadius: "4px", objectFit: "cover" }}
                                                onError={handleImgError}
                                            />
                                        ) : (
                                            <i className="fa-solid fa-music"></i>
                                        )}
                                    </div>
                                    <div>
                                        <h3 style={{ color: isCurrentPlaying(song) ? "#ff9500" : "#fff" }}>{song.title}</h3>
                                        <p>{song.artistName || song.artist?.name || "Artist"}</p>
                                    </div>
                                </div>

                                <span className="song-album">
                                    {song.albumName || song.album?.title || "Single"}
                                </span>

                                <span className="song-duration">
                                    {song.duration || "0:00"}
                                </span>

                                {/* Right-side controls */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <LikeButton song={song} size="sm" />
                                    <button
                                        className="liked-song-play-btn"
                                        onClick={(e) => handlePlayClick(e, song, displaySongs)}
                                        title={isCurrentPlaying(song) ? "Pause" : "Play"}
                                        style={{
                                            background: "#ff9500",
                                            color: "#000",
                                            border: "none",
                                            width: "30px",
                                            height: "30px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            fontSize: "11px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <i className={`fa-solid ${isCurrentPlaying(song) ? "fa-pause" : "fa-play"}`}></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </section>

        </main>
    );
}

export default LikedSongs;