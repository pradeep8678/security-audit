import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ExportToExcelAws({ auditResult, onClick }) {

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
      const items = extractItems(resource, auditResult[resource]);
      return {
        Resource: resource,
        Count: Array.isArray(items) ? items.length : 0,
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    styleSheet(summarySheet);
    // autoFit(summarySheet, summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // -----------------------------
    // ONE SHEET PER RESOURCE
    // -----------------------------
    Object.keys(auditResult).forEach((resource) => {
      const safeName = resource.replace(/[\\\/*?:\[\]]/g, " ").substring(0, 31);

      const items = extractItems(resource, auditResult[resource]);

      if (!Array.isArray(items) || items.length === 0) {
        const sheet = XLSX.utils.aoa_to_sheet([["No data available"]]);
        styleSheet(sheet);
        XLSX.utils.book_append_sheet(wb, sheet, safeName);
        return;
      }

      // Flatten items for Excel if they are nested
      const flatItems = items.map(item => {
        const flat = {};
        Object.entries(item).forEach(([k, v]) => {
          if (Array.isArray(v)) flat[k] = v.join(", ");
          else if (typeof v === "object" && v !== null) flat[k] = JSON.stringify(v);
          else flat[k] = v;
        });
        return flat;
      });

      const sheet = XLSX.utils.json_to_sheet(flatItems);
      styleSheet(sheet);
      autoFit(sheet, flatItems);
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
  // EXTRACTOR
  // ============================================================
  const extractItems = (resource, data) => {
    if (!data) return [];

    switch (resource) {
      // ------------------- AWS PROVIDER -------------------
      case "EC2 Instances": return data.instances || [];
      case "S3 Buckets": return data.buckets || [];
      case "Load Balancers": return data.loadBalancers || [];
      case "IAM Users & Roles":
        // Combine roles + users into one table
        return [
          ...(data.adminUsers || []),
          ...(data.adminRoles || []),
        ];
      case "Security Groups": return data.publicRules || [];
      case "EKS Clusters": return data.clusters || [];
      case "App Runner Services": return data.findings || [];
      case "RDS Databases": return data.instances || [];

      default:
        return [];
    }
  };

  // ---------------------------------------------------------
  // 🎨 Style
  // ---------------------------------------------------------
  const styleSheet = (sheet) => {
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell = sheet[cellAddress];
      if (cell) {
        cell.s = {
          fill: { fgColor: { rgb: "FFD7B5" } },
          font: { bold: true },
        };
      }
    }
  };

  // ---------------------------------------------------------
  // 📏 Auto-fit
  // ---------------------------------------------------------
  const autoFit = (sheet, data) => {
    const colWidths = [];
    const rows = Array.isArray(data) ? data : [data];
    const headerRow = Array.isArray(rows[0]) ? rows[0] : Object.keys(rows[0]);

    headerRow.forEach((_, colIndex) => {
      let maxLen = headerRow[colIndex]?.toString().length || 10;
      rows.forEach((row) => {
        const value = Array.isArray(row) ? row[colIndex] : row[headerRow[colIndex]];
        if (value) maxLen = Math.max(maxLen, value.toString().length);
      });
      colWidths.push({ wch: maxLen + 2 });
    });
    sheet["!cols"] = colWidths;
  };

  return (
    <button
      onClick={handleExport}
      style={{
        padding: "12px 16px",
        color: "#e2e8f0",
        border: "none",
        width: "100%",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        textAlign: "left",
        background: "transparent",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.target.style.background = "rgba(59, 130, 246, 0.2)";
        e.target.style.color = "#60a5fa";
        e.target.style.paddingLeft = "20px";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "transparent";
        e.target.style.color = "#e2e8f0";
        e.target.style.paddingLeft = "16px";
      }}
    >
      Download Excel
    </button>
  );
}
