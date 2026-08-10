import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const LikedSongsContext = createContext(null);

/**
 * LikedSongsProvider
 * Provides a shared liked-songs Set across all pages.
 * Exposes: likedIds (Set), isLiked(id), toggleLike(song), reloadLikedIds()
 */
export function LikedSongsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [likedIds, setLikedIds] = useState(new Set());
  const loadedRef = useRef(false);

  const reloadLikedIds = useCallback(async () => {
    if (!isAuthenticated) {
      setLikedIds(new Set());
      return;
    }
    try {
      const res = await api.getLikedSongs();
      if (res?.data) {
        const ids = new Set(res.data.map((s) => String(s._id || s.id)));
        setLikedIds(ids);
      }
    } catch (_) {}
  }, [isAuthenticated]);

  // Load on mount and when auth changes
  useEffect(() => {
    loadedRef.current = false;
    reloadLikedIds().then(() => { loadedRef.current = true; });
  }, [reloadLikedIds]);

  const isLiked = useCallback((songId) => {
    if (!songId) return false;
    return likedIds.has(String(songId));
  }, [likedIds]);

  /**
   * toggleLike — optimistically updates local state, calls backend
   * @param {object} song — the full song object (must have _id or id)
   */
  const toggleLike = useCallback(async (song) => {
    if (!isAuthenticated || !song) return;
    const songId = String(song._id || song.id);
    if (!songId || songId.length !== 24) return;

    const wasLiked = likedIds.has(songId);

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });

    try {
      if (wasLiked) {
        await api.unlikeSong(songId);
      } else {
        await api.likeSong(songId);
      }
    } catch (err) {
      // Roll back optimistic update on error
      console.warn("Like toggle failed, rolling back:", err.message);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) {
          next.add(songId);
        } else {
          next.delete(songId);
        }
        return next;
      });
    }
  }, [isAuthenticated, likedIds]);

  return (
    <LikedSongsContext.Provider value={{ likedIds, isLiked, toggleLike, reloadLikedIds }}>
      {children}
    </LikedSongsContext.Provider>
  );
}

export function useLikedSongs() {
  const ctx = useContext(LikedSongsContext);
  if (!ctx) throw new Error("useLikedSongs must be used within LikedSongsProvider");
  return ctx;
}
