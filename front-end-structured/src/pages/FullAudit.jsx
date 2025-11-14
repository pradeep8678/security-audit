import { useState } from "react";
import client from "../api/client";
import ExportToExcel from "../components/ExportToExcel";
import ExportToPDF from "../components/ExportToPDF";

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

  const renderTable = (items) => {
    if (!items || items.length === 0)
      return <p style={{ fontStyle: "italic" }}>No data available</p>;

    const headers = Object.keys(items[0]);

    return (
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
        <thead style={{ background: "#007bff", color: "#fff" }}>
          <tr>
            {headers.map((key) => (
              <th
                key={key}
                style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={idx}
              style={{ background: idx % 2 === 0 ? "#f9f9f9" : "#fff", transition: "0.3s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e0f7ff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = idx % 2 === 0 ? "#f9f9f9" : "#fff")
              }
            >
              {headers.map((key) => (
                <td key={key} style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {typeof item[key] === "object" ? JSON.stringify(item[key]) : item[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderResource = (name) => {
    if (!result[name]) return null;

    let field;
    switch (name) {
      case "Buckets":
        field = "buckets";
        break;
      case "Firewall Rules":
        field = "publicRules";
        break;
      case "GKE Clusters":
        field = "clusters";
        break;
      case "SQL Instances":
        field = "instances";
        break;
      case "Cloud Run / Functions":
        field = "functionsAndRuns";
        break;
      case "Load Balancers":
        field = "loadBalancers";
        break;
      case "Owner IAM Roles":
        field = "ownerServiceAccounts";
        break;
      case "VM Instances":
        field = "instances";
        break;
      default:
        field = null;
    }

    return (
      <div
        key={name}
        style={{
          textAlign: "left",
          margin: "20px 0",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          background: "#fff",
          transition: "0.3s",
        }}
      >
        <h3 style={{ color: field ? "#007bff" : "#333" }}>{name}</h3>
        {field && renderTable(result[name][field])}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#007bff" }}>Full GCP Security Audit</h1>
      <p style={{ textAlign: "center", color: "#555" }}>
        Run a complete security audit across all GCP resources
      </p>

      {/* Run Audit Button */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleFullAudit}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#aaa" : "#007bff",
            color: "#fff",
            border: "none",
            padding: "12px 30px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            transition: "0.3s",
            marginRight: "10px",
          }}
        >
          {loading ? "Running..." : "Run Full Audit"}
        </button>

        {/* ✅ DOWNLOAD BUTTON ONLY WHEN RESULTS EXIST */}
        {Object.keys(result).length > 0 && (
          <div style={{ display: "inline-block", position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Download ▼
            </button>

            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  left: "0",
                  background: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  zIndex: 10,
                  minWidth: "150px",
                }}
              >
                <div style={{ padding: "0px", borderBottom: "1px solid #ccc" }}>
                  <ExportToExcel
                    auditResult={result}
                    onClick={() => setShowDropdown(false)}
                  />
                </div>

                <div style={{ padding: "0px", borderBottom: "1px solid #ccc" }}>
                  <ExportToPDF
                    auditResult={result}
                    onClick={() => setShowDropdown(false)}
                  />
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {/* Resource selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {resourceList.map((res) => (
          <div
            key={res}
            onClick={() => setSelectedResource(res)}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              cursor: "pointer",
              border: selectedResource === res ? "2px solid #007bff" : "1px solid #ccc",
              background: selectedResource === res ? "#e0f0ff" : "#f2f2f2",
              transition: "0.3s",
              fontWeight: "bold",
            }}
          >
            {res}
          </div>
        ))}
        <div
          onClick={() => setSelectedResource(null)}
          style={{
            padding: "10px 20px",
            borderRadius: "20px",
            cursor: "pointer",
            border: selectedResource === null ? "2px solid #007bff" : "1px solid #ccc",
            background: selectedResource === null ? "#e0f0ff" : "#f2f2f2",
            transition: "0.3s",
            fontWeight: "bold",
          }}
        >
          All
        </div>
      </div>

      {/* Display selected resource or all */}
      {selectedResource
        ? renderResource(selectedResource)
        : resourceList.map((res) => renderResource(res))}
    </div>
  );
}
