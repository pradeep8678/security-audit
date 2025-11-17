// FullAudit.jsx (Updated with hard‑coded recommendations for ALL services)

import { useState } from "react";
import client from "../api/client";
import ExportToExcel from "../components/ExportToExcel";
import ExportToPDF from "../components/ExportToPDF";
import styles from "./FullAudit.module.css";

export default function FullAudit({ file }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [error, setError] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const resourceList = [
    "Buckets",
    "Firewall Rules",
    "GKE Clusters",
    "SQL Instances",
    "Cloud Run / Functions",
    "Load Balancers",
    "Owner IAM Roles",
    "VM Instances",
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

  const addRecommendation = (items, name) => {
    return items.map((item) => {
      if (item.recommendation) return item;

      let rec = "";

      if (name === "Firewall Rules") {
        const src = item.sourceRanges?.join(", ") || "unknown";
        rec = `This firewall rule is public with source ${src}. Make it private and restrict CIDR.`;
      }

      else if (name === "VM Instances") {
        const ip = item.publicIP || "unknown";
        rec = `This VM is publicly accessible with IP ${ip}. Remove public IP and place behind a private network.`;
      }

      else if (name === "GKE Clusters") {
        const ep = item.endpoint || "unknown";
        rec = `GKE endpoint ${ep} is public. Enable private clusters and restrict control plane access.`;
      }

      else if (name === "Cloud Run / Functions") {
        const url = item.url || item.name || "service";
        rec = `The Cloud Run/Function ${url} is public. Restrict ingress and disable unauthenticated access.`;
      }

      else if (name === "Buckets") {
        rec = "Bucket appears private. Ensure uniform bucket-level access and IAM restrictions.";
      }

      else if (name === "SQL Instances") {
        rec = "SQL instance should stay private. Ensure public IP is disabled and use private service networking.";
      }

      else if (name === "Load Balancers") {
        rec = "Review LB frontends and ensure only intended services are publicly reachable.";
      }

      else if (name === "Owner IAM Roles") {
        rec = "Owner role is highly privileged. Replace with least‑privilege IAM roles.";
      }

      return { ...item, recommendation: rec };
    });
  };

  const renderTable = (items, name) => {
    if (!items || items.length === 0)
      return <p className={styles.noData}>No data available</p>;

    const enriched = addRecommendation(items, name);
    const headers = [...new Set([...Object.keys(enriched[0])])];

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
          {enriched.map((item, idx) => (
            <tr key={idx}>
              {headers.map((key) => (
                <td key={key}>{readable(item[key] ?? "-")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderResource = (name) => {
    if (!result[name]) return null;

    const mapping = {
      "Buckets": "buckets",
      "Firewall Rules": "publicRules",
      "GKE Clusters": "clusters",
      "SQL Instances": "instances",
      "Cloud Run / Functions": "functionsAndRuns",
      "Load Balancers": "loadBalancers",
      "Owner IAM Roles": "ownerServiceAccounts",
      "VM Instances": "instances",
    };

    const field = mapping[name] || null;

    return (
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{name}</h3>
        {field && renderTable(result[name][field], name)}
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
          {loading ? "Running..." : "Run Full Audit"}
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
                <div>
                  <ExportToExcel auditResult={result} onClick={() => setShowDropdown(false)} />
                </div>
                <div>
                  <ExportToPDF auditResult={result} onClick={() => setShowDropdown(false)} />
                </div>
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
            className={selectedResource === res ? styles.selectedChip : styles.chip}
          >
            {res}
          </div>
        ))}

        {/* <div
          onClick={() => setSelectedResource(null)}
          className={selectedResource === null ? styles.selectedChip : styles.chip}
        >
          All
        </div> */}
      </div>
      </div>

      {selectedResource
        ? renderResource(selectedResource)
        : resourceList.map((res) => renderResource(res))}
    </div>
  );
}
