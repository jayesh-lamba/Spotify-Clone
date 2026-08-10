/**
 * ORIVIO Frontend — Centralized API Service
 */

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

/**
 * Helper to make HTTP requests with automatic Authorization header
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const headers = { ...options.headers };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      if (response.status === 401 && token) {
        if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/signup")) {
          localStorage.removeItem("token");
        }
      }
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${options.method || "GET"} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // ── Auth ──
  signup: (username, email, password) =>
    request("/auth/signup", { method: "POST", body: { username, email, password } }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  getMe: () => request("/auth/me"),

  logout: () => request("/auth/logout", { method: "POST" }),

  // ── Songs ──
  getSongs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/songs${query ? `?${query}` : ""}`);
  },

  searchSongs: (q, params = {}) => {
    const query = new URLSearchParams({ q, ...params }).toString();
    return request(`/songs/search?${query}`);
  },

  getTrendingSongs: (limit = 10) =>
    request(`/songs/trending?limit=${limit}`),

  getSongById: (id) => request(`/songs/${id}`),

  trackPlay: (id) => request(`/songs/${id}/play`, { method: "POST" }),

  getLyrics: (id) => request(`/songs/${id}/lyrics`),

  // ── Artists ──
  getArtists: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/artists${query ? `?${query}` : ""}`);
  },

  searchArtists: (q) => request(`/artists/search?q=${encodeURIComponent(q)}`),

  getArtistById: (id) => request(`/artists/${id}`),

  getArtistSongs: (id) => request(`/artists/${id}/songs`),

  // ── Albums ──
  getAlbums: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/albums${query ? `?${query}` : ""}`);
  },

  searchAlbums: (q) => request(`/albums/search?q=${encodeURIComponent(q)}`),

  getAlbumById: (id) => request(`/albums/${id}`),

  // ── Playlists ──
  getMyPlaylists: () => request("/playlists"),

  getPlaylistById: (id) => request(`/playlists/${id}`),

  createPlaylist: (data) => request("/playlists", { method: "POST", body: data }),

  updatePlaylist: (id, data) => request(`/playlists/${id}`, { method: "PUT", body: data }),

  deletePlaylist: (id) => request(`/playlists/${id}`, { method: "DELETE" }),

  addSongToPlaylist: (playlistId, songId) =>
    request(`/playlists/${playlistId}/songs`, { method: "POST", body: { songId } }),

  removeSongFromPlaylist: (playlistId, songId) =>
    request(`/playlists/${playlistId}/songs/${songId}`, { method: "DELETE" }),

  reorderPlaylistSongs: (playlistId, songIds) =>
    request(`/playlists/${playlistId}/songs/reorder`, { method: "PUT", body: { songs: songIds } }),

  // ── Liked Songs ──
  getLikedSongs: () => request("/me/liked-songs"),

  likeSong: (songId) => request(`/me/liked-songs/${songId}`, { method: "POST" }),

  unlikeSong: (songId) => request(`/me/liked-songs/${songId}`, { method: "DELETE" }),

  getLikeStatus: (songId) => request(`/me/liked-songs/${songId}/status`),

  // ── Recently Played ──
  getRecentlyPlayed: () => request("/me/recently-played"),

  recordRecentlyPlayed: (songId) =>
    request("/me/recently-played", { method: "POST", body: { songId } }),

  clearRecentlyPlayed: () => request("/me/recently-played", { method: "DELETE" }),

  // ── User ──
  getProfile: () => request("/me/profile"),

  updateProfile: (data) => request("/me/profile", { method: "PUT", body: data }),

  updateSettings: (data) => request("/me/settings", { method: "PUT", body: data }),

  changePassword: (data) => request("/me/change-password", { method: "PUT", body: data }),

  deleteAccount: (password) => request("/me", { method: "DELETE", body: { password } }),

  // ── Search ──
  globalSearch: (q, type = "all", limit = 30) =>
    request(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),

  getSearchHistory: () => request("/search/history"),

  clearSearchHistory: () => request("/search/history", { method: "DELETE" }),

  deleteSearchHistoryEntry: (id) => request(`/search/history/${id}`, { method: "DELETE" }),

  // ── Recommendations ──
  getRecommendations: (limit = 12) => request(`/songs/recommendations?limit=${limit}`),

  // ── Pinned Playlists ──
  togglePinPlaylist: (playlistId) =>
    request(`/playlists/${playlistId}/pin`, { method: "PUT" }),

  // ── Admin & Music Manager ──
  getAdminAnalytics: () => request("/admin/analytics"),

  getMusicManagerSongs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/music-manager/songs${query ? `?${query}` : ""}`);
  },

  scanMusicLibrary: (data = {}) => request("/admin/scan-music", { method: "POST", body: data }),

  uploadSongFile: (formData) => request("/admin/upload-song", { method: "POST", body: formData }),

  uploadDirectoryStructure: (formData) => request("/admin/upload-directory", { method: "POST", body: formData }),

  updateSongMetadata: (id, data) => request(`/admin/songs/${id}/metadata`, { method: "PUT", body: data }),

  updateSongArtwork: (id, formData) => request(`/admin/songs/${id}/artwork`, { method: "POST", body: formData }),

  updateSongLyrics: (id, data) => request(`/admin/songs/${id}/lyrics`, { method: "PUT", body: data }),

  toggleWatchService: (enable) => request("/admin/watch", { method: "POST", body: { enable } }),

  cleanMissingSongs: () => request("/admin/clean-missing", { method: "POST" }),
};

export default api;
