import "./LyricsSidebar.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePlayer } from "../context/PlayerContext";
import api from "../services/api";
import { parseLRC, findActiveLine } from "../utils/lrcParser";

const FALLBACK_COVER = "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg";

/**
 * LyricsSidebar
 *
 * Props:
 *   isOpen  {boolean}   — controlled by Player's Lyrics button
 *   onClose {function}  — called when user clicks ✕
 */
function LyricsSidebar({ isOpen, onClose }) {
    const { currentSong, currentTime } = usePlayer();

    // Raw lyrics data from API
    const [lyricsData, setLyricsData]     = useState(null);   // { synced, lines }
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState(null);

    // Active line index (synced lyrics only)
    const [activeIndex, setActiveIndex]   = useState(-1);

    // Ref to active line DOM element for smooth scroll
    const activeLineRef = useRef(null);
    const scrollBoxRef  = useRef(null);

    // Track last fetched song id to avoid redundant requests
    const lastFetchedId = useRef(null);

    // ── Fetch lyrics whenever the song changes ───────────────────────────────
    useEffect(() => {
        const songId = currentSong?._id || currentSong?.id;
        if (!songId || typeof songId !== "string" || songId.length !== 24) {
            setLyricsData(null);
            setError(null);
            lastFetchedId.current = null;
            return;
        }

        if (lastFetchedId.current === songId) return; // already loaded
        lastFetchedId.current = songId;

        setLoading(true);
        setError(null);
        setActiveIndex(-1);
        // Reset scroll position
        if (scrollBoxRef.current) scrollBoxRef.current.scrollTop = 0;

        api.getLyrics(songId)
            .then((res) => {
                const rawLyrics = res?.data?.lyrics || res?.lyrics || null;
                if (!rawLyrics) {
                    setLyricsData({ synced: false, lines: [] });
                } else {
                    setLyricsData(parseLRC(rawLyrics));
                }
            })
            .catch(() => {
                setError("Could not load lyrics for this song.");
                setLyricsData(null);
            })
            .finally(() => setLoading(false));
    }, [currentSong?._id, currentSong?.id]);

    // ── Update active line index as audio time changes ───────────────────────
    useEffect(() => {
        if (!lyricsData?.synced || !lyricsData.lines.length) return;
        const idx = findActiveLine(lyricsData.lines, currentTime);
        setActiveIndex(idx);
    }, [currentTime, lyricsData]);

    // ── Smooth-scroll active line toward center of scroll box ────────────────
    useEffect(() => {
        if (activeIndex < 0 || !activeLineRef.current || !scrollBoxRef.current) return;

        const box  = scrollBoxRef.current;
        const line = activeLineRef.current;

        // Center the active line within the scroll container
        const boxMid  = box.clientHeight / 2;
        const lineTop = line.offsetTop;
        const lineH   = line.clientHeight;

        const desired = lineTop - boxMid + lineH / 2;
        box.scrollTo({ top: desired, behavior: "smooth" });
    }, [activeIndex]);

    // ── Handle keyboard close ────────────────────────────────────────────────
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        } else {
            document.removeEventListener("keydown", handleKeyDown);
        }
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleKeyDown]);

    // ── Render helpers ───────────────────────────────────────────────────────
    const renderLines = () => {
        if (loading) {
            return (
                <div className="ls-status">
                    <div className="ls-spinner"></div>
                    <p>Loading lyrics…</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="ls-status ls-status--error">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <p>{error}</p>
                </div>
            );
        }

        if (!lyricsData || lyricsData.lines.length === 0) {
            return (
                <div className="ls-status ls-status--empty">
                    <i className="fa-regular fa-file-lines"></i>
                    <p>No lyrics available for this song.</p>
                </div>
            );
        }

        if (!lyricsData.synced) {
            return (
                <>
                    <p className="ls-unsynced-notice">
                        <i className="fa-solid fa-circle-info"></i>
                        Synced lyrics unavailable
                    </p>
                    <div className="ls-plain-lyrics">
                        {lyricsData.lines.map((line, i) => (
                            <p key={i} className="ls-plain-line">
                                {line.text}
                            </p>
                        ))}
                    </div>
                </>
            );
        }

        // Synced lyrics
        return (
            <div className="ls-synced-lyrics">
                {lyricsData.lines.map((line, i) => {
                    const isActive = i === activeIndex;
                    const isPrev   = i < activeIndex;
                    return (
                        <p
                            key={i}
                            ref={isActive ? activeLineRef : null}
                            className={[
                                "ls-synced-line",
                                isActive ? "ls-synced-line--active" : "",
                                isPrev   ? "ls-synced-line--past"   : "",
                            ].join(" ")}
                        >
                            {line.text}
                        </p>
                    );
                })}
                {/* Bottom spacer so last lines can reach center */}
                <div className="ls-bottom-spacer" aria-hidden="true" />
            </div>
        );
    };

    return (
        <>
            {/* Dark overlay — clicking it closes the sidebar */}
            <div
                className={`ls-overlay ${isOpen ? "ls-overlay--visible" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar panel */}
            <aside
                className={`ls-sidebar ${isOpen ? "ls-sidebar--open" : ""}`}
                aria-label="Lyrics panel"
            >
                {/* Header */}
                <div className="ls-header">
                    <div className="ls-header-art">
                        <img
                            src={currentSong?.coverImage || FALLBACK_COVER}
                            alt={currentSong?.title || "Album art"}
                            onError={(e) => { e.target.src = FALLBACK_COVER; }}
                        />
                    </div>
                    <div className="ls-header-info">
                        <span className="ls-label">LYRICS</span>
                        <h2 className="ls-song-title">{currentSong?.title || "No song playing"}</h2>
                        <p className="ls-song-artist">{currentSong?.artistName || "—"}</p>
                    </div>
                    <button
                        className="ls-close-btn"
                        onClick={onClose}
                        aria-label="Close lyrics"
                        title="Close lyrics (Esc)"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Divider */}
                <div className="ls-divider" />

                {/* Scrollable lyrics area */}
                <div className="ls-scroll-box" ref={scrollBoxRef}>
                    {renderLines()}
                </div>
            </aside>
        </>
    );
}

export default LyricsSidebar;
