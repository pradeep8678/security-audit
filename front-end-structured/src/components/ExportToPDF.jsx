import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportToPDF({ auditResult, onClick }) {
  const generatePDF = () => {
    if (!auditResult || Object.keys(auditResult).length === 0) {
      alert("No audit data to export!");
      return;
    }

    // LANDSCAPE MODE + A3 WIDE PAGE
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a3",
    });

    let y = 40;

    // MAIN TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("GCP Full Security Audit Report", 40, y);
    y += 30;

    // Loop through all resources
    Object.keys(auditResult).forEach((resource) => {
      const block = auditResult[resource];
      if (!block || typeof block !== "object") return;

      const items = extractItems(resource, block);

      // Section Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(resource, 40, y);
      y += 12;

      if (!items || items.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("No data available", 40, y);
        y += 25;
        return;
      }

      const headers = Object.keys(items[0]);
      const rows = items.map((row) =>
        headers.map((h) => formatCell(row[h]))
      );

      autoTable(doc, {
        startY: y,
        head: [headers],
        body: rows,
        theme: "grid",
        tableWidth: "auto",

        styles: {
          fontSize: 10,
          cellPadding: 4,
          overflow: "linebreak",
          valign: "middle",
        },

        headStyles: {
          fillColor: [217, 72, 95],
          textColor: 255,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },

        margin: { left: 40, right: 40 },

        didDrawPage: () => {
          // Footer Page Number
          const page = doc.internal.getCurrentPageInfo().pageNumber;
          doc.setFontSize(10);
          doc.text(`Page ${page}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 20);
        },
      });

      y = doc.lastAutoTable.finalY + 40;

      // Auto new page
      if (y > doc.internal.pageSize.height - 80) {
        doc.addPage();
        y = 40;
      }
    });

    doc.save("gcp-full-audit.pdf");
    if (onClick) onClick();
  };

  // Format cells: pretty print objects & long content
  const formatCell = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Extract resource items
  const extractItems = (resource, block) => {
    switch (resource) {
      case "Buckets":
        return block.buckets || [];
      case "Firewall Rules":
        return block.publicRules || [];
      case "GKE Clusters":
        return block.clusters || [];
      case "SQL Instances":
        return block.instances || [];
      case "Cloud Run / Functions":
        return block.functionsAndRuns || [];
      case "Load Balancers":
        return block.loadBalancers || [];
      case "Owner IAM Roles":
        return block.ownerServiceAccounts || [];
      case "VM Instances":
        return block.instances || [];
      default:
        return [];
    }
  };

  return (
    <div
      style={{ padding: "10px", cursor: "pointer" }}
      onClick={generatePDF}
    >
      Download PDF
    </div>
  );
}
