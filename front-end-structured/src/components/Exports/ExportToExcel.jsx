import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ExportToExcel({ auditResult, onClick }) {
  const handleExport = () => {
    console.log("Exporting...");

    if (!auditResult || Object.keys(auditResult).length === 0) {
      alert("No audit data to export!");
      return;
    }

    const wb = XLSX.utils.book_new();

    // -----------------------------------------
    // SUMMARY SHEET
    // -----------------------------------------
    const summaryData = Object.keys(auditResult).map((resource) => ({
      Resource: resource,
      Count: Array.isArray(extractItems(resource))
        ? extractItems(resource).length
        : 0,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    styleSheet(summarySheet);
    autoFit(summarySheet, summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // -----------------------------------------
    // one SHEET PER RESOURCE
    // -----------------------------------------
    Object.keys(auditResult).forEach((resource) => {
      const cleanName = resource.replace(/[\\\/*?:\[\]]/g, " ").substring(0, 31); // Excel sheet limit

      const items = extractItems(resource, auditResult[resource]);

      if (!Array.isArray(items) || items.length === 0) {
        // Skipping empty sheets or creating a "No Data" sheet? 
        // User asked for "every data", so maybe skip empty ones to be clean, 
        // or show "No Data" if it was part of the audit.
        // Let's print a placeholder if it's a known resource type but has no findings.
        const emptySheet = XLSX.utils.aoa_to_sheet([["No high-risk findings or data available"]]);
        styleSheet(emptySheet);
        XLSX.utils.book_append_sheet(wb, emptySheet, cleanName);
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
      XLSX.utils.book_append_sheet(wb, sheet, cleanName);
    });

    // -----------------------------------------
    // DOWNLOAD
    // -----------------------------------------
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "gcp-full-audit.xlsx"
    );

    if (onClick) onClick(); // closes dropdown
  };

  // ---------------------------------------------------------
  // 🧠 Resource Extractor - UPDATED for ALL Resources
  // ---------------------------------------------------------
  const extractItems = (resourceName, resourceData) => {
    if (!resourceData) return [];

    // Helper to find arrays in objects
    const findArrays = (obj) => {
      // If the object itself is an array, return it
      if (Array.isArray(obj)) return obj;

      // If not an object (e.g. null, string), return []
      if (typeof obj !== 'object' || obj === null) return [];

      let allItems = [];

      // Check well-known keys first
      const potentialKeys = ['findings', 'results', 'instances', 'buckets', 'clusters', 'publicRules', 'loadBalancers'];
      for (const key of potentialKeys) {
        if (Array.isArray(obj[key]) && obj[key].length > 0) {
          // Return the first valid primary array we find to avoid mixing widely different data types in one sheet
          // OR concatenate them if they are uniform? 
          // Usually for Excel we want one list. 
          return obj[key];
        }
      }

      // If no well-known keys, try to find ANY array property
      // Or if it's big nested object (like VM Scan which shares key 'vmScan' but is an object of checks)
      // We might want to FLATTEN multiple sub-checks into one list.

      // Special Handling for "VM Scan", "Big Query Scan", "Network Scan", "Logging Scan"
      // which return objects of checks: { check1: [...], check2: [...] }
      if (["VM Scan", "Big Query Scan", "Network Scan", "Logging Scan", "SQL Instances"].includes(resourceName)) {
        // Iterate over all keys (check names)
        Object.values(obj).forEach(val => {
          if (Array.isArray(val)) {
            allItems = [...allItems, ...val];
          } else if (typeof val === 'object' && val !== null) {
            // Try to dig deeper one level (e.g. cloudSqlScan -> requireSslScan)
            Object.values(val).forEach(innerVal => {
              if (Array.isArray(innerVal)) {
                allItems = [...allItems, ...innerVal];
              }
            });
          }
        });
        return allItems;
      }

      return allItems;
    };

    // Specific known mappings (Legacy + Safe Fallbacks)
    switch (resourceName) {
      case "Buckets": return resourceData.buckets || resourceData.uniformAccessFindings || [];
      case "Firewall Rules": return resourceData.publicRules || [];
      case "GKE Clusters": return resourceData.clusters || resourceData.findings || [];
      case "Owner IAM Roles": return resourceData.ownerServiceAccounts || [];
      case "Cloud Run / Functions": return resourceData.functionsAndRuns || [];
      case "Load Balancers": return resourceData.loadBalancers || [];

      default:
        // Generic fallback for "VM Scan", "Logging Scan", etc.
        return findArrays(resourceData);
    }
  };

  // ---------------------------------------------------------
  // 🎨 Style: Header Row Bold + Cell Color
  // ---------------------------------------------------------
  const styleSheet = (sheet) => {
    const range = XLSX.utils.decode_range(sheet["!ref"]);

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell = sheet[cellAddress];

      if (cell) {
        cell.s = {
          fill: { fgColor: { rgb: "FFD7B5" } }, // Light Red/Peach
          font: { bold: true },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }
  };

  // ---------------------------------------------------------
  // 📏 Auto-fit Columns
  // ---------------------------------------------------------
  const autoFit = (sheet, data) => {
    const colWidths = [];

    const rows = Array.isArray(data) ? data : [data];

    const headerRow = Array.isArray(rows[0]) ? rows[0] : Object.keys(rows[0]);

    // Compute width for each column
    headerRow.forEach((_, colIndex) => {
      let maxLen = headerRow[colIndex]?.toString().length || 10;

      rows.forEach((row) => {
        const value =
          Array.isArray(row) ? row[colIndex] : row[headerRow[colIndex]];
        if (value) {
          maxLen = Math.max(maxLen, value.toString().length);
        }
      });

      colWidths.push({ wch: maxLen + 2 }); // +2 padding
    });

    sheet["!cols"] = colWidths;
  };

  return (
    <button
      onClick={handleExport}
      style={{
        padding: "12px 16px",
        color: "#e2e8f0", // Text muted/white
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
        e.target.style.background = "rgba(59, 130, 246, 0.2)"; // Primary glow
        e.target.style.color = "#60a5fa"; // Primary lighter
        e.target.style.paddingLeft = "20px"; // Slide effect
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
