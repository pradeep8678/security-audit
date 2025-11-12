import { useState } from "react";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { listPublicVMs } from "../api/gcp";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function VMAudit({ file }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [results, setResults] = useState([]);

  const onRun = async () => {
    if (!file) {
      setError("Please upload a JSON key file first");
      return;
    }
    try {
      setStatus("loading");
      setError(null);
      const res = await listPublicVMs(file);

      const enhancedResults = (res.instances || []).map((vm) => {
        const publicIP = vm.externalIP || null;
        let recommendation = publicIP
          ? `⚠️ Your external IP is ${publicIP}. This VM is publicly accessible — please make it private or restrict access.`
          : `✅ This VM has no external IP and is private.`;
        return { ...vm, recommendation };
      });

      setProjectId(res.projectId);
      setResults(enhancedResults);
      setStatus("success");
    } catch (err) {
      setError(err.message || String(err));
      setStatus("error");
    }
  };

  const onReset = () => {
    setStatus("idle");
    setError(null);
    setProjectId(null);
    setResults([]);
  };

  const onDownloadExcel = () => {
    if (!results.length) {
      alert("No VM data to export yet!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Public VMs");
    const filename = `GCP_VM_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="module-box">
      <h2 style={{ textAlign: "center", color: "#24314f" }}>Compute Engine Audit</h2>

      <div className="action-buttons">
        <RunButton title="Run VM Audit" onClick={onRun} disabled={status === "loading"} />
        <button className="reset-btn" onClick={onReset}>Reset</button>
        <button className="excel-btn" onClick={onDownloadExcel}>Download Excel</button>
      </div>

      <StatusBar status={status} error={error} projectId={projectId} />
      <ResultsTable results={results} />
    </div>
  );
}
