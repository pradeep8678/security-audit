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

      {/* Auth box styled similar to FileDropZone */}
      <div className={styles.card} style={{ maxWidth: "600px", margin: "40px auto", padding: "40px" }}>
        <h2 className={styles.cardTitle} style={{ textAlign: "center", marginBottom: "10px" }}>
          AWS Credentials
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "30px" }}>
          Enter your AWS Access Key ID and Secret Access Key to launch the full security audit.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "var(--text-main)", fontSize: "0.9rem", fontWeight: "600" }}>Access Key ID</label>
            <input
              type="text"
              placeholder="AKIA..."
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                color: "#fff",
                fontSize: "1rem",
                outline: "none",
                transition: "border 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary-base)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-light)"}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "var(--text-main)", fontSize: "0.9rem", fontWeight: "600" }}>Secret Access Key</label>
            <input
              type="password"
              placeholder="Secure Key..."
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                color: "#fff",
                fontSize: "1rem",
                outline: "none",
                transition: "border 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary-base)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-light)"}
            />
          </div>
        </div>
      </div>

      {/* Full AWS Audit */}
      <AwsFullAudit credentials={credentials} />
    </div>
  );
}
