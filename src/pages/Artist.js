import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Artist.css";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { useToast } from "../context/ToastContext";
import LikeButton from "../components/LikeButton";

const FALLBACK = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";
const ARTIST_FALLBACK = "https://4kwallpapers.com/images/walls/thumbs_3t/22577.png";

function Artist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong, addToQueue, currentSong, isPlaying, togglePlayPause } = usePlayer();
  const { addToast } = useToast();

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllSongs, setShowAllSongs] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getArtistById(id),
      api.getArtistSongs(id),
    ])
      .then(([artistRes, songsRes]) => {
        if (!mounted) return;
        setArtist(artistRes.data);
        setSongs(songsRes.data || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Artist not found");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [id]);

  const isCurrentSong = (song) => {
    if (!currentSong || !song) return false;
    return String(song._id || song.id) === String(currentSong._id || currentSong.id);
  };

  const handlePlay = (song) => {
    if (isCurrentSong(song)) {
      togglePlayPause();
    } else {
      playSong(song, songs);
    }
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    playSong(songs[0], songs);
    addToast(`Playing songs by ${artist?.name}`, "success");
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "--";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatListeners = (n) => {
    if (!n) return null;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  const displaySongs = showAllSongs ? songs : songs.slice(0, 10);

  if (loading) return (
    <div className="artist-page artist-page-loading">
      <div className="artist-spinner" />
      <p>Loading artist...</p>
    </div>
  );

  if (error || !artist) return (
    <div className="artist-page artist-page-error">
      <i className="fa-solid fa-microphone-slash" />
      <h2>Artist not found</h2>
      <p>{error}</p>
      <button className="artist-back-btn" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left" /> Go Back
      </button>
    </div>
  );

  return (
    <div className="artist-page">
      {/* Hero */}
      <div className="artist-hero">
        <div
          className="artist-hero-bg"
          style={{ backgroundImage: `url(${artist.image || ARTIST_FALLBACK})` }}
        />
        <div className="artist-hero-overlay" />

        <div className="artist-hero-content">
          <div className="artist-avatar-wrapper">
            <img
              src={artist.image || ARTIST_FALLBACK}
              alt={artist.name}
              className="artist-avatar"
              onError={(e) => { e.target.src = ARTIST_FALLBACK; }}
            />
          </div>

          <div className="artist-info">
            <span className="artist-label">Artist</span>
            <h1 className="artist-name">{artist.name}</h1>

            <div className="artist-meta">
              {artist.monthlyListeners && (
                <span className="artist-listeners">
                  <i className="fa-solid fa-headphones" />
                  {formatListeners(artist.monthlyListeners)} monthly listeners
                </span>
              )}
              {artist.genres?.length > 0 && (
                <div className="artist-genres">
                  {artist.genres.slice(0, 4).map((g) => (
                    <span key={g} className="artist-genre-tag">{g}</span>
                  ))}
                </div>
              )}
            </div>

            {artist.bio && <p className="artist-bio">{artist.bio}</p>}

            <div className="artist-actions">
              <button className="artist-play-btn" onClick={handlePlayAll} disabled={songs.length === 0}>
                <i className="fa-solid fa-play" /> Play
              </button>
              <button
                className="artist-queue-btn"
                onClick={() => { addToQueue(songs); addToast(`Added ${songs.length} songs to queue`, "success"); }}
                disabled={songs.length === 0}
              >
                <i className="fa-solid fa-list-plus" /> Add All to Queue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Songs */}
      <div className="artist-songs">
        <div className="artist-section-header">
          <h2>Popular Songs</h2>
          <span className="artist-songs-count">{songs.length} songs</span>
        </div>

        {songs.length === 0 ? (
          <div className="artist-no-songs">
            <i className="fa-solid fa-music" />
            <p>No songs found for this artist</p>
          </div>
        ) : (
          <>
            <div className="artist-track-list">
              {displaySongs.map((song, idx) => {
                const isCurrent = isCurrentSong(song);
                const isThisPlaying = isCurrent && isPlaying;

                return (
                  <div
                    key={song._id || song.id}
                    className={`artist-track-row ${isCurrent ? "current-track" : ""}`}
                    onDoubleClick={() => handlePlay(song)}
                  >
                    <div className="track-num">
                      {isThisPlaying ? (
                        <span className="track-playing-bars">
                          <span /><span /><span />
                        </span>
                      ) : (
                        <span className="track-index">{idx + 1}</span>
                      )}
                      <button
                        className="track-play-btn"
                        onClick={() => handlePlay(song)}
                      >
                        <i className={`fa-solid ${isThisPlaying ? "fa-pause" : "fa-play"}`} />
                      </button>
                    </div>

                    <img
                      src={song.coverImage || FALLBACK}
                      alt={song.title}
                      className="artist-track-cover"
                      onError={(e) => { e.target.src = FALLBACK; }}
                    />

                    <div className="track-info">
                      <span className="track-title" style={{ color: isCurrent ? "var(--accent-orange)" : undefined }}>
                        {song.title}
                      </span>
                      {song.albumName && (
                        <span className="track-album">{song.albumName}</span>
                      )}
                    </div>

                    <LikeButton songId={song._id || song.id} size="sm" />

                    <button
                      className="track-queue-btn"
                      onClick={() => { addToQueue(song); addToast(`Added "${song.title}" to queue`, "success"); }}
                      title="Add to queue"
                    >
                      <i className="fa-solid fa-plus" />
                    </button>

                    <span className="track-duration">
                      {formatTime(song.durationSeconds) || song.duration || "--"}
                    </span>
                  </div>
                );
              })}
            </div>

            {songs.length > 10 && (
              <button
                className="artist-show-more"
                onClick={() => setShowAllSongs((p) => !p)}
              >
                {showAllSongs ? "Show Less" : `Show All ${songs.length} Songs`}
                <i className={`fa-solid fa-chevron-${showAllSongs ? "up" : "down"}`} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Artist;
