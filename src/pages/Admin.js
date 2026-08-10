import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color + "22", color }}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value ?? "--"}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAnalytics();
      setAnalytics(res.data || res);
    } catch (err) {
      if (err.message?.includes("403") || err.message?.toLowerCase().includes("admin")) {
        addToast("Admin access required", "error");
        navigate("/");
      } else {
        addToast(err.message || "Failed to load analytics", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await api.scanMusicLibrary();
      addToast(res.message || "Music library scan completed!", "success");
      await fetchAnalytics();
    } catch (err) {
      addToast(err.message || "Scan failed", "error");
    } finally {
      setScanning(false);
    }
  };

  if (loading) return (
    <div className="admin-page admin-loading">
      <div className="admin-spinner" />
      <p>Loading admin dashboard...</p>
    </div>
  );

  const a = analytics || {};

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-title">
            <i className="fa-solid fa-shield-halved" />
            Admin Dashboard
          </h1>
          <p className="admin-subtitle">System analytics and management</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-scan-btn"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning
              ? <><i className="fa-solid fa-spinner fa-spin" /> Scanning...</>
              : <><i className="fa-solid fa-compact-disc" /> Scan Music Library</>
            }
          </button>
          <button className="admin-refresh-btn" onClick={fetchAnalytics} title="Refresh">
            <i className="fa-solid fa-rotate-right" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="admin-stats-grid">
        <StatCard icon="fa-users"         label="Total Users"    value={a.totalUsers}    color="#60a5fa" sub={`${a.activeUsers || 0} active`} />
        <StatCard icon="fa-music"         label="Total Songs"    value={a.totalSongs}    color="var(--accent-orange)" sub={`${a.totalPlays || 0} plays`} />
        <StatCard icon="fa-record-vinyl"  label="Total Albums"   value={a.totalAlbums}   color="#a78bfa" />
        <StatCard icon="fa-microphone"    label="Total Artists"  value={a.totalArtists}  color="#34d399" />
        <StatCard icon="fa-list"          label="Total Playlists" value={a.totalPlaylists} color="#f87171" />
        <StatCard icon="fa-heart"         label="Total Likes"    value={a.totalLikes}    color="#fb7185" />
      </div>

      {/* Top songs table */}
      {a.topSongs?.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">
            <i className="fa-solid fa-fire" />
            Top Played Songs
          </h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>#</span>
              <span>Song</span>
              <span>Artist</span>
              <span>Plays</span>
            </div>
            {a.topSongs.map((song, idx) => (
              <div key={song._id || song.id} className="admin-table-row">
                <span className="admin-rank">{idx + 1}</span>
                <span className="admin-song-name">{song.title}</span>
                <span className="admin-song-artist">{song.artistName || "Unknown"}</span>
                <span className="admin-plays">
                  <i className="fa-solid fa-headphones" />
                  {(song.playCount || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent users */}
      {a.recentUsers?.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">
            <i className="fa-solid fa-user-clock" />
            Recent Registrations
          </h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Username</span>
              <span>Email</span>
              <span>Joined</span>
              <span>Role</span>
            </div>
            {a.recentUsers.map((u) => (
              <div key={u._id} className="admin-table-row">
                <span className="admin-username">{u.username}</span>
                <span className="admin-email">{u.email}</span>
                <span className="admin-date">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
                <span className={`admin-role-badge ${u.role === "admin" ? "admin-role" : ""}`}>
                  {u.role || "user"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System info */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <i className="fa-solid fa-server" />
          System Info
        </h2>
        <div className="admin-info-grid">
          <div className="admin-info-card">
            <span className="admin-info-label">Node.js Version</span>
            <span className="admin-info-value">{a.nodeVersion || process.version || "--"}</span>
          </div>
          <div className="admin-info-card">
            <span className="admin-info-label">Environment</span>
            <span className="admin-info-value">{a.environment || "development"}</span>
          </div>
          <div className="admin-info-card">
            <span className="admin-info-label">Last Updated</span>
            <span className="admin-info-value">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="admin-info-card">
            <span className="admin-info-label">Database</span>
            <span className="admin-info-value" style={{ color: "var(--accent-orange)" }}>
              <i className="fa-solid fa-circle" style={{ fontSize: "8px", marginRight: "6px" }} />
              {a.dbStatus || "Connected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
