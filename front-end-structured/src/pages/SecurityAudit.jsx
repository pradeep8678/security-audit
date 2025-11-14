import { useState } from "react";
import Header from "../components/Header";
import FileDropZone from "../components/FileDropZone";
import FullAudit from "./FullAudit";
import "./SecurityAudit.css";

export default function SecurityAudit() {
  const [file, setFile] = useState(null);

  // Names of the 8 resource types for display
  const resourceBoxes = [
    "Buckets",
    "Firewall Rules",
    "GKE Clusters",
    "SQL Instances",
    "Cloud Run / Functions",
    "Load Balancers",
    "Owner IAM Roles",
    "VM Instances",
  ];

  return (
    <div className="container">
      <div className="header-class">
      <Header
        title="GCP Security Audit Dashboard"
        subtitle="Upload your GCP Service Account JSON once and run a full audit"
      />
      </div>

      {/* File upload */}
      <FileDropZone file={file} onFile={setFile} />

      {!file && (
        <p style={{ textAlign: "center", color: "#666", marginTop: "10px" }}>
          Please upload your Service Account JSON to start the full audit.
        </p>
      )}

      {/* Full Audit only */}
      {file && <FullAudit file={file} />}
    </div>
  );
}
