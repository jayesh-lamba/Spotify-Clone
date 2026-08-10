import { useEffect } from "react";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";

/**
 * Global keyboard shortcuts:
 *   Space        — Play / Pause
 *   ArrowRight   — Next track
 *   ArrowLeft    — Previous track
 *   M            — Mute/Unmute
 *   L            — Like current song (triggers custom event)
 *   S            — Toggle Shuffle
 *   R            — Cycle Repeat mode
 *
 * Shortcuts are disabled when the user is typing in an input, textarea, or
 * contenteditable element to prevent accidental interference.
 */
function KeyboardShortcuts() {
  const { togglePlayPause, playNext, playPrevious, toggleMute, toggleShuffle, toggleRepeat } = usePlayer();
  const { user } = useAuth();

  useEffect(() => {
    const isTyping = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        active.isContentEditable
      );
    };

    const handleKeyDown = (e) => {
      // Don't activate shortcuts while command palette is open (it has its own input)
      if (document.querySelector(".command-palette-overlay")) return;

      if (isTyping()) return;

      // Ctrl+K / Cmd+K — open command palette (handled by CommandPalette itself)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          playNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          playPrevious();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "s":
        case "S":
          e.preventDefault();
          toggleShuffle();
          break;
        case "r":
        case "R":
          e.preventDefault();
          toggleRepeat();
          break;
        case "l":
        case "L":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            // Dispatch custom event — LikeButton listens on document
            document.dispatchEvent(new CustomEvent("orivio:like-current-song"));
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, playNext, playPrevious, toggleMute, toggleShuffle, toggleRepeat, user]);

  return null; // Purely behavioral — no visual output
}

export default KeyboardShortcuts;
