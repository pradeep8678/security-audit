export default function StatusBar({ status, error, projectId }) {
  if (status === "idle") return null;
  if (status === "loading") return <div>Running audit...</div>;
  if (status === "error") return <div style={{color:"red"}}>{error}</div>;
  if (status === "success") return <div>Project: {projectId}</div>;
}