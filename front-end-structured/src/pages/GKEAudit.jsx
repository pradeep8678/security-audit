import { useState } from "react";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { checkGKEClusters } from "../api/gke";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function GKEAudit({ file }) {
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

      const res = await checkGKEClusters(file);
      console.log("🔍 GKE API response:", res);

      // Extract projectId and clusters
      setProjectId(res.projectId);

      const clusters = (res.clusters || []).map((c) => ({
        name: c.name,
        location: c.location,
        endpoint: c.endpoint,
        privateNodes: c.privateNodes ? "✅ Yes" : "❌ No",
        recommendation: c.recommendation,
      }));

      setResults(clusters);
      setStatus("success");
    } catch (err) {
      console.error("Error scanning clusters:", err);
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
      alert("No GKE cluster data to export yet!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GKE Clusters");

    const filename = `GCP_GKE_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="module-box">
      <h2 style={{ textAlign: "center", color: "#24314f" }}>GKE Cluster Audit</h2>

      <div className="action-buttons">
        <RunButton
          title="Run GKE Audit"
          onClick={onRun}
          disabled={status === "loading"}
        />
        <button className="reset-btn" onClick={onReset}>Reset</button>
        <button className="excel-btn" onClick={onDownloadExcel}>Download Excel</button>
      </div>

      <StatusBar status={status} error={error} projectId={projectId} />

      <ResultsTable results={results} />
    </div>
  );
}
