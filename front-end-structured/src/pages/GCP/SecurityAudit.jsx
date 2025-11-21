import { useState } from "react";
import FileDropZone from "../../components/FileDropZone/FileDropZone";
import FullAudit from "./FullAudit.jsx";
import styles from "../../styles/SecurityAudit.module.css";

export default function SecurityAudit() {
  const [file, setFile] = useState(null);

  return (
    <div className={styles.pageWrapper}>
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
