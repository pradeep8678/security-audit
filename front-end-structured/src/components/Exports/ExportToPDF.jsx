import jsPDF from "jspdf";

export default function ExportToPDF({ auditResult, onClick }) {
  const generatePDF = () => {
    if (!auditResult || Object.keys(auditResult).length === 0) {
      alert("No audit data to export!");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    let y = 50;

    /* ======================================================
       TITLE
    ====================================================== */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(25, 55, 145);
    doc.text("GCP Security Audit Report", 40, y);
    y += 35;

    /* ======================================================
       MAIN CONTENT
    ====================================================== */
    Object.keys(auditResult).forEach((resource) => {
      const items = extractItems(resource, auditResult[resource]);

      // Section Heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text(resource, 40, y);
      y += 15;

      // No data
      if (!items || items.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(130);
        doc.text("No data available", 40, y);
        y += 30;
        return;
      }

      // All items inside this resource
      items.forEach((item) => {
        y = renderCard(doc, item, y);

        // Page break
        if (y > 760) {
          doc.addPage();
          y = 50;
        }
      });

      y += 10;
    });

    doc.save("gcp-security-audit.pdf");
    if (onClick) onClick();
  };

  /* ======================================================
       CARD RENDERER (Single Resource Item)
  ====================================================== */
  const renderCard = (doc, item, startY) => {
    let y = startY + 5;
    const usableWidth = 470; // safe wrap width for A4

    // Card Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(`• ${item.name || "Unnamed Resource"}`, 40, y);
    y += 18;

    // Card Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60);

    Object.entries(item).forEach(([key, value]) => {
      if (key === "name") return;

      const text = `${key}: ${clean(value)}`;
      const wrapped = doc.splitTextToSize(text, usableWidth);

      wrapped.forEach((line) => {
        doc.text(line, 60, y);
        y += 13;
      });
    });

    // Divider line
    doc.setDrawColor(210);
    doc.line(40, y, 540, y);

    return y + 12;
  };

  /* ======================================================
       CLEANER: Fix unicode, emojis, objects, arrays
  ====================================================== */
  const clean = (value) => {
    if (!value) return "-";

    const stripUnicode = (str) =>
      str.replace(/[^\x00-\x7F]/g, ""); // removes  and emojis

    if (Array.isArray(value)) {
      return stripUnicode(
        value
          .map((v) =>
            typeof v === "object" ? JSON.stringify(v) : String(v)
          )
          .join(", ")
      );
    }

    if (typeof value === "object") {
      return stripUnicode(
        Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      );
    }

    return stripUnicode(String(value));
  };

  /* ======================================================
       EXTRACT ITEMS FOR EACH RESOURCE TYPE
  ====================================================== */
  /* ======================================================
       EXTRACT ITEMS FOR EACH RESOURCE TYPE (Dynamic)
  ====================================================== */
  const extractItems = (resourceName, resourceData) => {
    if (!resourceData) return [];

    // Duplicate logic from ExportToExcel for consistency
    const findArrays = (obj) => {
      if (Array.isArray(obj)) return obj;
      if (typeof obj !== 'object' || obj === null) return [];

      let allItems = [];
      const potentialKeys = ['findings', 'results', 'instances', 'buckets', 'clusters', 'publicRules', 'loadBalancers'];

      for (const key of potentialKeys) {
        if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
      }

      // Special Handling for Multi-Check Sections
      if (["VM Scan", "Big Query Scan", "Network Scan", "Logging Scan", "SQL Instances"].includes(resourceName)) {
        Object.values(obj).forEach(val => {
          if (Array.isArray(val)) {
            allItems = [...allItems, ...val];
          } else if (typeof val === 'object' && val !== null) {
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

    switch (resourceName) {
      case "Buckets": return resourceData.buckets || resourceData.uniformAccessFindings || [];
      case "Firewall Rules": return resourceData.publicRules || [];
      case "GKE Clusters": return resourceData.clusters || resourceData.findings || [];
      case "Owner IAM Roles": return resourceData.ownerServiceAccounts || [];
      case "Cloud Run / Functions": return resourceData.functionsAndRuns || [];
      case "Load Balancers": return resourceData.loadBalancers || [];
      default: return findArrays(resourceData);
    }
  };

  return (
    <button
      onClick={generatePDF}
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
      Download PDF
    </button>
  );
}
