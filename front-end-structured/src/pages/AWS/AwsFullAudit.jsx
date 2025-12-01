// src/pages/aws/AwsFullAudit.jsx
import { useState } from "react";
import { runAwsFullAudit } from "../../api/aws";
import ExportToExcel from "../../components/Exports/ExportToExcelAws";
import ExportToPDF from "../../components/Exports/ExportToPDFAWS";
import styles from "../../styles/FullAudit.module.css";

export default function AwsFullAudit({ credentials }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [error, setError] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const resourceList = [
    "EC2 Instances",
    "S3 Buckets",
    "Load Balancers",
    "IAM Users & Roles",
    "Security Groups",
    "EKS Clusters",
    "App Runner Services",
    "RDS Databases",
  ];

const readable = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((v) => readable(v)).join(", ");
  if (typeof value === "object" && value !== null)
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${readable(v)}`)
      .join(", ");
  return value;
};


  const handleFullAudit = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      alert("Please enter AWS credentials first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult({});

    try {
      const data = await runAwsFullAudit(
        credentials.accessKeyId,
        credentials.secretAccessKey
      );

      const normalized = {};
      data.results.forEach((item) => {
        if (item.success) normalized[item.name] = item.result;
        else normalized[item.name] = { error: item.error };
      });

      console.log("Normalized line 57", normalized);
      setResult(normalized);
    } catch (err) {
      setError("AWS Full Audit Failed. Check console.");
    }

    setLoading(false);
  };


  
  const mapping = {
    "EC2 Instances": "instances",
    "S3 Buckets": "buckets",
    "Load Balancers": "loadBalancers",
    "IAM Users & Roles": "adminUsers",
    "Security Groups": "findings",
    "EKS Clusters": "clusters",
    "App Runner Services": "findings",
    "RDS Databases": "instances",
  };

  const renderTable = (items, name) => {

    if (!items || items.length === 0)
      return <p className={styles.noData}>No security issues detected in this resource.</p>;

    const headers = Object.keys(items[0]);

    return (
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr key={i}>
              {headers.map((key) => (
                <td key={key}>{readable(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // ⭐ FINAL CLEAN RENDERER — FIXED COMPLETELY
  const renderResource = (name) => {
    const res = result[name];
    if (!res) return null;

    if (res.error) {
      return (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{name}</h3>
          <p className={styles.error}>{res.error}</p>
        </div>
      );
    }

    const field = mapping[name];
    const items = res[field];

    return (
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{name}</h3>

        {/* MAIN TABLE */}
        {Array.isArray(items) && renderTable(items, name)}

        {/* Extra fields */}
        {Object.entries(res).map(([k, v]) => {
          // ❌ Do not show main field again
          if (k === field) return null;

          // ❌ EXCLUDE adminRoles
          if (name === "IAM Users & Roles" && k === "adminRoles") return null;

          // ❌ EXCLUDE EKS totalRiskyClusters
          if (name === "EKS Clusters" && k === "totalRiskyClusters") return null;

          // ❌ Do not show empty arrays
          if (Array.isArray(v) && v.length === 0) return null;

          // Show number / string
          if (typeof v === "string" || typeof v === "number") {
            return (
              <p key={k} className={styles.metaField}>
                <b>{k}:</b> {v}
              </p>
            );
          }

          // Show extra arrays
          if (Array.isArray(v)) {
            return (
              <div key={k}>
                <h4 className={styles.subHeading}>{k}</h4>
                {renderTable(v, k)}
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  const allDataLoaded =
    Object.keys(result).length === resourceList.length && !loading;

  return (
    <div className={styles.container}>
      <div className={allDataLoaded ? styles.subbox : styles.subboxCompact}>
        <div className={styles.center}>
          <button
            onClick={handleFullAudit}
            disabled={loading}
            className={loading ? styles.btnDisabled : styles.btnPrimary}
          >
            {loading ? "Running..." : "Run AWS Audit"}
          </button>

          {allDataLoaded && (
            <div className={styles.dropdownWrapper}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={styles.btnSuccess}
              >
                Download ▼
              </button>

              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <ExportToExcel auditResult={result} />
                  <ExportToPDF auditResult={result} />
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {allDataLoaded && (
          <div className={styles.selectorWrapper}>
            <div
              onClick={() => setSelectedResource(null)}
              className={
                selectedResource === null ? styles.selectedChip : styles.chip
              }
            >
              All
            </div>

            {resourceList.map((res) => (
              <div
                key={res}
                onClick={() => setSelectedResource(res)}
                className={
                  selectedResource === res ? styles.selectedChip : styles.chip
                }
              >
                {res}
              </div>
            ))}
          </div>
        )}
      </div>

      {allDataLoaded &&
        (selectedResource
          ? renderResource(selectedResource)
          : resourceList.map((res) => (
              <div key={res}>{renderResource(res)}</div>
            )))}
    </div>
  );
}
