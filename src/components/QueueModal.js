import React, { useRef, useEffect, useState } from "react";
import "./QueueModal.css";
import { usePlayer } from "../context/PlayerContext";

function QueueModal({ isOpen, onClose }) {
  const {
    queue,
    queueIndex,
    currentSong,
    playQueueItem,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  } = usePlayer();

  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const modalRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  const handleDragStart = (e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggingIndex !== null && draggingIndex !== index) {
      reorderQueue(draggingIndex, index);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const coverFallback = "https://4kwallpapers.com/images/walls/thumbs_3t/22577.png";

  if (!isOpen) return null;

  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <div className="queue-modal-overlay" aria-modal="true" role="dialog">
      <div className="queue-modal" ref={modalRef}>
        <div className="queue-modal-header">
          <h2 className="queue-modal-title">
            <i className="fa-solid fa-list" />
            Queue
          </h2>
          <div className="queue-header-actions">
            {queue.length > 0 && (
              <button className="queue-clear-btn" onClick={clearQueue} title="Clear queue">
                <i className="fa-solid fa-trash" />
                Clear
              </button>
            )}
            <button className="queue-close-btn" onClick={onClose} aria-label="Close queue">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        {/* Now Playing */}
        {currentSong?.audioUrl && (
          <div className="queue-section">
            <h3 className="queue-section-title">Now Playing</h3>
            <div className="queue-item queue-item-current">
              <div className="queue-item-num playing-indicator">
                <i className="fa-solid fa-volume-high" style={{ color: "var(--accent-orange)", fontSize: "12px" }} />
              </div>
              <img
                src={currentSong.coverImage || coverFallback}
                alt={currentSong.title}
                className="queue-item-cover"
                onError={(e) => { e.target.src = coverFallback; }}
              />
              <div className="queue-item-info">
                <span className="queue-item-title" style={{ color: "var(--accent-orange)" }}>
                  {currentSong.title}
                </span>
                <span className="queue-item-artist">{currentSong.artistName}</span>
              </div>
              <span className="queue-item-duration">{currentSong.duration || "--"}</span>
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="queue-section">
          <h3 className="queue-section-title">
            Next Up
            <span className="queue-count">{upcomingQueue.length} songs</span>
          </h3>

          {upcomingQueue.length === 0 ? (
            <div className="queue-empty">
              <i className="fa-solid fa-music" />
              <p>Your queue is empty</p>
              <p className="queue-empty-sub">Add songs to queue from any song menu</p>
            </div>
          ) : (
            <div className="queue-list">
              {upcomingQueue.map((song, localIdx) => {
                const actualIndex = queueIndex + 1 + localIdx;
                const isDragging = draggingIndex === actualIndex;
                const isDragOver = dragOverIndex === actualIndex;

                return (
                  <div
                    key={`${song._id || song.id}-${actualIndex}`}
                    className={`queue-item ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, actualIndex)}
                    onDragOver={(e) => handleDragOver(e, actualIndex)}
                    onDrop={(e) => handleDrop(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="queue-drag-handle" title="Drag to reorder">
                      <i className="fa-solid fa-grip-vertical" />
                    </div>
                    <div className="queue-item-num">{localIdx + 1}</div>
                    <img
                      src={song.coverImage || coverFallback}
                      alt={song.title}
                      className="queue-item-cover"
                      onClick={() => playQueueItem(actualIndex)}
                      style={{ cursor: "pointer" }}
                      onError={(e) => { e.target.src = coverFallback; }}
                    />
                    <div className="queue-item-info" onClick={() => playQueueItem(actualIndex)} style={{ cursor: "pointer" }}>
                      <span className="queue-item-title">{song.title}</span>
                      <span className="queue-item-artist">{song.artistName}</span>
                    </div>
                    <span className="queue-item-duration">{song.duration || "--"}</span>
                    <button
                      className="queue-remove-btn"
                      onClick={() => removeFromQueue(actualIndex)}
                      title="Remove from queue"
                      aria-label={`Remove ${song.title} from queue`}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueueModal;
