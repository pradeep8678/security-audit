import { useState } from "react";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { checkCloudFunctionsAndRuns } from "../api/cloudrun";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CloudRunAudit({ file }) {
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

      const res = await checkCloudFunctionsAndRuns(file);
      console.log("🔍 Cloud Functions & Run API response:", res);

      setProjectId(res.projectId);

      const functionsRuns = (res.functionsAndRuns || []).map((item) => ({
        type: item.type,
        name: item.name,
        region: item.region,
        runtime: item.runtime,
        url: item.url,
        ingress: item.ingress,
        auth: item.auth,
        serviceAccount: item.serviceAccount,
        unauthenticated: item.unauthenticated,
        exposureRisk: item.exposureRisk,
        recommendation: item.recommendation,
      }));

      setResults(functionsRuns);
      setStatus("success");
    } catch (err) {
      console.error("Error scanning Cloud Functions & Runs:", err);
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
      alert("No Cloud Run / Function data to export yet!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cloud Functions & Run");

    const filename = `GCP_CloudRun_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="module-box">
      <h2 style={{ textAlign: "center", color: "#24314f" }}>Cloud Functions & Cloud Run Audit</h2>

      <div className="action-buttons">
        <RunButton
          title="Run Audit"
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
