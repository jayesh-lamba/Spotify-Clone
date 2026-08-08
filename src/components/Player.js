import "./Player.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import albumImage from "./new.png";

function Player() {
    return (
        <div className="Player">

            <div className="left-player">
                <img
                  src="https://4kwallpapers.com/images/walls/thumbs_3t/22577.png"
                  
                  className="album-image"
    />
                <div className="song-info">
                    <p className="song-name">Anime Night</p>
                    <p className="artist-name">Iss Duniya Ka Papa</p>
                </div>
            </div>

            <div className="center-player">

                <div className="player-controls">
                    <div className="previous">
                        <i className="fa-solid fa-backward-step"></i>
                    </div>

                    <div className="play-pause">
                        <i className="fa-solid fa-play"></i>
                    </div>

                    <div className="next">
                        <i className="fa-solid fa-forward-step"></i>
                    </div>
                </div>

                <div className="progress-container">
                    <span>0:00</span>
                    <div className="progress-bar">
                        <div className="progress"></div>
                    </div>
                    <span>3:45</span>
                </div>

            </div>

            <div className="right-player">

                <div className="queue">
                    <i className="fa-solid fa-list"></i>
                </div>

                <div className="volume-icon">
                    <i className="fa-solid fa-volume-high"></i>
                </div>

                <div className="volume-slider">
                    <div className="volume"></div>
                </div>

            </div>

        </div>
    );
}

export default Player;