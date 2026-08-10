import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import Navbar from "./components/Navbar";
import FloatingLyrics from "./components/FloatingLyrics";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import CommandPalette from "./components/CommandPalette";
import Home from "./pages/Home";
import Library from "./pages/Library";
import InstallApp from "./pages/InstallApp";
import Signup from "./pages/Signup";
import Download from "./pages/Download";
import Premium from "./pages/Premium";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Support from "./pages/Support";
import CreatePlaylist from "./pages/CreatePlaylist";
import LikedSongs from "./pages/LikedSongs";
import Settings from "./pages/Settings";
import Search from "./pages/Search";
import Album from "./pages/Album";
import Artist from "./pages/Artist";
import Admin from "./pages/Admin";
import MusicManager from "./pages/MusicManager";
import PlaylistPage from "./pages/PlaylistPage";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import "./App.css";

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [localTheme, setLocalTheme] = useState(() => localStorage.getItem("orivio_theme") || null);

  const theme = localTheme || user?.settings?.theme || "Dark";
  const animations = user?.settings?.animations !== false; // default true

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile drawer)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail?.theme) {
        setLocalTheme(e.detail.theme);
      }
    };
    window.addEventListener("orivio:theme-change", handleThemeChange);
    return () => window.removeEventListener("orivio:theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    const isLight =
      theme === "Light" ||
      (theme === "System Default" && window.matchMedia("(prefers-color-scheme: light)").matches);

    if (isLight) {
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
    }

    if (!animations) {
      document.body.classList.add("no-animations");
    } else {
      document.body.classList.remove("no-animations");
    }
  }, [theme, animations]);

  // Ctrl+K / Cmd+K → open command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="wrp">
      {/* Global keyboard shortcuts (Space, arrows, M, S, R, L) */}
      <KeyboardShortcuts />

      {/* Command palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <Navbar
        onCommandPalette={() => setCommandPaletteOpen(true)}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/support" element={<Support />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/install" element={<InstallApp />} />
        <Route path="/download" element={<Download />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/search" element={<Search />} />
        <Route path="/liked-songs" element={<LikedSongs />} />
        <Route path="/library" element={<Library />} />
        <Route path="/create-playlist" element={<CreatePlaylist />} />
        {/* New routes */}
        <Route path="/album/:id" element={<Album />} />
        <Route path="/artist/:id" element={<Artist />} />
        <Route path="/playlist/:id" element={<PlaylistPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/music-manager" element={<MusicManager />} />
      </Routes>

      {/* Always-visible floating lyrics panel */}
      <FloatingLyrics />

      <Player />
    </div>
  );
}

export default App;
