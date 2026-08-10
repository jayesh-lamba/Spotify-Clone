import "./Sidebar.css";
import { Home, Search, Library } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar({ isOpen, onClose }) {
    const { user } = useAuth();

    return (
        <>
            {/* Backdrop overlay — only visible on mobile when drawer is open */}
            <div
                className={`sidebar-overlay ${isOpen ? "sidebar-overlay--visible" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <div className={`Sidebar ${isOpen ? "sidebar-open" : ""}`}>
                <div className="hed"><h1> ORIVIO</h1></div>

                <NavLink to="/">
                    <Home />
                    Home
                </NavLink>
                <NavLink to="/search">
                    <Search />
                    Search
                </NavLink>
                <NavLink
                    to="/library"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    <Library />
                    Your Library
                </NavLink>
                <NavLink
                    to="/music-manager"
                    className={({ isActive }) => isActive ? "active" : ""}
                >
                    <i className="fa-solid fa-sliders" style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}></i>
                    Music Manager
                </NavLink>
                <div className="Playlists">
                    <h3>Playlists</h3>
                    <Link to="/create-playlist">
                        Create Playlist
                    </Link>
                    <Link to="/liked-songs">
                        Liked Songs
                    </Link>
                </div>
                <div className="Bottom">
                    <h3>Sign in &amp; Settings</h3>
                    {user ? (
                        <Link to="/logout">
                            <i className="fa-solid fa-right-from-bracket"></i>
                            Log out ({user.username})
                        </Link>
                    ) : (
                        <Link to="/login">
                            <i className="fa-solid fa-right-to-bracket"></i>
                            Log in
                        </Link>
                    )}
                    <Link to="/settings">
                        <i className="fa-solid fa-screwdriver-wrench"></i>
                        Settings
                    </Link>
                </div>

            </div>
        </>
    );

}

export default Sidebar;
