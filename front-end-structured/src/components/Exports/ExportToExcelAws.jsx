import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ExportToExcel({ auditResult, onClick }) {

  const handleExport = () => {
    if (!auditResult || Object.keys(auditResult).length === 0) {
      alert("No audit data to export!");
      return;
    }

    const wb = XLSX.utils.book_new();

    // -----------------------------
    // SUMMARY SHEET
    // -----------------------------
    const summaryData = Object.keys(auditResult).map((resource) => {
      const items = extractItems(resource);
      return {
        Resource: resource,
        Count: Array.isArray(items) ? items.length : 0,
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // -----------------------------
    // ONE SHEET PER RESOURCE
    // -----------------------------
    Object.keys(auditResult).forEach((resource) => {
      const safeName = resource.replace(/[\\\/*?:\[\]]/g, " ");

      const items = extractItems(resource);

      if (!Array.isArray(items) || items.length === 0) {
        const sheet = XLSX.utils.aoa_to_sheet([["No data available"]]);
        XLSX.utils.book_append_sheet(wb, sheet, safeName);
        return;
      }

      const headers = Object.keys(items[0]);
      const sheetData = [headers];

      items.forEach((item) => {
        sheetData.push(headers.map((h) => item[h] ?? ""));
      });

      const sheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, sheet, safeName);
    });

    // -----------------------------
    // DOWNLOAD
    // -----------------------------
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([wbout]), "aws-full-audit.xlsx");

    if (onClick) onClick();
  };

  // ============================================================
  // FIXED: extractItems NOW SUPPORTS AWS ALSO 🔥
  // ============================================================
  const extractItems = (resource) => {
    const data = auditResult[resource];
    if (!data) return [];

    switch (resource) {
      // ------------------- AWS PROVIDER -------------------
      case "EC2 Instances":
        return data.instances || [];

      case "S3 Buckets":
        return data.buckets || [];

      case "Load Balancers":
        return data.loadBalancers || [];

      case "IAM Users & Roles":
        // Combine roles + users into one table
        return [
          ...(data.adminUsers || []),
          ...(data.adminRoles || []),
        ];

      case "Security Groups":
        return data.publicRules || [];

      case "EKS Clusters":
        return data.clusters || [];

      case "App Runner Services":
        return data.findings || [];

      case "RDS Databases":
        return data.instances || [];

      // ------------------- GCP PROVIDER (existing) -------------------
      case "Buckets":
        return data.buckets || [];

      case "Firewall Rules":
        return data.publicRules || [];

      case "GKE Clusters":
        return data.clusters || [];

      case "SQL Instances":
        return data.instances || [];

      case "Cloud Run / Functions":
        return data.functionsAndRuns || [];

      case "Owner IAM Roles":
        return data.ownerServiceAccounts || [];

      case "VM Instances":
        return data.instances || [];

      default:
        return [];
    }
  };

  return (
    <button
      onClick={handleExport}
      style={{
        padding: "10px 15px",
        color: "black",
        border: "none",
        width: "100%",
        borderRadius: "0px",
        cursor: "pointer",
        fontWeight: "bold",
        background: "transparent",
        transition: "0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.target.style.background = "#e9f3ff";
        e.target.style.color = "#0d6efd";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "transparent";
        e.target.style.color = "black";
      }}
    >
      Download Excel
    </button>
  );
}
