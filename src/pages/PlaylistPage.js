import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PlaylistPage.css";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import LikeButton from "../components/LikeButton";

const FALLBACK = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong, addToQueue, currentSong, isPlaying, togglePlayPause } = usePlayer();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaylist = () => {
    setLoading(true);
    api.getPlaylistById(id)
      .then((res) => setPlaylist(res.data || res))
      .catch((err) => setError(err.message || "Playlist not found"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlaylist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const songs = playlist?.songs || [];
  const isOwner = user && playlist?.user && String(playlist.user) === String(user._id || user.id);

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
    addToast(`Playing "${playlist.name}"`, "success");
  };

  const handleRemoveSong = async (songId) => {
    if (!isOwner) return;
    try {
      await api.removeSongFromPlaylist(id, songId);
      addToast("Song removed from playlist", "success");
      fetchPlaylist();
    } catch (err) {
      addToast(err.message || "Failed to remove song", "error");
    }
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
    <div className="playlist-page-loading">
      <div className="pp-spinner" />
      <p>Loading playlist...</p>
    </div>
  );

  if (error || !playlist) return (
    <div className="playlist-page-error">
      <i className="fa-solid fa-list-music" />
      <h2>Playlist not found</h2>
      <p>{error}</p>
      <button className="pp-back-btn" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left" /> Go Back
      </button>
    </div>
  );

  return (
    <div className="playlist-page">
      {/* Hero */}
      <div className="pp-hero">
        <div
          className="pp-hero-bg"
          style={{ backgroundImage: `url(${playlist.coverImage || FALLBACK})` }}
        />
        <div className="pp-hero-overlay" />

        <div className="pp-hero-content">
          <div className="pp-cover-wrapper">
            <img
              src={playlist.coverImage || FALLBACK}
              alt={playlist.name}
              className="pp-cover"
              onError={(e) => { e.target.src = FALLBACK; }}
            />
          </div>

          <div className="pp-info">
            <span className="pp-label">Playlist</span>
            <h1 className="pp-title">{playlist.name}</h1>

            <div className="pp-meta">
              {playlist.description && (
                <p className="pp-desc">{playlist.description}</p>
              )}
              <div className="pp-stats">
                <span>{songs.length} song{songs.length !== 1 ? "s" : ""}</span>
                {totalMins > 0 && (
                  <><span className="pp-sep">•</span><span>~{totalMins} min</span></>
                )}
              </div>
            </div>

            <div className="pp-actions">
              <button className="pp-play-btn" onClick={handlePlayAll} disabled={songs.length === 0}>
                <i className="fa-solid fa-play" /> Play All
              </button>
              <button
                className="pp-queue-btn"
                onClick={() => { addToQueue(songs); addToast(`Added ${songs.length} songs to queue`, "success"); }}
                disabled={songs.length === 0}
              >
                <i className="fa-solid fa-list" /> Add to Queue
              </button>
              {isOwner && (
                <button
                  className="pp-edit-btn"
                  onClick={() => navigate(`/create-playlist?edit=${id}`)}
                >
                  <i className="fa-solid fa-pen" /> Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="pp-tracks">
        <div className="pp-tracks-header">
          <span className="pth-num">#</span>
          <span className="pth-title">Title</span>
          <span className="pth-duration"><i className="fa-regular fa-clock" /></span>
        </div>

        {songs.length === 0 ? (
          <div className="pp-no-songs">
            <i className="fa-solid fa-music" />
            <p>This playlist is empty</p>
            {isOwner && (
              <button className="pp-add-btn" onClick={() => navigate("/search")}>
                <i className="fa-solid fa-plus" /> Add Songs
              </button>
            )}
          </div>
        ) : (
          <div className="pp-track-list">
            {songs.map((song, idx) => {
              const isCurrent = isCurrentSong(song);
              const isThisPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={song._id || song.id}
                  className={`pp-track-row ${isCurrent ? "current-track" : ""}`}
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
                    <button className="track-play-btn" onClick={() => handlePlay(song)}>
                      <i className={`fa-solid ${isThisPlaying ? "fa-pause" : "fa-play"}`} />
                    </button>
                  </div>

                  <img
                    src={song.coverImage || FALLBACK}
                    alt={song.title}
                    className="pp-track-cover"
                    onError={(e) => { e.target.src = FALLBACK; }}
                  />

                  <div className="track-info">
                    <span className="track-title" style={{ color: isCurrent ? "var(--accent-orange)" : undefined }}>
                      {song.title}
                    </span>
                    <span className="track-artist">{song.artistName || "Unknown Artist"}</span>
                  </div>

                  <LikeButton songId={song._id || song.id} size="sm" />

                  <button
                    className="track-queue-btn"
                    onClick={() => { addToQueue(song); addToast(`Added "${song.title}" to queue`, "success"); }}
                    title="Add to queue"
                  >
                    <i className="fa-solid fa-plus" />
                  </button>

                  {isOwner && (
                    <button
                      className="pp-remove-btn"
                      onClick={() => handleRemoveSong(song._id || song.id)}
                      title="Remove from playlist"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}

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

export default PlaylistPage;
