export default function RunButton({ onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:"10px 20px", background:"#007bff", color:"#fff", border:"none",
      borderRadius:"6px", cursor:"pointer"}}>
      Run Audit
    </button>
  );
}