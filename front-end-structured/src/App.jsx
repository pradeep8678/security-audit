import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import LandingPage from "./pages/Landing/LandingPage";
import SecurityAudit from "./pages/GCP/SecurityAudit.jsx";
import AWSAudit from "./pages/AWS/AWSAudit.jsx";
import "./styles/globals.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Landing Page (Unified) */}
          <Route path="/" element={<LandingPage />} />

          {/* GCP */}
          <Route path="/gcp" element={<SecurityAudit />} />

          {/* AWS */}
          <Route path="/aws" element={<AWSAudit />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
