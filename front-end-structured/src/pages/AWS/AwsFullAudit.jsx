// src/pages/aws/AwsFullAudit.jsx
import { useState, useMemo } from "react";
import { runAwsFullAudit } from "../../api/aws";
import ExportToExcel from "../../components/Exports/ExportToExcelAws";
import ExportToPDF from "../../components/Exports/ExportToPDFAWS";
import AuditSection from "../../components/Audit/AuditSection";
import styles from "../../styles/FullAudit.module.css";
import { useAwsAuditData } from "../../hooks/useAwsAuditData";

const RESOURCE_LIST_AWS = [
  "EC2 Instances",
  "S3 Buckets",
  "Load Balancers",
  "IAM Users & Roles",
  "Security Groups",
  "EKS Clusters",
  "App Runner Services",
  "RDS Databases",
];

export default function AwsFullAudit({ credentials }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [error, setError] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Use the custom hook to normalize data
  const sections = useAwsAuditData(result);

  // Map for O(1) access during render loop
  const sectionsMap = useMemo(() => {
    return sections.reduce((acc, sec) => {
      acc[sec.id] = sec;
      return acc;
    }, {});
  }, [sections]);

  const handleFullAudit = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      alert("Please enter AWS credentials first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult({});
    setSelectedResource(null);

    try {
      const data = await runAwsFullAudit(
        credentials.accessKeyId,
        credentials.secretAccessKey
      );

      const normalized = {};
      // Handle both formats if API changes: { results: [] } or just {}
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((item) => {
          if (item.success) normalized[item.name] = item.result;
          else normalized[item.name] = { error: item.error };
        });
      } else {
        // If data came back directly as object (fallback)
        Object.assign(normalized, data);
      }

      setResult(normalized);
    } catch (err) {
      setError("AWS Full Audit Failed. Check console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const allDataLoaded = Object.keys(result).length > 0 && !loading;

  return (
    <div className={styles.container}>
      {/* Control Panel: Run Button & Export */}
      <div className={allDataLoaded ? styles.subbox : styles.subboxCompact}>
        <div className={styles.center}>
          <button
            onClick={handleFullAudit}
            disabled={loading}
            className={loading ? styles.btnDisabled : styles.btnPrimary}
          >
            {loading ? (
              <div className={styles.loadingFlex}>
                <span className={styles.loader}></span>
                <span>Running Scan...</span>
              </div>
            ) : (
              "Run AWS Audit"
            )}
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

        {/* Filter Chips */}
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

            {RESOURCE_LIST_AWS.map((res) => (
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

      {/* Render Results */}
      {allDataLoaded && (
        <div className={styles.resultsContainer}>
          {RESOURCE_LIST_AWS.map(resId => {
            // Filter by selection
            if (selectedResource && selectedResource !== resId) return null;

            const sectionData = sectionsMap[resId];
            if (!sectionData) return null;

            return <AuditSection key={resId} {...sectionData} />;
          })}
        </div>
      )}
    </div>
  );
}
