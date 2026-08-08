import "./Navbar.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import orivio from "./orivio.png";
function Navbar(){
    return(
   <div className="Navbar">
    <nav>
        <div className="left-half">
            <div className="logo"> <img src={orivio} alt="Orivio" /></div>
            <div className="Home-button"><i className="fa-regular fa-house"></i></div>
            <div className="Search-bar">
                <div className="search-icon"><i className="fa-solid fa-magnifying-glass"></i></div>
                <input type="text" className="input-box" placeholder="What do you want to listen"/>
                <div className="browse"><i className="fa-duotone fa-solid fa-folders"></i></div>
            </div>
        </div>
        <div className="mid-half">
            <p>Premium</p>
            <p>Support</p>
            <p>Download</p>
        </div>
        <div className="right-half">
            <div className="Install">Install App</div>
            <div className="sign-up">Sign Up</div>
            <button className="login-button">Log in</button>

        </div>
    </nav>

   </div>
    );

}

export default Navbar;