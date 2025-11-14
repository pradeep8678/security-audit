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
    // ONE SHEET PER RESOURCE
    // -----------------------------------------
    Object.keys(auditResult).forEach((resource) => {
      const cleanName = resource.replace(/[\\\/*?:\[\]]/g, " "); // Excel-safe

      const items = extractItems(resource);

      if (!Array.isArray(items) || items.length === 0) {
        const emptySheet = XLSX.utils.aoa_to_sheet([["No data available"]]);
        styleSheet(emptySheet);
        XLSX.utils.book_append_sheet(wb, emptySheet, cleanName);
        return;
      }

      const headers = Object.keys(items[0]);
      const sheetData = [headers];

      items.forEach((item) => {
        const row = headers.map((h) => item[h] ?? "");
        sheetData.push(row);
      });

      const sheet = XLSX.utils.aoa_to_sheet(sheetData);
      styleSheet(sheet);
      autoFit(sheet, sheetData);
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
  // 🧠 Resource Extractor
  // ---------------------------------------------------------
  const extractItems = (resource) => {
    if (!auditResult[resource]) return [];

    switch (resource) {
      case "Buckets":
        return auditResult[resource].buckets || [];
      case "Firewall Rules":
        return auditResult[resource].publicRules || [];
      case "GKE Clusters":
        return auditResult[resource].clusters || [];
      case "SQL Instances":
        return auditResult[resource].instances || [];
      case "Cloud Run / Functions":
        return auditResult[resource].functionsAndRuns || [];
      case "Load Balancers":
        return auditResult[resource].loadBalancers || [];
      case "Owner IAM Roles":
        return auditResult[resource].ownerServiceAccounts || [];
      case "VM Instances":
        return auditResult[resource].instances || [];
      default:
        return [];
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
        padding: "10px 15px",
        background: "#d9485f",
        color: "white",
        border: "none",
        width: "100%",
        borderRadius: "0px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Download Excel
    </button>
  );
}
