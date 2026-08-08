import "./Sidebar.css";
import { Home, Search, Library } from "lucide-react";
function Sidebar(){
    return(
    <div className="Sidebar">
        <div className="hed"><h1> ORIVIO</h1></div>
        
        <a href="#"> <Home/>  Home</a>
        <a href="#"><Search></Search>  Search</a>
        <a href="#"><Library></Library>  Your Library</a>
        <div className="Playlists">
        <h3>Playlists</h3>
        <a href="#">  Create Playlist</a>
        <a href="#">  Liked Songs</a>
        </div>
        <div className="Bottom">
        <h3>Sign in & Settings</h3>
        <a href="#"><i class="fa-solid fa-right-from-bracket"></i>  log out</a>
        <a href="#"> <i className="fa-solid fa-screwdriver-wrench"></i> Settings</a>
        </div>
        
    </div>
    );

}

export default Sidebar;