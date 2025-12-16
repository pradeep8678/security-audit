export default function RunButton({ onClick, disabled, title = "Run Audit" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 20px",
        background: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: disabled ? "not-alLowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        transition: "all 0.2s ease"
      }}
    >
      {title}
    </button>
  );
}
