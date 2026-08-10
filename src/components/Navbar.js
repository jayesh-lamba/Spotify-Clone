import "./Navbar.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import orivio from "./orivio.png";
import { useAuth } from "../context/AuthContext";

function Navbar({ onCommandPalette, onMenuToggle }) {
    const { user, updateUserSettings } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const [isLight, setIsLight] = useState(() => {
        const local = localStorage.getItem("orivio_theme");
        if (local) return local === "Light";
        if (user?.settings?.theme) return user.settings.theme === "Light";
        return document.body.classList.contains("theme-light");
    });

    useEffect(() => {
        const handleSync = (e) => {
            if (e.detail?.theme) {
                setIsLight(e.detail.theme === "Light");
            }
        };
        window.addEventListener("orivio:theme-change", handleSync);
        return () => window.removeEventListener("orivio:theme-change", handleSync);
    }, []);

    const toggleTheme = async () => {
        const nextTheme = isLight ? "Dark" : "Light";
        setIsLight(!isLight);
        localStorage.setItem("orivio_theme", nextTheme);

        if (nextTheme === "Light") {
            document.body.classList.add("theme-light");
        } else {
            document.body.classList.remove("theme-light");
        }

        window.dispatchEvent(new CustomEvent("orivio:theme-change", { detail: { theme: nextTheme } }));

        if (user) {
            try {
                await updateUserSettings({ theme: nextTheme });
            } catch (_) {}
        }
    };

    const handleSearchSubmit = (e) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="Navbar">

            <nav>

                {/* =================================
                    HAMBURGER (mobile only)
                ================================= */}

                <button
                    className="hamburger-btn"
                    onClick={onMenuToggle}
                    aria-label="Toggle navigation menu"
                >
                    <i className="fa-solid fa-bars"></i>
                </button>


                {/* =================================
                    LEFT HALF
                ================================= */}

                <div className="left-half">

                    <div className="logo">
                        <NavLink to="/">
                            <img src={orivio} alt="Orivio" />
                        </NavLink>
                    </div>


                    {/* HOME */}

                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `Home-button ${isActive ? "active" : ""}`
                        }
                    >
                        <i className="fa-solid fa-house"></i>
                    </NavLink>


                    {/* SEARCH */}

                    <NavLink
                        to="/search"
                        className={({ isActive }) =>
                            `Search-bar ${isActive ? "active" : ""}`
                        }
                    >

                        <div className="search-icon">
                            <i className="fa-solid fa-magnifying-glass"></i>
                        </div>

                        <input
                            type="text"
                            className="input-box"
                            placeholder="What do you want to listen"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                        />

                        <div className="browse" onClick={(e) => { e.preventDefault(); if (onCommandPalette) onCommandPalette(); }} title="Command Palette (Ctrl+K)">
                            <i className="fa-solid fa-terminal"></i>
                        </div>

                    </NavLink>

                </div>


                {/* =================================
                    MIDDLE NAVIGATION
                ================================= */}

                <div className="mid-half">

                    <NavLink
                        to="/premium"
                        className={({ isActive }) =>
                            isActive ? "active" : ""
                        }
                    >
                        Premium
                    </NavLink>

                    <NavLink
                        to="/support"
                        className={({ isActive }) =>
                            isActive ? "active" : ""
                        }
                    >
                        Support
                    </NavLink>

                    <NavLink
                        to="/download"
                        className={({ isActive }) =>
                            isActive ? "active" : ""
                        }
                    >
                        Download
                    </NavLink>

                </div>


                {/* =================================
                    RIGHT NAVIGATION
                ================================= */}

                <div className="right-half">

                    {/* Theme Toggle Switch */}
                    <button
                        className={`theme-toggle-btn ${isLight ? "light" : "dark"}`}
                        onClick={toggleTheme}
                        title={`Switch to ${isLight ? "Dark" : "Light"} Mode`}
                        aria-label="Toggle Theme"
                    >
                        <span className="theme-icon">{isLight ? "☀️" : "🌙"}</span>
                    </button>

                    <NavLink
                        to="/install"
                        className={({ isActive }) =>
                            `Install ${isActive ? "active" : ""}`
                        }
                    >
                        <i className="fa-solid fa-download"></i>
                        Install App
                    </NavLink>

                    {user ? (
                        <>
                            <NavLink
                                to="/settings"
                                className={({ isActive }) =>
                                    `sign-up ${isActive ? "active" : ""}`
                                }
                            >
                                <i className="fa-solid fa-user" style={{ marginRight: "6px" }}></i>
                                {user.username}
                            </NavLink>

                            <NavLink
                                to="/logout"
                                className={({ isActive }) =>
                                    `login-button ${isActive ? "active" : ""}`
                                }
                            >
                                Log out
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink
                                to="/signup"
                                className={({ isActive }) =>
                                    `sign-up ${isActive ? "active" : ""}`
                                }
                            >
                                Sign Up
                            </NavLink>

                            <NavLink
                                to="/login"
                                className={({ isActive }) =>
                                    `login-button ${isActive ? "active" : ""}`
                                }
                            >
                                Log in
                            </NavLink>
                        </>
                    )}

                </div>

            </nav>

        </div>
    );
}

export default Navbar;
