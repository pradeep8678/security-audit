// src/pages/aws/AwsFullAudit.jsx
import { useState } from "react";
import { runAwsFullAudit } from "../../api/aws";
import ExportToExcel from "../../components/Exports/ExportToExcel";
import ExportToPDF from "../../components/Exports/ExportToPDF";
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

      setResult(normalized);
    } catch (err) {
      setError("AWS Full Audit Failed. Check console.");
    }

    setLoading(false);
  };

  // 🔥 mapping to actual array fields from backend JSON
  const mapping = {
    "EC2 Instances": "instances",        // result.instances
    "S3 Buckets": "buckets",             // result.buckets
    "Load Balancers": "loadBalancers",   // result.loadBalancers
    "IAM Users & Roles": "adminUsers",   // result.adminUsers (array)
    "Security Groups": "publicRules",    // result.publicRules (array)
    "EKS Clusters": "clusters",          // result.clusters
    "App Runner Services": "findings",   // result.findings
    "RDS Databases": "instances",        // result.instances
  };

  const renderTable = (items) => {
    if (!items || items.length === 0)
      return <p className={styles.noData}>No data available</p>;

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
        {renderTable(items)}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.subbox}>
        <div className={styles.center}>
          <button
            onClick={handleFullAudit}
            disabled={loading}
            className={loading ? styles.btnDisabled : styles.btnPrimary}
          >
            {loading ? "Running..." : "Run Full AWS Audit"}
          </button>

          {Object.keys(result).length > 0 && (
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

        <div className={styles.selectorWrapper}>
          <div
            onClick={() => setSelectedResource(null)}
            className={selectedResource === null ? styles.selectedChip : styles.chip}
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
      </div>

      {selectedResource
        ? renderResource(selectedResource)
        : resourceList.map((res) => (
            <div key={res}>{renderResource(res)}</div>
          ))}
    </div>
  );
}
