import { useState } from "react";
import Header from "../components/Header";
import FileDropZone from "../components/FileDropZone";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { listPublicVMs } from "../api/gcp";

export default function SecurityAudit() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [results, setResults] = useState([]);

  const onRun = async () => {
    if (!file) { setError("Please upload a JSON key file"); return; }
    try {
      setStatus("loading"); setError(null);
      const res = await listPublicVMs(file);
      setProjectId(res.projectId);
      setResults(res.instances || []);
      setStatus("success");
    } catch (err) { setError(err.message); setStatus("error"); }
  };

  const onReset = () => {
    setFile(null); setStatus("idle"); setError(null); setProjectId(null); setResults([]);
  };

  return (
    <div style={{padding:"20px"}}>
      <Header title="Security Audit" subtitle="Upload key & detect public VMs." />
      <FileDropZone file={file} onFile={setFile} />
      <RunButton onClick={onRun} disabled={!file || status==="loading"} />
      <button onClick={onReset} style={{marginLeft:"10px"}}>Reset</button>
      <StatusBar status={status} error={error} projectId={projectId} />
      <ResultsTable results={results} />
    </div>
  );
}