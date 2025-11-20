import Navbar from "./components/Navbar/Navbar.jsx";
import SecurityAudit from "./pages/SecurityAudit";
import DotBackground from "./components/DotBackground"; 
import ColorBends from "./components/Backgrounds/ColorBends/ColorBends.jsx";
import "./styles/globals.css";

export default function App() {
  return (
    <>
      {/* Background animation */}
      {/* <DotBackground /> */}
      <ColorBends
        colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
        
        rotation={0}          // from preview
        autoRotate={0}        // from preview
        
        speed={0.2}           // preview default
        scale={1}             // preview default
        frequency={1}         // preview default
        warpStrength={1}      // preview default
        
        mouseInfluence={1}    // preview default
        parallax={0.5}        // preview default
        
        noise={0.38}          // preview default
        
        transparent
      />

      {/* Main layout wrapper */}
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <SecurityAudit />
        </main>
      </div>
    </>
  );
}
