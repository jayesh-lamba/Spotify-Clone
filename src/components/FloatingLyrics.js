import "./FloatingLyrics.css";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../context/PlayerContext";
import api from "../services/api";
import { parseLRC, findActiveLine } from "../utils/lrcParser";

/**
 * FloatingLyrics — always-visible 3-line synced lyrics panel
 * Mounts once in App.js, reads currentSong & currentTime from PlayerContext.
 * No extra audio element — purely reactive.
 */
function FloatingLyrics() {
    const { currentSong, currentTime, isPlaying } = usePlayer();

    const [lyricsData, setLyricsData] = useState(null);    // { synced, lines }
    const [activeIndex, setActiveIndex] = useState(-1);
    const [visible, setVisible] = useState(false);

    const lastFetchedId = useRef(null);

    // ── Show/hide based on playing state ────────────────────────────────────
    useEffect(() => {
        const songId = currentSong?._id || currentSong?.id;
        const hasRealSong = songId && String(songId).length === 24;
        setVisible(Boolean(isPlaying && hasRealSong));
    }, [isPlaying, currentSong]);

    // ── Fetch lyrics when song changes ───────────────────────────────────────
    useEffect(() => {
        const songId = currentSong?._id || currentSong?.id;
        if (!songId || String(songId).length !== 24) {
            setLyricsData(null);
            setActiveIndex(-1);
            lastFetchedId.current = null;
            return;
        }
        if (lastFetchedId.current === songId) return;
        lastFetchedId.current = songId;

        setLyricsData(null);
        setActiveIndex(-1);

        api.getLyrics(songId)
            .then((res) => {
                const raw = res?.data?.lyrics || res?.lyrics || null;
                setLyricsData(raw ? parseLRC(raw) : { synced: false, lines: [] });
            })
            .catch(() => {
                setLyricsData({ synced: false, lines: [] });
            });
    }, [currentSong?._id, currentSong?.id]);

    // ── Track active line as time updates ────────────────────────────────────
    useEffect(() => {
        if (!lyricsData?.synced || !lyricsData.lines.length) return;
        const idx = findActiveLine(lyricsData.lines, currentTime);
        setActiveIndex(idx);
    }, [currentTime, lyricsData]);

    // ── Don't render if not playing ──────────────────────────────────────────
    if (!visible) {
        return null;
    }

    // ── Compute 3 display lines ──────────────────────────────────────────────
    let prevLine = "";
    let currLine = "";
    let nextLine = "";

    if (lyricsData?.synced && lyricsData.lines.length > 0 && activeIndex >= 0) {
        prevLine = activeIndex > 0 ? lyricsData.lines[activeIndex - 1].text : "";
        currLine = lyricsData.lines[activeIndex].text;
        nextLine = activeIndex < lyricsData.lines.length - 1
            ? lyricsData.lines[activeIndex + 1].text
            : "";
    }

    const hasLyrics = lyricsData?.synced && lyricsData.lines.length > 0;
    const unavailable = lyricsData && (!lyricsData.synced || lyricsData.lines.length === 0);

    return (
        <div className={`fl-panel ${visible ? "fl-panel--visible" : ""}`} aria-label="Floating lyrics">
            {unavailable ? (
                <div className="fl-unavailable">
                    <i className="fa-regular fa-file-lines"></i>
                    <span>Lyrics unavailable</span>
                </div>
            ) : !hasLyrics ? (
                <div className="fl-loading">
                    <div className="fl-dot-loader">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            ) : (
                <div className="fl-lines">
                    <p className={`fl-line fl-prev ${prevLine ? "" : "fl-line--empty"}`}>
                        {prevLine || "‎"}
                    </p>
                    <p className="fl-line fl-curr">
                        {currLine || "♪"}
                    </p>
                    <p className={`fl-line fl-next ${nextLine ? "" : "fl-line--empty"}`}>
                        {nextLine || "‎"}
                    </p>
                </div>
            )}
        </div>
    );
}

export default FloatingLyrics;
