import { useState } from "react";
import client from "../../api/client";
import ExportToExcel from "../../components/Exports/ExportToExcel";
import ExportToPDF from "../../components/Exports/ExportToPDF";
import AgTable from "../../components/table/AgTable";
import styles from "../../styles/FullAudit.module.css";

// ===============================================
// Helper: Auto-generate AG-Grid columns
// ===============================================
const generateColumnDefs = (data = []) => {
  if (!data.length) return [];

  const allKeys = new Set();
  data.forEach((row) => Object.keys(row).forEach((key) => allKeys.add(key)));

  return [...allKeys].map((key) => ({
    headerName: key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toUpperCase(),
    field: key,
    minWidth: 180,
    sortable: true,
    filter: true,

    cellRenderer: (params) => {
      const val = params.value;

      if (typeof val === "boolean") return val ? "True" : "False";

      if (key === "allowed" && Array.isArray(val)) {
        return val
          .map((obj) => {
            const proto = obj.IPProtocol?.toUpperCase() || "";
            const ports = obj.ports ? `(${obj.ports.join(",")})` : "";
            return `${proto} ${ports}`.trim();
          })
          .join(" | ");
      }

      if (Array.isArray(val)) return val.join(", ");

      if (typeof val === "object" && val !== null) {
        return JSON.stringify(val);
      }

      return val ?? "-";
    },

    cellStyle: { whiteSpace: "nowrap" },
    autoHeight: true,
  }));
};

// ===============================================
// Helper: Access nested fields dynamically
// ===============================================
const getNested = (obj, path) => {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

// Helper: make a nice title from a scan key, e.g. vpcFlowLogsScan → Vpc Flow Logs Scan
const prettifyScanKey = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// ===============================================
// MAIN COMPONENT
// ===============================================
export default function FullAudit({ file }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [error, setError] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Includes NEW RESOURCES Big Query Scan + Network Scan
  const resourceList = [
    "Buckets",
    "Firewall Rules",
    "GKE Clusters",
    "SQL Instances",
    "Cloud Run / Functions",
    "Load Balancers",
    "Owner IAM Roles",
    "VM Scan",
    "Big Query Scan",
    "Network Scan",
  ];

  // Mapping for simple "single-table" resources
  const mapping = {
    Buckets: "uniformAccessFindings", // publicAccessFindings can be added later if needed
    "Firewall Rules": "publicRules",
    "GKE Clusters": "findings",
    "SQL Instances": "cloudSqlScan.requireSslScan",
    "Cloud Run / Functions": "functionsAndRuns",
    "Load Balancers": "loadBalancers",
    "Owner IAM Roles": "iamScan.ownerServiceAccountScan.ownerServiceAccounts",
    "VM Scan": "vmScan",
    "Big Query Scan": "bigQueryScan.defaultCmekScan",
    // Network Scan is handled as a special multi-table section like VM Scan
  };

  // ===============================================
  // Run Full Audit
  // ===============================================
  const handleFullAudit = async () => {
    if (!file) {
      alert("Please upload your GCP Service Account JSON file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult({});

    try {
      const formData = new FormData();
      formData.append("keyFile", file);

      const res = await client.post("/full-audit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const normalizedResult = {};
      res.data.results.forEach((item) => {
        normalizedResult[item.name] = item.result;
      });

      setResult(normalizedResult);
    } catch (err) {
      console.error("Full audit error:", err);
      setError(err.response?.data?.detail || "Full audit failed");
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // TABLE RENDERER
  // ===============================================
  const renderTable = (name) => {
    if (!result[name]) return null;

    // ================================
    // SPECIAL CASE → VM SCAN
    // ================================
    if (name === "VM Scan") {
      const vmScan = result[name].vmScan;
      if (!vmScan) return <p>No VM data found</p>;

      return (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>VM Security Findings</h3>

          {Object.keys(vmScan).map((ruleKey) => {
            const rule = vmScan[ruleKey];
            const items = rule.affectedInstances || rule.instances;

            if (!items || items.length === 0) return null;

            const colDefs = generateColumnDefs(items);

            return (
              <div key={ruleKey} className={styles.subCard}>
                <h4 className={styles.subHeading}>{rule.title}</h4>
                <AgTable rowData={items} columnDefs={colDefs} height={300} />
              </div>
            );
          })}
        </div>
      );
    }

    // ================================
    // SPECIAL CASE → NETWORK SCAN
    // ================================
    if (name === "Network Scan") {
      const networkScan = result[name].networkScan;
      if (!networkScan) return <p>No Network data found</p>;

      return (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Network Security Findings</h3>

          {Object.keys(networkScan).map((scanKey) => {
            const items = networkScan[scanKey];

            if (!Array.isArray(items) || items.length === 0) return null;

            const colDefs = generateColumnDefs(items);
            const heading = prettifyScanKey(scanKey);

            return (
              <div key={scanKey} className={styles.subCard}>
                <h4 className={styles.subHeading}>{heading}</h4>
                <AgTable rowData={items} columnDefs={colDefs} height={350} />
              </div>
            );
          })}
        </div>
      );
    }

    // ================================
    // SPECIAL CASE → Owner IAM Roles
    // ================================
    if (name === "Owner IAM Roles") {
      const items = getNested(result[name], mapping[name]) || [];
      if (!items.length) return null;

      const colDefs = generateColumnDefs(items);

      return (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Owner IAM Roles Security Findings</h3>

          <div className={styles.subCard}>
            <h4 className={styles.subHeading}>High-Risk Owner Role Assignments</h4>
            <AgTable rowData={items} columnDefs={colDefs} height={350} />
          </div>
        </div>
      );
    }

    // ================================
    // NORMAL RESOURCES (single table)
    // ================================
    const field = mapping[name];
    if (!field) return null;

    let items;
    if (field.includes(".")) {
      items = getNested(result[name], field);
    } else {
      items = result[name][field];
    }

    if (!items || items.length === 0) return null;

    const colDefs = generateColumnDefs(items);

    return (
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{name}</h3>
        <AgTable rowData={items} columnDefs={colDefs} height={400} />
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
            {loading ? "Running..." : "Run GCP Audit"}
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
          ? renderTable(selectedResource)
          : resourceList.map((res) => renderTable(res)))}
    </div>
  );
}
