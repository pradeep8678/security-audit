// // FullAudit.jsx (Updated with conditional filter rendering like AWS)

// import { useState } from "react";
// import client from "../../api/client";
// import ExportToExcel from "../../components/Exports/ExportToExcel";
// import ExportToPDF from "../../components/Exports/ExportToPDF";
// import styles from "../../styles/FullAudit.module.css";

// export default function FullAudit({ file }) {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState({});
//   const [error, setError] = useState("");
//   const [selectedResource, setSelectedResource] = useState(null);
//   const [showDropdown, setShowDropdown] = useState(false);

//   const resourceList = [
//     "Buckets",
//     "Firewall Rules",
//     "GKE Clusters",
//     "SQL Instances",
//     "Cloud Run / Functions",
//     "Load Balancers",
//     "Owner IAM Roles",
//     "VM Instances",
//   ];

//   const readable = (value) => {
//     if (Array.isArray(value)) return value.map((v) => readable(v)).join(", ");
//     if (typeof value === "object" && value !== null)
//       return Object.entries(value)
//         .map(([k, v]) => `${k}: ${readable(v)}`)
//         .join(", ");
//     return value;
//   };

//   const handleFullAudit = async () => {
//     if (!file) {
//       alert("Please upload your GCP Service Account JSON file first.");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     setResult({});

//     try {
//       const formData = new FormData();
//       formData.append("keyFile", file);

//       const res = await client.post("/full-audit", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const normalizedResult = {};
//       res.data.results.forEach((item) => {
//         normalizedResult[item.name] = item.result;
//       });

//       setResult(normalizedResult);
//     } catch (err) {
//       console.error("Full audit error:", err);
//       setError(err.response?.data?.detail || "Full audit failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addRecommendation = (items, name) => {
//     return items.map((item) => {
//       if (item.recommendation) return item;

//       let rec = "";

//       if (name === "Firewall Rules") {
//         const src = item.sourceRanges?.join(", ") || "unknown";
//         rec = `This firewall rule is public with source ${src}. Make it private and restrict CIDR.`;
//       } else if (name === "VM Instances") {
//         const ip = item.publicIP || "unknown";
//         rec = `This VM is publicly accessible with IP ${ip}. Remove public IP and place behind a private network.`;
//       } else if (name === "GKE Clusters") {
//         const ep = item.endpoint || "unknown";
//         rec = `GKE endpoint ${ep} is public. Enable private clusters and restrict control plane access.`;
//       } else if (name === "Cloud Run / Functions") {
//         const url = item.url || item.name || "service";
//         rec = `The Cloud Run/Function ${url} is public. Restrict ingress and disable unauthenticated access.`;
//       } else if (name === "Buckets") {
//         rec = "Bucket appears private. Ensure uniform bucket-level access and IAM restrictions.";
//       } else if (name === "SQL Instances") {
//         rec = "SQL instance should stay private. Ensure public IP is disabled and use private service networking.";
//       } else if (name === "Load Balancers") {
//         rec = "Review LB frontends and ensure only intended services are publicly reachable.";
//       } else if (name === "Owner IAM Roles") {
//         rec = "Owner role is highly privileged. Replace with least-privilege IAM roles.";
//       }

//       return { ...item, recommendation: rec };
//     });
//   };

//   const renderTable = (items, name) => {
//     if (!items || items.length === 0)
//       return <p className={styles.noData}>No data available</p>;

//     const enriched = addRecommendation(items, name);
//     const headers = [...new Set([...Object.keys(enriched[0])])];

//     return (
//       <table className={styles.table}>
//         <thead>
//           <tr>
//             {headers.map((key) => (
//               <th key={key}>{key}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {enriched.map((item, idx) => (
//             <tr key={idx}>
//               {headers.map((key) => (
//                 <td key={key}>{readable(item[key] ?? "-")}</td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     );
//   };

//   const renderResource = (name) => {
//     if (!result[name]) return null;

//     const mapping = {
//       Buckets: "buckets",
//       "Firewall Rules": "publicRules",
//       "GKE Clusters": "clusters",
//       "SQL Instances": "instances",
//       "Cloud Run / Functions": "functionsAndRuns",
//       "Load Balancers": "loadBalancers",
//       "Owner IAM Roles": "ownerServiceAccounts",
//       "VM Instances": "instances",
//     };

//     const field = mapping[name];

//     return (
//       <div className={styles.card}>
//         <h3 className={styles.cardTitle}>{name}</h3>
//         {field && renderTable(result[name][field], name)}
//       </div>
//     );
//   };

//   // ⭐ NEW — SAME LOGIC AS AWS
//   const allDataLoaded =
//     Object.keys(result).length === resourceList.length && !loading;

//   return (
//     <div className={styles.container}>
//       <div className={allDataLoaded ? styles.subbox : styles.subboxCompact}>
//         <div className={styles.center}>
//           <button
//             onClick={handleFullAudit}
//             disabled={loading}
//             className={loading ? styles.btnDisabled : styles.btnPrimary}
//           >
//             {loading ? "Running..." : "Run GCP Audit"}
//           </button>

//           {allDataLoaded && (
//             <div className={styles.dropdownWrapper}>
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className={styles.btnSuccess}
//               >
//                 Download ▼
//               </button>

//               {showDropdown && (
//                 <div className={styles.dropdownMenu}>
//                   <ExportToExcel auditResult={result} />
//                   <ExportToPDF auditResult={result} />
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {error && <p className={styles.error}>{error}</p>}

//         {allDataLoaded && (
//           <div className={styles.selectorWrapper}>
//             <div
//               onClick={() => setSelectedResource(null)}
//               className={
//                 selectedResource === null ? styles.selectedChip : styles.chip
//               }
//             >
//               All
//             </div>

//             {resourceList.map((res) => (
//               <div
//                 key={res}
//                 onClick={() => setSelectedResource(res)}
//                 className={
//                   selectedResource === res ? styles.selectedChip : styles.chip
//                 }
//               >
//                 {res}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {allDataLoaded &&
//         (selectedResource
//           ? renderResource(selectedResource)
//           : resourceList.map((res) => renderResource(res)))}
//     </div>
//   );
// }


import { useState } from "react";
import client from "../../api/client";
import ExportToExcel from "../../components/Exports/ExportToExcel";
import ExportToPDF from "../../components/Exports/ExportToPDF";
import AgTable from "../../components/table/AgTable";
import styles from "../../styles/FullAudit.module.css";

// Auto-generate column definitions from API data
const generateColumnDefs = (data = []) => {
  if (!data.length) return [];

  const allKeys = new Set();
  data.forEach((row) => Object.keys(row).forEach((key) => allKeys.add(key)));

  return [...allKeys].map((key) => ({
    headerName: key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toUpperCase(),
    field: key,
    minWidth: 180,
    sortable: true,
    filter: true,

    // FORCE text instead of checkbox
    cellRenderer: (params) => {
      const val = params.value;

      // Boolean values → show "True" / "False"
      if (typeof val === "boolean") {
        return val ? "True" : "False";
      }

      // Clean readable formatting for ALLOWED field
      if (key === "allowed" && Array.isArray(val)) {
        return val
          .map((obj) => {
            const proto = obj.IPProtocol?.toUpperCase() || "";
            const ports = obj.ports ? `(${obj.ports.join(",")})` : "";
            return `${proto} ${ports}`.trim();
          })
          .join(" | ");
      }

      // Arrays → simple readable output
      if (Array.isArray(val)) return val.join(", ");

      // Objects → clean 1-line JSON
      if (typeof val === "object" && val !== null) {
        return JSON.stringify(val);
      }

      return val ?? "-";
    },

    cellStyle: { whiteSpace: "nowrap" },
    autoHeight: true,
    wrapText: false,
  }));
};




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
    "VM Scan",
  ];


  // Run audit
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

      // Normalize results for easier access
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

  // Mapping API fields to table fields
  const mapping = {
    Buckets: "buckets",
    "Firewall Rules": "publicRules",
    "GKE Clusters": "clusters",
    "SQL Instances": "instances",
    "Cloud Run / Functions": "functionsAndRuns",
    "Load Balancers": "loadBalancers",
    "Owner IAM Roles": "ownerServiceAccounts",
    "VM Scan": "vmScan",

  };

  const renderTable = (name) => {
    if (!result[name]) return null;

    const field = mapping[name];

    // Handle VM SCAN (multiple rule tables inside)
    if (name === "VM Scan") {

      const vmScan = result[name].vmScan;
      if (!vmScan) return <p>No VM data found</p>;

      return (
        <div className={styles.card}>

          <h3 className={styles.cardTitle}>VM Security Findings</h3>

          {Object.keys(vmScan).map((ruleKey, idx) => {
            const rule = vmScan[ruleKey];
            const items = rule.affectedInstances || rule.instances;

            if (!items || items.length === 0) return null;

            const colDefs = generateColumnDefs(items);

            return (
              <div key={ruleKey} className={styles.subCard}>
                <h4 className={styles.subHeading}>{rule.title}</h4>

                <AgTable rowData={items} columnDefs={colDefs} height={300} />
              </div>
            );
          })}
        </div>
      );
    }

    if (name === "Owner IAM Roles") {
      const iamScan = result[name].iamScan;
      if (!iamScan) return <p>No IAM scan data found</p>;

      // Each sub-scan is treated like a "rule" similar to VM Scan
      const rules = [
        { title: "Owner Service Accounts", items: iamScan.ownerServiceAccountScan?.ownerServiceAccounts },
        { title: "KMS Public Access", items: iamScan.kmsPublicAccessScan },
        { title: "KMS Rotation", items: iamScan.kmsRotationScan },
        { title: "KMS Separation of Duties", items: iamScan.kmsSeparationOfDutiesScan },
        { title: "Project Level Service Roles", items: iamScan.projectLevelServiceRolesScan },
        { title: "Service Account Key Rotation (90 days)", items: iamScan.saKeyRotation90DaysScan },
        { title: "User Managed Keys", items: iamScan.userManagedKeysScan },
      ];

      return (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Owner IAM Roles Security Findings</h3>

          {rules.map((rule, idx) => {
            if (!rule.items || rule.items.length === 0) return null;

            const colDefs = generateColumnDefs(rule.items);

            return (
              <div key={idx} className={styles.subCard}>
                <h4 className={styles.subHeading}>{rule.title}</h4>
                <AgTable rowData={rule.items} columnDefs={colDefs} height={300} />
              </div>
            );
          })}
        </div>
      );
    }


    // Normal resources
    const items = result[name][field];
    if (!items || items.length === 0)
      return null;

    const colDefs = generateColumnDefs(items);

    return (
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{name}</h3>
        <AgTable rowData={items} columnDefs={colDefs} height={400} />
      </div>
    );
  };

  const allDataLoaded =
    Object.keys(result).length === resourceList.length && !loading;

  return (
    <div className={styles.container}>
      <div className={allDataLoaded ? styles.subbox : styles.subboxCompact}>
        <div className={styles.center}>
          <button
            onClick={handleFullAudit}
            disabled={loading}
            className={loading ? styles.btnDisabled : styles.btnPrimary}
          >
            {loading ? "Running..." : "Run GCP Audit"}
          </button>

          {allDataLoaded && (
            <div className={styles.dropdownWrapper}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={styles.btnSuccess}
              >
                Download ▼
              </button>

              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <ExportToExcel auditResult={result} />
                  <ExportToPDF auditResult={result} />
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {allDataLoaded && (
          <div className={styles.selectorWrapper}>
            <div
              onClick={() => setSelectedResource(null)}
              className={
                selectedResource === null ? styles.selectedChip : styles.chip
              }
            >
              All
            </div>

            {resourceList.map((res) => (
              <div
                key={res}
                onClick={() => setSelectedResource(res)}
                className={
                  selectedResource === res ? styles.selectedChip : styles.chip
                }
              >
                {res}
              </div>
            ))}
          </div>
        )}
      </div>

      {allDataLoaded &&
        (selectedResource
          ? renderTable(selectedResource)
          : resourceList.map((res) => renderTable(res)))}
    </div>
  );
}
