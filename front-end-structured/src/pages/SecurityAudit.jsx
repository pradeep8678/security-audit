import { useState } from "react";
import Header from "../components/Header";
import FileDropZone from "../components/FileDropZone";
import VMAudit from "./VMAudit";
import BucketAudit from "./BucketAudit";
import FirewallAudit from "./FirewallAudit";
import "./SecurityAudit.css";

export default function SecurityAudit() {
  const [file, setFile] = useState(null);

  return (
    <div className="container">
      <Header
        title="GCP Security Audit Dashboard"
        subtitle="Upload your GCP Service Account JSON once and scan multiple resources"
      />

      {/* Upload once at top */}
      <FileDropZone file={file} onFile={setFile} />

      {!file && (
        <p style={{ textAlign: "center", color: "#666", marginTop: "10px" }}>
          Please upload your Service Account JSON to start audits.
        </p>
      )}

      {/* Show audit modules only when file is present */}
      {file && (
        <div style={{ marginTop: "30px" }}>
          <VMAudit file={file} />
          <hr style={{ margin: "30px 0", border: "0.5px solid #ddd" }} />
          <BucketAudit file={file} />
          <hr style={{ margin: "30px 0", border: "0.5px solid #ddd" }} />
          <FirewallAudit file={file} /> {/* 🔥 New section */}
        </div>
      )}
    </div>
  );
}
