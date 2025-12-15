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

    /* ==========================
       TITLE
    ========================== */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(25, 55, 145);
    doc.text("Security Audit Report", 40, y);
    y += 35;

    /* ==========================
       EACH RESOURCE SECTION
    ========================== */
    Object.keys(auditResult).forEach((resource) => {
      const items = extractItems(resource, auditResult[resource]);

      // Section Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text(resource, 40, y);
      y += 18;

      // Empty resource
      if (!items || items.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(130);
        doc.text("No data available", 40, y);
        y += 30;
        return;
      }

      // Render each resource item
      items.forEach((item) => {
        y = renderCard(doc, item, y);

        if (y > 760) {
          doc.addPage();
          y = 50;
        }
      });

      y += 10;
    });

    doc.save("security-audit.pdf");
    if (onClick) onClick();
  };

  /* ==========================
       CARD RENDERER
  ========================== */
  const renderCard = (doc, item, startY) => {
    let y = startY + 5;
    const usableWidth = 470;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(`• ${item.name || item.instanceId || "Resource"}`, 40, y);
    y += 16;

    // Body
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

    // Divider
    doc.setDrawColor(210);
    doc.line(40, y, 540, y);

    return y + 10;
  };

  /* ==========================
       CLEAN STRING
  ========================== */
  const clean = (value) => {
    if (!value) return "-";

    const stripUnicode = (str) =>
      str.replace(/[^\x00-\x7F]/g, "");

    if (Array.isArray(value))
      return stripUnicode(value.join(", "));

    if (typeof value === "object")
      return stripUnicode(
        Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      );

    return stripUnicode(String(value));
  };

  /* ==========================
       FIXED Extractor (AWS + GCP)
  ========================== */
  /* ======================================================
       FIXED Extractor (AWS + GCP)
  ====================================================== */
  const extractItems = (resource, block) => {
    if (!block) return [];

    switch (resource) {
      /* -------- AWS RESOURCES -------- */
      case "EC2 Instances": return block.instances || [];
      case "S3 Buckets": return block.buckets || [];
      case "Load Balancers": return block.loadBalancers || [];
      case "IAM Users & Roles":
        return [
          ...(block.adminUsers || []),
          ...(block.adminRoles || []),
        ];
      case "Security Groups": return block.publicRules || [];
      case "EKS Clusters": return block.clusters || [];
      case "App Runner Services": return block.findings || [];
      case "RDS Databases": return block.instances || [];

      /* -------- GCP RESOURCES -------- */
      case "Buckets": return block.buckets || [];
      case "Firewall Rules": return block.publicRules || [];
      case "GKE Clusters": return block.clusters || [];
      case "SQL Instances": return block.instances || [];
      case "Cloud Run / Functions": return block.functionsAndRuns || [];
      case "Owner IAM Roles": return block.ownerServiceAccounts || [];
      case "VM Instances": return block.instances || [];

      default:
        // Dynamic fallback
        if (Array.isArray(block)) return block;
        if (typeof block === 'object' && block !== null) {
          const keys = ['findings', 'results', 'instances', 'buckets', 'clusters', 'publicRules'];
          for (const key of keys) {
            if (Array.isArray(block[key]) && block[key].length > 0) return block[key];
          }
        }
        return [];
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
