import { useState } from "react";
import RunButton from "../components/RunButton";
import StatusBar from "../components/StatusBar";
import ResultsTable from "../components/ResultsTable";
import { checkPublicSql } from "../api/sql";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function SqlAudit({ file }) {
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

      const res = await checkPublicSql(file);
      console.log("🔍 SQL API response:", res);

      setProjectId(res.projectId);

      const instances = (res.instances || []).map((i) => ({
        name: i.name,
        region: i.region,
        databaseVersion: i.databaseVersion,
        backendType: i.backendType,
        ipAddress: i.ipAddress,
        recommendation: i.recommendation,
      }));

      setResults(instances);
      setStatus("success");
    } catch (err) {
      console.error("Error during Cloud SQL scan:", err);
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
      alert("No Cloud SQL data to export yet!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cloud SQL Instances");

    const filename = `GCP_CloudSQL_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="module-box">
      <h2 style={{ textAlign: "center", color: "#24314f" }}>Cloud SQL Audit</h2>

      <div className="action-buttons">
        <RunButton
          title="Run Cloud SQL Audit"
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
