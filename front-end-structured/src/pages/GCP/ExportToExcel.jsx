import React from "react";
import * as XLSX from "xlsx";

export default function ExportToExcel({ auditResult, onClose }) {
  const handleExport = () => {
    if (!auditResult || Object.keys(auditResult).length === 0) {
      alert("No data available to export");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = Object.keys(auditResult).map((key) => {
      let field;
      switch (key) {
        case "Buckets": field = "buckets"; break;
        case "Firewall Rules": field = "publicRules"; break;
        case "GKE Clusters": field = "clusters"; break;
        case "SQL Instances": field = "instances"; break;
        case "Cloud Run / Functions": field = "functionsAndRuns"; break;
        case "Load Balancers": field = "loadBalancers"; break;
        case "Owner IAM Roles": field = "ownerServiceAccounts"; break;
        case "VM Instances": field = "instances"; break;
        default: field = null;
      }
      const items = field ? auditResult[key][field] || [] : [];
      return {
        Resource: key,
        Success: auditResult[key].success ?? "N/A",
        ItemsCount: items.length,
      };
    });

    const summaryWS = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    // Individual sheets
    Object.keys(auditResult).forEach((key) => {
      let field;
      let headers;
      switch (key) {
        case "Buckets":
          field = "buckets";
          headers = ["Bucket", "Role", "Member"];
          break;
        case "Firewall Rules":
          field = "publicRules";
          headers = ["Name", "Direction", "Protocols", "SourceRanges", "Network", "Priority", "Disabled", "Recommendation"];
          break;
        case "GKE Clusters":
          field = "clusters";
          headers = ["Cluster", "Endpoint", "Private Nodes"];
          break;
        case "SQL Instances":
          field = "instances";
          headers = ["Instance", "Public IP"];
          break;
        case "Cloud Run / Functions":
          field = "functionsAndRuns";
          headers = ["Type", "Name", "Region", "Ingress", "Auth", "ServiceAccount", "URL", "ExposureRisk", "Recommendation"];
          break;
        case "Load Balancers":
          field = "loadBalancers";
          headers = ["Name", "Scheme", "IP", "Target", "SSL Policy", "SSL Cert Status", "HTTPS Redirect", "Cloud Armor Policy", "Armor Rule Strength", "Internal Exposure"];
          break;
        case "Owner IAM Roles":
          field = "ownerServiceAccounts";
          headers = ["ServiceAccount", "Role"];
          break;
        case "VM Instances":
          field = "instances";
          headers = ["Instance", "Zone", "Public IP"];
          break;
        default:
          field = null;
      }

      if (!field) return;

      const data = auditResult[key][field] || [];
      if (data.length === 0) data.push({ Message: "✅ No issues found." });

      const sheetData = data.map((item) => {
        const row = {};
        headers.forEach((h) => {
          row[h] = item[h] ?? item[h.toLowerCase()] ?? JSON.stringify(item[h.toLowerCase()]) ?? "";
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, key.substring(0, 31));
    });

    XLSX.writeFile(wb, `GCP_Full_Audit_${new Date().toISOString().split("T")[0]}.xlsx`);
    if (onClose) onClose();
  };

  return (
    <button
      onClick={handleExport}
      style={{
        width: "100%",
        padding: "10px",
        textAlign: "left",
        border: "none",
        background: "none",
        cursor: "pointer",
      }}
    >
      Export to Excel
    </button>
  );
}
