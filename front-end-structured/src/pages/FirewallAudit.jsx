import { useState } from "react";
import Header from "../components/Header";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { scanFirewall } from "../api/firewall";
import "./SecurityAudit.css";   // SAME CSS as BucketAudit
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function FirewallAudit({ file }) {
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
      const res = await scanFirewall(file);

      setProjectId(res.projectId || "unknown");

      const enhanced = (res.publicRules || []).map(rule => ({
        name: rule.name,
        network: rule.network,
        direction: rule.direction,
        sourceRanges: rule.sourceRanges?.join(", "),
        recommendation: "⚠️ Rule is publicly open. Restrict to trusted IPs.",
      }));

      setResults(enhanced);
      setStatus("success");
    } catch (err) {
      console.error("Firewall scan failed:", err);
      setError(err.message || "Failed to scan firewall rules");
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
      alert("No firewall data to export yet!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Firewall Rules");

    const filename = `GCP_Firewall_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="module-box">
      <h2 style={{ textAlign: "center", color: "#24314f" }}>
        Firewall Rules Audit
      </h2>

      <div className="action-buttons">
        <RunButton
          title="Run Firewall Audit"
          onClick={onRun}
          disabled={status === "loading"}
        />
        <button className="reset-btn" onClick={onReset}>
          Reset
        </button>
        <button className="excel-btn" onClick={onDownloadExcel}>
          Download Excel
        </button>
      </div>

      <StatusBar status={status} error={error} projectId={projectId} />

      <ResultsTable results={results} />
    </div>
  );
}
