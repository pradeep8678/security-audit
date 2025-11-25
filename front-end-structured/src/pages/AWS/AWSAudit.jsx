// src/pages/aws/AWSAudit.jsx
import { useState } from "react";
import AwsFullAudit from "./AwsFullAudit";
import styles from "../../styles/FullAudit.module.css";

export default function AWSAudit() {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");

  const credentials = { accessKeyId, secretAccessKey };

  return (
    <div className={styles.container}>
      
      {/* Auth box styled similar to your FileDropZone */}
      <div className={styles.dropzone}>
        <h2 className={styles.dropzoneTitle}>AWS Credentials</h2>
        <p className={styles.dropzoneSub}>
          Enter your AWS Access Key ID and Secret Access Key to run full audit.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "420px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="AWS Access Key ID"
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
            style={{
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #ccd4ff",
              fontSize: "15px",
            }}
          />

          <input
            type="password"
            placeholder="AWS Secret Access Key"
            value={secretAccessKey}
            onChange={(e) => setSecretAccessKey(e.target.value)}
            style={{
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #ccd4ff",
              fontSize: "15px",
            }}
          />
        </div>
      </div>

      {/* Full AWS Audit */}
      <AwsFullAudit credentials={credentials} />
    </div>
  );
}
