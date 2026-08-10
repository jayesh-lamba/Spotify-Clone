import "./LikeButton.css";
import { useAuth } from "../context/AuthContext";
import { useLikedSongs } from "../context/LikedSongsContext";

/**
 * LikeButton
 * Props:
 *   song  {object}  — must have _id or id
 *   size  {string}  — "sm" | "md" (default "md")
 */
function LikeButton({ song, size = "md" }) {
    const { isAuthenticated } = useAuth();
    const { isLiked, toggleLike } = useLikedSongs();

    if (!isAuthenticated || !song) return null;

    const songId = song._id || song.id;
    if (!songId || String(songId).length !== 24) return null;

    const liked = isLiked(String(songId));

    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleLike(song);
    };

    return (
        <button
            className={`like-btn like-btn--${size} ${liked ? "like-btn--liked" : ""}`}
            onClick={handleClick}
            title={liked ? "Unlike" : "Like"}
            aria-label={liked ? `Unlike ${song.title}` : `Like ${song.title}`}
            id={`like-btn-${songId}`}
        >
            <i className={liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
        </button>
    );
}

export default LikeButton;
