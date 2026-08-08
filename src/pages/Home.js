import "./Home.css";

function Home() {
    return (
        <main className="Home">

            {/* Quick Picks */}
            <section className="quick-picks">
                <h2>Quick Picks</h2>

                <div className="song-grid">

                    <div className="song-card">
                        <div className="song-image">
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg" alt="Song" />
                        </div>
                        <p>Anime Night</p>
                        <span>Iss Duniya Ka Papa</span>
                    </div>

                    <div className="song-card">
                        <div className="song-image">
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/26035.jpg" alt="Song" />
                        </div>
                        <p>Blinding Lights</p>
                        <span>The Weeknd</span>
                    </div>

                    <div className="song-card">
                        <div className="song-image">
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/7769.jpg" alt="Song" />
                        </div>
                        <p>Starboy</p>
                        <span>The Weeknd</span>
                    </div>

                    <div className="song-card">
                        <div className="song-image">
                            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/10635.jpg" alt="Song" />
                        </div>
                        <p>Night Changes</p>
                        <span>One Direction</span>
                    </div>

                </div>
            </section>


            {/* Recently Played */}
            <section className="recently-played">
                <h2>Recently Played</h2>

                <div className="album-grid">

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/11990.jpeg" alt="Album" />
                        <h3>After Hours</h3>
                        <p>The Weeknd</p>
                    </div>

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/8652.jpg" alt="Album" />
                        <h3>Midnight Memories</h3>
                        <p>One Direction</p>
                    </div>

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/11231.jpeg" alt="Album" />
                        <h3>Starboy</h3>
                        <p>The Weeknd</p>
                    </div>

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/16938.jpg" alt="Album" />
                        <h3>Divide</h3>
                        <p>Ed Sheeran</p>
                    </div>

                </div>
            </section>


            {/* Popular Albums */}
            <section className="popular-albums">
                <h2>Popular Albums</h2>

                <div className="album-grid">

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/17045.jpg" alt="Album" />
                        <h3>Hollywood's Bleeding</h3>
                        <p>Post Malone</p>
                    </div>

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/25777.jpg" alt="Album" />
                        <h3>Happier Than Ever</h3>
                        <p>Billie Eilish</p>
                    </div>

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/7749.jpg" alt="Album" />
                        <h3>Un Verano Sin Ti</h3>
                        <p>Bad Bunny</p>
                    </div>

                    <div className="album-card">
                        <img src="https://4kwallpapers.com/images/walls/thumbs_3t/13626.jpg" alt="Album" />
                        <h3>Justice</h3>
                        <p>Justin Bieber</p>
                    </div>

                </div>
            </section>


            {/* Trending Songs */}
            <section className="trending-songs">
                <h2>Trending Songs</h2>

                <div className="song-list">

                    <div className="trending-song">
                        <span>01</span>
                        <p>Blinding Lights</p>
                        <p>The Weeknd</p>
                    </div>

                    <div className="trending-song">
                        <span>02</span>
                        <p>Starboy</p>
                        <p>The Weeknd</p>
                    </div>

                    <div className="trending-song">
                        <span>03</span>
                        <p>Perfect</p>
                        <p>Ed Sheeran</p>
                    </div>

                    <div className="trending-song">
                        <span>04</span>
                        <p>Night Changes</p>
                        <p>One Direction</p>
                    </div>

                </div>
            </section>

        </main>
    );
}

export default Home;