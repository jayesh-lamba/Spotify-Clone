import "./InstallApp.css";

function InstallApp() {
    return (
        <main className="InstallApp-page">

            {/* =================================
                HERO
            ================================= */}

            <section className="install-hero">

                <div className="install-hero-content">

                    <p className="install-label">
                        ORIVIO APP
                    </p>

                    <h1>
                        Your music. Your way.
                    </h1>

                    <p className="install-description">
                        Install Orivio on your device and enjoy
                        a faster, smoother music experience.
                    </p>

                    <button className="install-main-button">
                        <i className="fa-solid fa-download"></i>
                        Install Now
                    </button>

                </div>

            </section>


            {/* =================================
                CHOOSE DEVICE
            ================================= */}

            <section className="device-section">

                <h2>
                    Choose your device
                </h2>

                <p className="section-description">
                    Get the Orivio app for your favorite device.
                </p>


                <div className="device-grid">


                    {/* WINDOWS */}

                    <div className="device-card">

                        <div className="device-icon">
                            <i className="fa-brands fa-windows"></i>
                        </div>

                        <h3>
                            Windows
                        </h3>

                        <p>
                            Enjoy Orivio on your Windows PC
                            with a fast desktop experience.
                        </p>

                        <button className="device-button">
                            Install for Windows
                        </button>

                    </div>


                    {/* ANDROID */}

                    <div className="device-card">

                        <div className="device-icon">
                            <i className="fa-brands fa-android"></i>
                        </div>

                        <h3>
                            Android
                        </h3>

                        <p>
                            Take your music with you
                            wherever you go.
                        </p>

                        <button className="device-button">
                            Install for Android
                        </button>

                    </div>


                    {/* WEB */}

                    <div className="device-card">

                        <div className="device-icon">
                            <i className="fa-solid fa-globe"></i>
                        </div>

                        <h3>
                            Web Player
                        </h3>

                        <p>
                            No installation required.
                            Listen directly from your browser.
                        </p>

                        <button className="device-button">
                            Open Web Player
                        </button>

                    </div>

                </div>

            </section>


            {/* =================================
                WHY INSTALL
            ================================= */}

            <section className="why-install">

                <h2>
                    Why install Orivio?
                </h2>

                <div className="install-benefits">


                    <div className="install-benefit">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-bolt"></i>
                        </div>

                        <h3>
                            Faster Experience
                        </h3>

                        <p>
                            Enjoy a smooth and responsive
                            music experience.
                        </p>

                    </div>


                    <div className="install-benefit">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-play"></i>
                        </div>

                        <h3>
                            Background Playback
                        </h3>

                        <p>
                            Keep your music playing while
                            using other apps.
                        </p>

                    </div>


                    <div className="install-benefit">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-cloud-arrow-down"></i>
                        </div>

                        <h3>
                            Offline Listening
                        </h3>

                        <p>
                            Download music and listen
                            without an internet connection.
                        </p>

                    </div>


                    <div className="install-benefit">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-music"></i>
                        </div>

                        <h3>
                            Your Library Everywhere
                        </h3>

                        <p>
                            Access your playlists and
                            favorite music across devices.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================
                INSTALLATION HELP
            ================================= */}

            <section className="install-help">

                <h2>
                    Installation Help
                </h2>


                <div className="install-question">

                    <span>
                        How do I install Orivio?
                    </span>

                    <i className="fa-solid fa-plus"></i>

                </div>


                <div className="install-question">

                    <span>
                        Is Orivio free?
                    </span>

                    <i className="fa-solid fa-plus"></i>

                </div>


                <div className="install-question">

                    <span>
                        What devices are supported?
                    </span>

                    <i className="fa-solid fa-plus"></i>

                </div>


                <div className="install-question">

                    <span>
                        Can I use Orivio without installing it?
                    </span>

                    <i className="fa-solid fa-plus"></i>

                </div>

            </section>

        </main>
    );
}

export default InstallApp;