import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import ProviderSelect from "./components/ProviderSelect/ProviderSelect";
import SecurityAudit from "./pages/GCP/SecurityAudit.jsx";
import AWSPage from "./pages/AWS/AWSPage.jsx";
import ColorBends from "./components/Backgrounds/ColorBends/ColorBends";
import "./styles/globals.css";

export default function App() {
  return (
    <BrowserRouter>
      <ColorBends
        colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
        rotation={0}
        autoRotate={0}
        speed={0.2}
        scale={1}
        frequency={1}
        warpStrength={1}
        mouseInfluence={1}
        parallax={0.5}
        noise={0.38}
        transparent
      />

      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Provider Selection */}
          <Route path="/" element={<ProviderSelect />} />

          {/* GCP */}
          <Route path="/gcp" element={<SecurityAudit />} />

          {/* AWS */}
          <Route path="/aws" element={<AWSPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
