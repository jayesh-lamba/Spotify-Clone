import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./CommandPalette.css";
import { usePlayer } from "../context/PlayerContext";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

const PAGES = [
  { label: "Home", path: "/", icon: "fa-house" },
  { label: "Search", path: "/search", icon: "fa-magnifying-glass" },
  { label: "Library", path: "/library", icon: "fa-book" },
  { label: "Liked Songs", path: "/liked-songs", icon: "fa-heart" },
  { label: "Settings", path: "/settings", icon: "fa-gear" },
  { label: "Create Playlist", path: "/create-playlist", icon: "fa-plus" },
  { label: "Premium", path: "/premium", icon: "fa-star" },
  { label: "Support", path: "/support", icon: "fa-circle-question" },
  { label: "Download", path: "/download", icon: "fa-download" },
];

function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const { addToast } = useToast();

  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSongs([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSongs([]); return; }
    setLoading(true);
    try {
      const res = await api.globalSearch(q, "songs", 8);
      setSongs(res?.data?.songs || []);
    } catch {
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const filteredPages = PAGES.filter((p) =>
    !query.trim() || p.label.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [
    ...filteredPages.map((p) => ({ type: "page", ...p })),
    ...songs.map((s) => ({ type: "song", ...s })),
  ];

  const handleSelect = (item) => {
    if (item.type === "page") {
      navigate(item.path);
      onClose();
    } else if (item.type === "song") {
      playSong(item, songs);
      addToast(`Now playing: ${item.title}`, "success");
      onClose();
    }
  };

  // Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => Math.min(p + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[activeIndex]) handleSelect(allItems[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.querySelector(`[data-idx="${activeIndex}"]`);
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  const coverFallback = "https://4kwallpapers.com/images/walls/thumbs_3t/22577.png";

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="cp-search-bar">
          <i className="fa-solid fa-magnifying-glass cp-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cp-input"
            placeholder="Search songs, navigate pages..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {loading && <i className="fa-solid fa-spinner fa-spin cp-loading" />}
          <kbd className="cp-esc">esc</kbd>
        </div>

        <div className="cp-results" ref={listRef}>
          {/* Pages section */}
          {filteredPages.length > 0 && (
            <div className="cp-section">
              <div className="cp-section-label">Pages</div>
              {filteredPages.map((page, i) => (
                <div
                  key={page.path}
                  data-idx={i}
                  className={`cp-item ${activeIndex === i ? "cp-item-active" : ""}`}
                  onClick={() => handleSelect({ type: "page", ...page })}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <div className="cp-item-icon page-icon">
                    <i className={`fa-solid ${page.icon}`} />
                  </div>
                  <span className="cp-item-label">{page.label}</span>
                  <span className="cp-item-type">Page</span>
                </div>
              ))}
            </div>
          )}

          {/* Songs section */}
          {songs.length > 0 && (
            <div className="cp-section">
              <div className="cp-section-label">Songs</div>
              {songs.map((song, i) => {
                const globalIdx = filteredPages.length + i;
                return (
                  <div
                    key={song._id || song.id}
                    data-idx={globalIdx}
                    className={`cp-item ${activeIndex === globalIdx ? "cp-item-active" : ""}`}
                    onClick={() => handleSelect({ type: "song", ...song })}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <img
                      src={song.coverImage || coverFallback}
                      alt={song.title}
                      className="cp-song-cover"
                      onError={(e) => { e.target.src = coverFallback; }}
                    />
                    <div className="cp-item-info">
                      <span className="cp-item-label">{song.title}</span>
                      <span className="cp-item-sub">{song.artistName}</span>
                    </div>
                    <span className="cp-item-type">Song</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && query.trim() && allItems.length === 0 && (
            <div className="cp-empty">
              <i className="fa-solid fa-face-frown-open" />
              <p>No results for "{query}"</p>
            </div>
          )}

          {!query.trim() && allItems.length === 0 && (
            <div className="cp-hint">
              <p>Start typing to search songs or navigate pages</p>
              <div className="cp-shortcuts-hint">
                <span><kbd>↑ ↓</kbd> Navigate</span>
                <span><kbd>Enter</kbd> Select</span>
                <span><kbd>Esc</kbd> Close</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
