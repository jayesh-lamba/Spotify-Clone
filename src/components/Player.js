import "./Player.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { usePlayer } from "../context/PlayerContext";
import { useRef, useState } from "react";
import LyricsSidebar from "./LyricsSidebar";
import QueueModal from "./QueueModal";
import ExpandedPlayer from "./ExpandedPlayer";

function Player() {
    const {
        currentSong,
        isPlaying,
        playbackMessage,
        togglePlayPause,
        playNext,
        playPrevious,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        isExpanded,
        isQueueOpen,
        sleepRemainingSeconds,
        seekByPercent,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleExpanded,
        setIsQueueOpen,
    } = usePlayer();

    const [isLyricsOpen, setIsLyricsOpen] = useState(false);
    const progressBarRef = useRef(null);

    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const formatSleepRemaining = (secs) => {
        if (!secs) return "";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
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

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const coverFallback = "https://4kwallpapers.com/images/walls/thumbs_3t/22577.png";

    // Icon colors for active states
    const activeColor = "var(--accent-orange)";
    const inactiveColor = "var(--text-muted)";

    const repeatIcon = repeatMode === "one"
        ? "fa-solid fa-repeat"
        : "fa-solid fa-repeat";
    const repeatTitle = repeatMode === "off" ? "Repeat Off" : repeatMode === "all" ? "Repeat All" : "Repeat One";

    return (
        <>
            {/* Expanded Player Overlay */}
            {isExpanded && <ExpandedPlayer onClose={() => toggleExpanded()} />}

            {/* Queue Modal */}
            <QueueModal isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

            <div className="Player">

                {/* Left: Album art + Song info */}
                <div className="left-player" onClick={toggleExpanded} style={{ cursor: "pointer" }}>
                    <img
                        src={currentSong?.coverImage || coverFallback}
                        alt={currentSong?.title || "Song"}
                        className="album-image"
                        onError={(e) => { e.target.src = coverFallback; }}
                    />
                    <div className="song-info">
                        <p className="player-song-title song-name">{currentSong?.title || "No Song Selected"}</p>
                        <p className="player-artist-name artist-name">{currentSong?.artistName || "Unknown Artist"}</p>
                        {playbackMessage && (
                            <p className="player-message" style={{ color: "#ff8c8c", fontSize: "11px", marginTop: "2px", fontWeight: "bold" }}>
                                {playbackMessage}
                            </p>
                        )}
                    </div>
                </div>

                {/* Center: Controls + Progress */}
                <div className="center-player">
                    <div className="player-controls">
                        {/* Shuffle */}
                        <div
                            className="shuffle-btn player-control-btn"
                            onClick={toggleShuffle}
                            title={`Shuffle ${isShuffle ? "On" : "Off"}`}
                            style={{ cursor: "pointer" }}
                        >
                            <i
                                className="fa-solid fa-shuffle"
                                style={{ color: isShuffle ? activeColor : inactiveColor, fontSize: "14px" }}
                            />
                            {isShuffle && <span className="active-dot" />}
                        </div>

                        <div className="previous" onClick={playPrevious} style={{ cursor: "pointer" }}>
                            <i className="fa-solid fa-backward-step" />
                        </div>

                        <div className="play-pause" onClick={togglePlayPause} style={{ cursor: "pointer" }}>
                            <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`} />
                        </div>

                        <div className="next" onClick={playNext} style={{ cursor: "pointer" }}>
                            <i className="fa-solid fa-forward-step" />
                        </div>

                        {/* Repeat */}
                        <div
                            className="repeat-btn player-control-btn"
                            onClick={toggleRepeat}
                            title={repeatTitle}
                            style={{ cursor: "pointer", position: "relative" }}
                        >
                            <i
                                className={repeatIcon}
                                style={{
                                    color: repeatMode !== "off" ? activeColor : inactiveColor,
                                    fontSize: "14px"
                                }}
                            />
                            {repeatMode === "one" && (
                                <span style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    fontSize: "8px",
                                    fontWeight: "800",
                                    color: activeColor,
                                    lineHeight: 1
                                }}>1</span>
                            )}
                            {repeatMode !== "off" && <span className="active-dot" />}
                        </div>
                    </div>

                    <div className="progress-container">
                        <span>{formatTime(currentTime)}</span>
                        <div
                            className="progress-bar"
                            ref={progressBarRef}
                            onClick={handleProgressClick}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="progress" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span>{formatTime(totalDuration) || currentSong?.duration || "0:00"}</span>
                    </div>
                </div>

                {/* Right: Lyrics, Queue, Volume */}
                <div className="right-player">
                    {/* Sleep timer indicator */}
                    {sleepRemainingSeconds > 0 && (
                        <div
                            className="sleep-timer-indicator"
                            title={`Sleep timer: ${formatSleepRemaining(sleepRemainingSeconds)} remaining`}
                        >
                            <i className="fa-solid fa-moon" style={{ color: activeColor, fontSize: "13px" }} />
                            <span style={{ color: activeColor, fontSize: "11px", fontWeight: "600" }}>
                                {formatSleepRemaining(sleepRemainingSeconds)}
                            </span>
                        </div>
                    )}

                    <div
                        className="lyrics-btn"
                        onClick={() => setIsLyricsOpen((p) => !p)}
                        title="Lyrics"
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <i
                            className="fa-solid fa-quote-right"
                            style={{ color: isLyricsOpen ? activeColor : inactiveColor, fontSize: "16px" }}
                        />
                    </div>

                    <div
                        className="queue"
                        onClick={() => setIsQueueOpen((p) => !p)}
                        title="Queue"
                        style={{ cursor: "pointer" }}
                    >
                        <i
                            className="fa-solid fa-list"
                            style={{ color: isQueueOpen ? activeColor : inactiveColor }}
                        />
                    </div>

                    <div
                        className="volume-icon"
                        onClick={toggleMute}
                        style={{ cursor: "pointer" }}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        <i
                            className={`fa-solid ${isMuted || volume === 0 ? "fa-volume-xmark" : volume < 0.5 ? "fa-volume-low" : "fa-volume-high"}`}
                        />
                    </div>

                    <div className="volume-slider">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.02"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            style={{
                                width: "80px",
                                accentColor: "var(--accent-orange)",
                                cursor: "pointer",
                                appearance: "auto",
                            }}
                            aria-label="Volume"
                        />
                    </div>
                </div>

            </div>

            {/* Lyrics Sidebar */}
            <LyricsSidebar isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
        </>
    );
}

export default Player;