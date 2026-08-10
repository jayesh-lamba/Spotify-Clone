import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Album.css";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { useToast } from "../context/ToastContext";
import LikeButton from "../components/LikeButton";

const FALLBACK = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

function Album() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong, addToQueue, currentSong, isPlaying, togglePlayPause } = usePlayer();
  const { addToast } = useToast();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api.getAlbumById(id)
      .then((res) => {
        if (mounted) setAlbum(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Album not found");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [id]);

  const songs = album?.songs || [];

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
    addToast(`Playing album: ${album.title}`, "success");
  };

  const handleAddAllToQueue = () => {
    addToQueue(songs);
    addToast(`Added ${songs.length} songs to queue`, "success");
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "--";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalDuration = songs.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalMins = Math.round(totalDuration / 60);

  if (loading) return (
    <div className="album-page album-page-loading">
      <div className="album-spinner" />
      <p>Loading album...</p>
    </div>
  );

  if (error || !album) return (
    <div className="album-page album-page-error">
      <i className="fa-solid fa-compact-disc" />
      <h2>Album not found</h2>
      <p>{error}</p>
      <button className="album-back-btn" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left" /> Go Back
      </button>
    </div>
  );

  return (
    <div className="album-page">
      {/* Hero section */}
      <div className="album-hero">
        <div
          className="album-hero-bg"
          style={{ backgroundImage: `url(${album.coverImage || FALLBACK})` }}
        />
        <div className="album-hero-overlay" />

        <div className="album-hero-content">
          <div className="album-cover-wrapper">
            <img
              src={album.coverImage || FALLBACK}
              alt={album.title}
              className="album-cover"
              onError={(e) => { e.target.src = FALLBACK; }}
            />
          </div>

          <div className="album-info">
            <span className="album-label">Album</span>
            <h1 className="album-title">{album.title}</h1>

            <div className="album-meta">
              {album.artist && (
                <button
                  className="album-artist-link"
                  onClick={() => album.artist._id && navigate(`/artist/${album.artist._id}`)}
                >
                  {album.artist.image && (
                    <img src={album.artist.image} alt={album.artist.name} className="album-artist-mini-img"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  )}
                  {album.artist.name}
                </button>
              )}
              {album.releaseYear && <span className="album-meta-sep">•</span>}
              {album.releaseYear && <span className="album-year">{album.releaseYear}</span>}
              <span className="album-meta-sep">•</span>
              <span>{songs.length} song{songs.length !== 1 ? "s" : ""}</span>
              {totalMins > 0 && (
                <>
                  <span className="album-meta-sep">•</span>
                  <span>~{totalMins} min</span>
                </>
              )}
            </div>

            {album.description && (
              <p className="album-desc">{album.description}</p>
            )}

            <div className="album-actions">
              <button className="album-play-btn" onClick={handlePlayAll} disabled={songs.length === 0}>
                <i className="fa-solid fa-play" /> Play All
              </button>
              <button className="album-queue-btn" onClick={handleAddAllToQueue} disabled={songs.length === 0}>
                <i className="fa-solid fa-list" /> Add to Queue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="album-tracks">
        <div className="album-tracks-header">
          <span className="th-num">#</span>
          <span className="th-title">Title</span>
          <span className="th-duration"><i className="fa-regular fa-clock" /></span>
        </div>

        {songs.length === 0 ? (
          <div className="album-no-songs">
            <i className="fa-solid fa-music-slash" />
            <p>No songs in this album yet</p>
          </div>
        ) : (
          <div className="album-track-list">
            {songs.map((song, idx) => {
              const isCurrent = isCurrentSong(song);
              const isThisPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={song._id || song.id}
                  className={`album-track-row ${isCurrent ? "current-track" : ""}`}
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
                      aria-label={isThisPlaying ? "Pause" : "Play"}
                    >
                      <i className={`fa-solid ${isThisPlaying ? "fa-pause" : "fa-play"}`} />
                    </button>
                  </div>

                  <div className="track-info">
                    <span className="track-title" style={{ color: isCurrent ? "var(--accent-orange)" : undefined }}>
                      {song.title}
                    </span>
                    <span className="track-artist">{song.artistName || album.artist?.name}</span>
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
        )}
      </div>
    </div>
  );
}

export default Album;
