import { useState } from "react";
import Header from "../components/Header";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { checkOwnerServiceAccounts } from "../api/owner";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function OwnerAudit({ file }) {
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
      const res = await checkOwnerServiceAccounts(file);
      setProjectId(res.projectId);

      const formatted = (res.ownerServiceAccounts || []).map((item) => ({
        serviceAccount: item.serviceAccount,
        role: item.role,
      }));

      setResults(formatted);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to check Owner service accounts");
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
      alert("No owner service account data to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Owner Service Accounts");
    const filename = `GCP_Owner_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="module-box">
      <h2 style={{ textAlign: "center", color: "#24314f" }}>Owner Role Audit</h2>

      <div className="action-buttons">
        <RunButton
          title="Run Owner Audit"
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
      <ResultsTable
        results={results}
        columns={[
          { header: "Service Account", accessor: "serviceAccount" },
          { header: "Role", accessor: "role" },
        ]}
      />
    </div>
  );
}
