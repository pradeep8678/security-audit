import { useState } from "react";
import FileDropZone from "../components/FileDropZone";
import FullAudit from "../pages/FullAudit";
import styles from "./SecurityAudit.module.css";

export default function SecurityAudit() {
  const [file, setFile] = useState(null);

  return (
    <div className={styles.pageWrapper}>
      {/* PAGE TITLE */}
      {/* <div className={styles.pageHeader}>
        <h1 className={styles.title}>GCP Security Audit Dashboard</h1>
        <p className={styles.subtitle}>
          Upload your Service Account JSON once and run a full audit
        </p>
      </div> */}

      {/* File upload */}
      <FileDropZone file={file} onFile={setFile} />

      {!file && (
        <p className={styles.uploadHint}>
          Please upload your Service Account JSON to start the full audit.
        </p>
      )}

      {/* Full Audit Section */}
      {file && <FullAudit file={file} />}
    </div>
  );
}
