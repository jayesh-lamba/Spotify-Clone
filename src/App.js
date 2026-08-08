import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import "./App.css"
function App() {
  return (
    <div className="wrp">
      <Navbar/>
      <Sidebar/>
      
      <main>
        
        <Home/>
      </main>

      <Player/>
     
    </div>
  );
}

export default App;
