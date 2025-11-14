import SecurityAudit from "./pages/SecurityAudit";
import DotBackground from "./components/DotBackground"; 
import "./styles.css";

export default function App() {
  return (
    <>
      {/* Beautiful Animated Background */}
      <DotBackground />

      {/* Your Main Application */}
      <SecurityAudit />
    </>
  );
}
