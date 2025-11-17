import { useState } from "react";
import Header from "../components/Header";
import FileDropZone from "../components/FileDropZone";
import FullAudit from "./FullAudit";
import "./SecurityAudit.css";
import logo from "../assets/cavideo2.mp4";

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
        <div className="header-3col">

          {/* LEFT EMPTY SPACE */}
            <div className="header-right">
            <a
              href="https://cloudambassadors.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <video
                src={logo}
                className="header-logo"
                autoPlay
                loop
                muted
                playsInline
              />
            </a>
          </div>

          {/* CENTER TITLE */}
          <div className="header-center">
            <Header
              title="GCP Security Audit Dashboard"
              subtitle="Upload your GCP Service Account JSON once and run a full audit"
            />
          </div>

          {/* RIGHT LOGO */}
          <div className="header-right">
           
          </div>

        </div>
      </div>



      {/* File upload */}
      <FileDropZone file={file} onFile={setFile} />

      {!file && (
        <p style={{ textAlign: "center", color: "#f1eaeaff", marginTop: "10px" }}>
          Please upload your Service Account JSON to start the full audit.
        </p>
      )}

      {/* Full Audit only */}
      {file && <FullAudit file={file} />}
    </div>
  );
}
