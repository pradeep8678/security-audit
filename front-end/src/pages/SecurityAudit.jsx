import { useState } from "react";
import Header from "../components/Header";
import FileDropZone from "../components/FileDropZone";
import RunButton from "../components/RunButton";
import ResultsTable from "../components/ResultsTable";
import StatusBar from "../components/StatusBar";
import { listPublicVMs } from "../api/gcp";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function SecurityAudit() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [results, setResults] = useState([]);

  const onRun = async () => {
    if (!file) {
      setError("Please upload a JSON key file");
      return;
    }
    try {
      setStatus("loading");
      setError(null);
      const res = await listPublicVMs(file);

      // ✅ Add recommendation to each VM
      const enhancedResults = (res.instances || []).map((vm) => {
        const publicIP = vm.externalIP || null;
        let recommendation;

        if (publicIP) {
          recommendation = `⚠️ Your external IP is ${publicIP}. This VM is publicly accessible — please make it private or restrict access.`;
        } else {
          recommendation = `✅ This VM has no external IP and is private.`;
        }

        return { ...vm, recommendation };
      });

      setProjectId(res.projectId);
      setResults(enhancedResults);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  const onReset = () => {
    setFile(null);
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

    const filename = `GCP_Audit_${projectId || "results"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="container">
      <Header
        title="GCP Security Audit"
        subtitle="Scan and identify public VMs in your GCP project"
      />

      <FileDropZone file={file} onFile={setFile} />

      {/* Buttons Row */}
      <h1 style={{ marginTop: "20px" }}> Vm-Audit</h1>
      <div className="action-buttons">
        <RunButton
          title="Run VM Audit"
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
