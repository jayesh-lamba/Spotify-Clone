import "./Download.css";
import { NavLink } from "react-router-dom";

function Download() {
    return (
        <main className="Download-page">

            {/* =================================
                HERO SECTION
            ================================= */}

            <section className="download-hero">

                <div className="download-hero-content">

                    <p className="download-label">
                        ORIVIO
                    </p>

                    <h1>
                        Take your music anywhere.
                    </h1>

                    <p className="download-description">
                        Download Orivio and enjoy your favorite
                        music with a fast, smooth and beautiful
                        listening experience.
                    </p>

                    <NavLink
                        to="/install"
                        className={({ isActive }) =>
                            `download-main-button ${isActive ? "active" : ""}`
                        }
                    >
                        <i className="fa-solid fa-download"></i>
                        Download Orivio
                    </NavLink>

                    <p className="download-note">
                        Free to download • Fast installation • No hassle
                    </p>

                </div>

            </section>


            {/* =================================
                AVAILABLE ON
            ================================= */}

            <section className="available-section">

                <h2>
                    Available on your devices
                </h2>

                <p className="section-description">
                    Listen to your music wherever you go.
                </p>

                <div className="platform-grid">


                    {/* WINDOWS */}

                    <div className="platform-card">

                        <div className="platform-icon">
                            <i className="fa-brands fa-windows"></i>
                        </div>

                        <h3>
                            Windows
                        </h3>

                        <p>
                            Get the full Orivio experience
                            on your Windows PC.
                        </p>

                        <NavLink
                            to="/install"
                            className={({ isActive }) =>
                                `platform-button ${isActive ? "active" : ""}`
                            }
                        >
                            Download for Windows
                        </NavLink>

                    </div>


                    {/* ANDROID */}

                    <div className="platform-card">

                        <div className="platform-icon">
                            <i className="fa-brands fa-android"></i>
                        </div>

                        <h3>
                            Android
                        </h3>

                        <p>
                            Take your music with you
                            wherever you go.
                        </p>

                        <NavLink
                            to="/install"
                            className={({ isActive }) =>
                                `platform-button ${isActive ? "active" : ""}`
                            }
                        >
                            Get it for Android
                        </NavLink>

                    </div>


                    {/* WEB */}

                    <div className="platform-card">

                        <div className="platform-icon">
                            <i className="fa-solid fa-globe"></i>
                        </div>

                        <h3>
                            Web Player
                        </h3>

                        <p>
                            No installation required.
                            Start listening directly in your browser.
                        </p>

                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `platform-button ${isActive ? "active" : ""}`
                            }
                        >
                            Open Web Player
                        </NavLink>

                    </div>

                </div>

            </section>


            {/* =================================
                FEATURES
            ================================= */}

            <section className="download-features">

                <h2>
                    Everything you need
                </h2>

                <div className="features-grid">


                    <div className="download-feature">

                        <div className="feature-icon">
                            <i className="fa-solid fa-cloud-arrow-down"></i>
                        </div>

                        <h3>
                            Listen Offline
                        </h3>

                        <p>
                            Download your favorite music
                            and listen without an internet connection.
                        </p>

                    </div>


                    <div className="download-feature">

                        <div className="feature-icon">
                            <i className="fa-solid fa-bolt"></i>
                        </div>

                        <h3>
                            Fast & Lightweight
                        </h3>

                        <p>
                            Enjoy a smooth music experience
                            without unnecessary clutter.
                        </p>

                    </div>


                    <div className="download-feature">

                        <div className="feature-icon">
                            <i className="fa-solid fa-headphones"></i>
                        </div>

                        <h3>
                            High Quality Audio
                        </h3>

                        <p>
                            Experience your favorite songs
                            with excellent sound quality.
                        </p>

                    </div>


                    <div className="download-feature">

                        <div className="feature-icon">
                            <i className="fa-solid fa-music"></i>
                        </div>

                        <h3>
                            Your Music Everywhere
                        </h3>

                        <p>
                            Keep your playlists and music
                            available across your devices.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================
                BOTTOM CTA
            ================================= */}

            <section className="download-cta">

                <div className="cta-content">

                    <h2>
                        Ready to listen?
                    </h2>

                    <p>
                        Download Orivio and start enjoying
                        your music today.
                    </p>

                    <NavLink
                        to="/install"
                        className={({ isActive }) =>
                            `download-main-button ${isActive ? "active" : ""}`
                        }
                    >
                        <i className="fa-solid fa-download"></i>
                        Download Orivio
                    </NavLink>

                </div>

            </section>

        </main>
    );
}

export default Download;