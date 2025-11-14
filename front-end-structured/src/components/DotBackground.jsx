// DotBackground.jsx
import DotGrid from "./DotGrid";

export default function DotBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#000",      // Black background
        zIndex: -1,
        overflow: "hidden",
        opacity: 1,
      }}
    >
      <DotGrid
        dotSize={2}
        gap={18}

        // ★ Default faded grey dots
        baseColor="#5730e4ff"        // soft grey (you can also use #888 for darker)

        // ★ Light blue active color near pointer
      activeColor="#66CCFF"     // smooth light blue glow

        proximity={150}
        shockRadius={240}
        shockStrength={4}
        resistance={700}
        returnDuration={1.6}
      />
    </div>
  );
}
