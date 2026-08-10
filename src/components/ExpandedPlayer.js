import React, { useRef, useState } from "react";
import "./ExpandedPlayer.css";
import { usePlayer } from "../context/PlayerContext";
import AudioVisualizer from "./AudioVisualizer";
import LyricsSidebar from "./LyricsSidebar";
import LikeButton from "./LikeButton";

function ExpandedPlayer({ onClose }) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlayPause,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleMute,
    setVolume,
    seekByPercent,
    setIsQueueOpen,
  } = usePlayer();

  const [showLyrics, setShowLyrics] = useState(false);
  const progressBarRef = useRef(null);

  const coverFallback = "https://4kwallpapers.com/images/walls/thumbs_3t/22577.png";

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalDuration = duration > 0 ? duration : (currentSong?.durationSeconds || 0);
  const progressPercent = totalDuration > 0
    ? Math.min(100, ((currentTime || 0) / totalDuration) * 100)
    : 0;

  const handleProgressClick = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    seekByPercent(percent);
  };

  const repeatTitle = repeatMode === "off" ? "Repeat Off" : repeatMode === "all" ? "Repeat All" : "Repeat One";
  const activeColor = "var(--accent-orange)";

  return (
    <div className="expanded-player-overlay" onClick={onClose}>
      <div className="expanded-player" onClick={(e) => e.stopPropagation()}>

        {/* Background blur from artwork */}
        <div
          className="expanded-bg"
          style={{
            backgroundImage: `url(${currentSong?.coverImage || coverFallback})`,
          }}
        />
        <div className="expanded-bg-overlay" />

        {/* Header */}
        <div className="expanded-header">
          <button className="expanded-close-btn" onClick={onClose} aria-label="Close expanded player">
            <i className="fa-solid fa-chevron-down" />
          </button>
          <div className="expanded-header-info">
            <span className="expanded-source">Now Playing</span>
            {currentSong?.albumName && (
              <span className="expanded-album">{currentSong.albumName}</span>
            )}
          </div>
          <button
            className="expanded-queue-btn"
            onClick={() => { setIsQueueOpen(true); onClose(); }}
            aria-label="Open queue"
            title="Queue"
          >
            <i className="fa-solid fa-list" />
          </button>
        </div>

        {/* Main content */}
        <div className="expanded-content">

          {/* Left: artwork + visualizer */}
          <div className="expanded-left">
            <div className="expanded-artwork-wrapper">
              <img
                src={currentSong?.coverImage || coverFallback}
                alt={currentSong?.title || "Now Playing"}
                className={`expanded-artwork ${isPlaying ? "playing" : ""}`}
                onError={(e) => { e.target.src = coverFallback; }}
              />
            </div>
            <div className="expanded-visualizer">
              <AudioVisualizer isActive={true} />
            </div>
          </div>

          {/* Right: controls */}
          <div className="expanded-right">
            {/* Song info */}
            <div className="expanded-song-info">
              <div className="expanded-song-text">
                <h1 className="expanded-title">{currentSong?.title || "No Song"}</h1>
                <p className="expanded-artist">{currentSong?.artistName || "Unknown Artist"}</p>
              </div>
              {currentSong?._id && (
                <LikeButton songId={currentSong._id} size="large" />
              )}
            </div>

            {/* Progress bar */}
            <div className="expanded-progress-wrapper">
              <div
                className="expanded-progress-bar"
                ref={progressBarRef}
                onClick={handleProgressClick}
              >
                <div className="expanded-progress-fill" style={{ width: `${progressPercent}%` }}>
                  <div className="expanded-progress-thumb" />
                </div>
              </div>
              <div className="expanded-time-row">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration) || currentSong?.duration || "0:00"}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="expanded-controls">
              <button
                className={`exp-ctrl-btn ${isShuffle ? "active" : ""}`}
                onClick={toggleShuffle}
                title={`Shuffle ${isShuffle ? "On" : "Off"}`}
              >
                <i className="fa-solid fa-shuffle" />
                {isShuffle && <span className="exp-active-dot" />}
              </button>

              <button className="exp-ctrl-btn" onClick={playPrevious} title="Previous">
                <i className="fa-solid fa-backward-step" style={{ fontSize: "22px" }} />
              </button>

              <button className="exp-play-btn" onClick={togglePlayPause} title={isPlaying ? "Pause" : "Play"}>
                <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`} />
              </button>

              <button className="exp-ctrl-btn" onClick={playNext} title="Next">
                <i className="fa-solid fa-forward-step" style={{ fontSize: "22px" }} />
              </button>

              <button
                className={`exp-ctrl-btn ${repeatMode !== "off" ? "active" : ""}`}
                onClick={toggleRepeat}
                title={repeatTitle}
                style={{ position: "relative" }}
              >
                <i className="fa-solid fa-repeat" />
                {repeatMode === "one" && (
                  <span style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-2px",
                    fontSize: "9px",
                    fontWeight: "800",
                    color: activeColor
                  }}>1</span>
                )}
                {repeatMode !== "off" && <span className="exp-active-dot" />}
              </button>
            </div>

            {/* Volume */}
            <div className="expanded-volume-row">
              <button
                className="exp-vol-icon"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <i className={`fa-solid ${isMuted || volume === 0 ? "fa-volume-xmark" : volume < 0.5 ? "fa-volume-low" : "fa-volume-high"}`} />
              </button>
              <input
                type="range"
                className="expanded-volume-slider"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume"
              />
              <i className="fa-solid fa-volume-high" style={{ color: "var(--text-muted)", fontSize: "13px" }} />
            </div>

            {/* Extra actions */}
            <div className="expanded-actions">
              <button
                className={`expanded-action-btn ${showLyrics ? "active" : ""}`}
                onClick={() => setShowLyrics((p) => !p)}
                title="Lyrics"
              >
                <i className="fa-solid fa-quote-right" />
                <span>Lyrics</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Lyrics overlay when open */}
      <LyricsSidebar isOpen={showLyrics} onClose={() => setShowLyrics(false)} />
    </div>
  );
}

export default ExpandedPlayer;
