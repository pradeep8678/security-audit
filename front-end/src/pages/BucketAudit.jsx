import { useState } from "react";
import Header from "../components/common/Header";
import FileDropZone from "../components/common/FileDropZone";
import RunButton from "../components/common/RunButton";
import ResultsTable from "../components/common/ResultsTable";
import StatusBar from "../components/common/StatusBar";
import { listPublicBuckets } from "../api/gcpBuckets";
import "./SecurityAudit.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function BucketAudit() {
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
      const res = await listPublicBuckets(file);
      setProjectId(res.projectId);

      const enhancedResults = (res.buckets || []).map((b) => ({
        name: b.name,
        location: b.location,
        storageClass: b.storageClass,
        access: b.access,
        recommendation: b.recommendation,
      }));

      setResults(enhancedResults);
      setStatus("success");
    } catch (err) {
      console.error(err);
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
      alert("No bucket data to export yet!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buckets");
    const filename = `GCP_Bucket_Audit_${projectId || "results"}.xlsx`;

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  return (
    <div className="container">
      <Header
        title="GCP Bucket Audit"
        subtitle="Scan and identify public Cloud Storage buckets in your GCP project"
      />

      <FileDropZone file={file} onFile={setFile} />

      <div className="action-buttons">
        <RunButton title="Run Bucket Audit" onClick={onRun} disabled={status === "loading"} />
        <button className="reset-btn" onClick={onReset}>Reset</button>
        <button className="excel-btn" onClick={onDownloadExcel}>Download Excel</button>
      </div>

      <StatusBar status={status} error={error} projectId={projectId} />
      <ResultsTable results={results} />
    </div>
  );
}
