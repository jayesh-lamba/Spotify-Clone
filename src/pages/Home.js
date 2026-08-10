import "./Home.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LikeButton from "../components/LikeButton";

const FALLBACK_COVER = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

/* ── Reusable song card defined at module level ── */
const SongCard = ({ song, queue, isPlayingThis, onPlayClick, onCardClick, onQueueClick }) => (
    <div
        className="sc-card"
        onClick={() => onCardClick(song, queue)}
    >
        <div className="sc-artwork">
            <img
                src={song.coverImage || FALLBACK_COVER}
                alt={song.title}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_COVER;
                }}
            />
            <button
                className="sc-play-btn"
                onClick={(e) => onPlayClick(e, song, queue)}
                title={isPlayingThis ? "Pause" : "Play"}
            >
                <i className={`fa-solid ${isPlayingThis ? "fa-pause" : "fa-play"}`}></i>
            </button>
            {onQueueClick && (
                <button
                    className="sc-queue-btn"
                    onClick={(e) => { e.stopPropagation(); onQueueClick(song); }}
                    title="Add to queue"
                >
                    <i className="fa-solid fa-plus" />
                </button>
            )}
        </div>
        <div className="sc-info">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
                <p className="sc-title" style={{ flex: 1, minWidth: 0 }}>{song.title}</p>
                <LikeButton song={song} size="sm" />
            </div>
            <span className="sc-artist">{song.artistName || song.artist?.name || "Unknown Artist"}</span>
            <div className="sc-meta">
                <span className="sc-album">{song.albumName || "Single"}</span>
                <span className="sc-duration">{song.duration || "0:00"}</span>
            </div>
        </div>
    </div>
);

function Home() {
    const { playSong, addToQueue, currentSong, isPlaying, togglePlayPause } = usePlayer();
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [allSongs, setAllSongs] = useState([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
    const [popularAlbums, setPopularAlbums] = useState([]);
    const [trendingSongs, setTrendingSongs] = useState([]);
    const [popularArtists, setPopularArtists] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        let isMounted = true;

        async function fetchHomeData() {
            try {
                const [songsRes, trendingRes, albumsRes, artistsRes] = await Promise.allSettled([
                    api.getSongs({ limit: 500 }),
                    api.getTrendingSongs(10),
                    api.getAlbums({ limit: 10 }),
                    api.getArtists({ limit: 10 }),
                ]);

                if (!isMounted) return;

                if (songsRes.status === "fulfilled" && songsRes.value?.data?.length) {
                    setAllSongs(songsRes.value.data);
                }
                if (trendingRes.status === "fulfilled" && trendingRes.value?.data?.length) {
                    setTrendingSongs(trendingRes.value.data);
                }
                if (albumsRes.status === "fulfilled" && albumsRes.value?.data?.length) {
                    setPopularAlbums(albumsRes.value.data);
                }
                if (artistsRes.status === "fulfilled" && artistsRes.value?.data?.length) {
                    setPopularArtists(artistsRes.value.data);
                }

                if (isAuthenticated) {
                    try {
                        const recentRes = await api.getRecentlyPlayed();
                        if (recentRes?.data?.length && isMounted) {
                            setRecentlyPlayed(recentRes.data);
                        }
                    } catch (_) {}
                    try {
                        const recRes = await api.getRecommendations(12);
                        if (recRes?.data?.length && isMounted) {
                            setRecommendations(recRes.data);
                        }
                    } catch (_) {}
                }
            } catch (err) {
                console.warn("Failed to fetch home API data:", err.message);
            }
        }

        fetchHomeData();
        return () => { isMounted = false; };
    }, [isAuthenticated]);

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

    const handleAddToQueue = (song) => {
        addToQueue(song);
        addToast(`Added "${song.title}" to queue`, "success");
    };

    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_COVER;
    };

    const quickPicks = allSongs.length ? allSongs.slice(0, 8) : [];
    const trending = trendingSongs.length ? trendingSongs : allSongs.slice(0, 10);
    const albums = popularAlbums.length ? popularAlbums : [];
    const artists = popularArtists.length ? popularArtists : [];

    return (
        <main className="Home">

            {/* Quick Picks */}
            {quickPicks.length > 0 && (
                <section className="quick-picks">
                    <h2>Quick Picks</h2>
                    <div className="sc-grid">
                        {quickPicks.map((song) => (
                            <SongCard
                                key={song._id || song.id}
                                song={song}
                                queue={allSongs}
                                isPlayingThis={isCurrentPlaying(song)}
                                onPlayClick={handlePlayClick}
                                onCardClick={(s, q) => playSong(s, q)}
                                onQueueClick={handleAddToQueue}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Recommendations (authenticated users) */}
            {recommendations.length > 0 && (
                <section className="quick-picks">
                    <h2>Recommended For You</h2>
                    <div className="sc-grid">
                        {recommendations.map((song) => (
                            <SongCard
                                key={song._id || song.id}
                                song={song}
                                queue={recommendations}
                                isPlayingThis={isCurrentPlaying(song)}
                                onPlayClick={handlePlayClick}
                                onCardClick={(s, q) => playSong(s, q)}
                                onQueueClick={handleAddToQueue}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ALL SONGS */}
            <section className="all-songs-section">
                <h2>All Songs ({allSongs.length})</h2>
                <div className="sc-grid">
                    {allSongs.map((song) => (
                        <SongCard
                            key={song._id || song.id}
                            song={song}
                            queue={allSongs}
                            isPlayingThis={isCurrentPlaying(song)}
                            onPlayClick={handlePlayClick}
                            onCardClick={(s, q) => playSong(s, q)}
                            onQueueClick={handleAddToQueue}
                        />
                    ))}
                </div>
            </section>

            {/* Recently Played */}
            {recentlyPlayed.length > 0 && (
                <section className="recently-played">
                    <h2>Recently Played</h2>
                    <div className="sc-grid">
                        {recentlyPlayed.map((item, idx) => {
                            const song = item.song || item;
                            return (
                                <SongCard
                                    key={song._id || song.id || idx}
                                    song={song}
                                    queue={allSongs}
                                    isPlayingThis={isCurrentPlaying(song)}
                                    onPlayClick={handlePlayClick}
                                    onCardClick={(s, q) => playSong(s, q)}
                                />
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Popular Albums */}
            {albums.length > 0 && (
                <section className="popular-albums">
                    <h2>Popular Albums</h2>
                    <div className="sc-grid">
                        {albums.map((album) => (
                            <div
                                key={album._id || album.id}
                                className="sc-card"
                                onClick={() => navigate(`/album/${album._id || album.id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="sc-artwork">
                                    <img
                                        src={album.coverImage || FALLBACK_COVER}
                                        alt={album.title}
                                        onError={handleImgError}
                                    />
                                    <div className="sc-play-btn" style={{ pointerEvents: "none" }}>
                                        <i className="fa-solid fa-arrow-right" />
                                    </div>
                                </div>
                                <div className="sc-info">
                                    <p className="sc-title">{album.title}</p>
                                    <span className="sc-artist">{album.artistName || album.artist?.name || "Artist"}</span>
                                    <span className="sc-album" style={{ marginTop: "4px" }}>Album</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Songs */}
            {trending.length > 0 && (
                <section className="trending-songs">
                    <h2>Trending Songs</h2>
                    <div className="song-list">
                        {trending.map((song, index) => (
                            <div
                                key={song._id || song.id}
                                className="trending-song"
                                onClick={() => playSong(song, allSongs)}
                            >
                                <span className="song-num">{String(index + 1).padStart(2, "0")}</span>
                                <img
                                    src={song.coverImage || FALLBACK_COVER}
                                    alt={song.title}
                                    className="trending-song-img"
                                    onError={handleImgError}
                                />
                                <p className="trending-song-title">{song.title}</p>
                                <p className="trending-song-artist">{song.artistName || song.artist?.name || "Unknown Artist"}</p>
                                <span className="trending-song-duration">{song.duration || "0:00"}</span>
                                <LikeButton song={song} size="sm" />
                                <button
                                    className="trending-song-play-btn"
                                    onClick={(e) => handlePlayClick(e, song, allSongs)}
                                    title={isCurrentPlaying(song) ? "Pause" : "Play"}
                                >
                                    <i className={`fa-solid ${isCurrentPlaying(song) ? "fa-pause" : "fa-play"}`}></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Made For You */}
            <section className="made-for-you">
                <h2>Made For You</h2>
                <p className="section-subtitle">Music selected for your listening mood.</p>
                <div className="made-for-grid">
                    <div className="made-for-card">
                        <div className="made-for-icon"><i className="fa-solid fa-music"></i></div>
                        <div><h3>Daily Mix</h3><p>Your favorite songs mixed with something new.</p></div>
                    </div>
                    <div className="made-for-card">
                        <div className="made-for-icon"><i className="fa-solid fa-fire"></i></div>
                        <div><h3>Hot Hits</h3><p>The tracks everyone is listening to right now.</p></div>
                    </div>
                    <div className="made-for-card">
                        <div className="made-for-icon"><i className="fa-solid fa-moon"></i></div>
                        <div><h3>Late Night</h3><p>Chill music for your late-night listening sessions.</p></div>
                    </div>
                </div>
            </section>

            {/* Popular Artists */}
            {artists.length > 0 && (
                <section className="popular-artists">
                    <h2>Popular Artists</h2>
                    <p className="section-subtitle">Artists you might want to listen to.</p>
                    <div className="artist-grid">
                        {artists.map((artist) => (
                            <div
                                key={artist._id || artist.id}
                                className="artist-card"
                                onClick={() => navigate(`/artist/${artist._id || artist.id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="artist-placeholder">
                                    {artist.image ? (
                                        <img
                                            src={artist.image}
                                            alt={artist.name}
                                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                            onError={handleImgError}
                                        />
                                    ) : (
                                        <i className="fa-solid fa-user"></i>
                                    )}
                                </div>
                                <h3>{artist.name}</h3>
                                <p>Artist</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Listening Moods */}
            <section className="listening-moods">
                <h2>Browse Your Mood</h2>
                <p className="section-subtitle">Find music that matches your vibe.</p>
                <div className="mood-grid">
                    <div className="mood-card mood-orange"><i className="fa-solid fa-bolt"></i><h3>Energy</h3><p>Get moving</p></div>
                    <div className="mood-card mood-purple"><i className="fa-solid fa-cloud"></i><h3>Chill</h3><p>Slow it down</p></div>
                    <div className="mood-card mood-blue"><i className="fa-solid fa-heart"></i><h3>Romance</h3><p>Feel the music</p></div>
                    <div className="mood-card mood-red"><i className="fa-solid fa-fire"></i><h3>Workout</h3><p>Turn it up</p></div>
                </div>
            </section>

            {/* ORIVIO Discovery */}
            <section className="orivio-discovery">
                <div className="discovery-content">
                    <span>ORIVIO</span>
                    <h2>Your music.<br />Your world.</h2>
                    <p>Discover new music, revisit your favorites and build your own listening experience.</p>
                </div>
                <div className="discovery-decoration">
                    <div className="music-circle"><i className="fa-solid fa-headphones"></i></div>
                    <div className="floating-note note-one">♪</div>
                    <div className="floating-note note-two">♫</div>
                    <div className="floating-note note-three">♪</div>
                </div>
            </section>

        </main>
    );
}

export default Home;