import { useState, useMemo } from "react";
import client from "../../api/client";
import ExportToExcel from "../../components/Exports/ExportToExcel";
import ExportToPDF from "../../components/Exports/ExportToPDF";
import AuditSection from "../../components/Audit/AuditSection";
import styles from "../../styles/FullAudit.module.css";
import { RESOURCE_LIST } from "../../utils/auditUtils";
import { useAuditData } from "../../hooks/useAuditData";

export default function FullAudit({ file }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [error, setError] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Use the custom hook to normalize data
  // sections is an array of { id, title, type, data, subSections }
  const sections = useAuditData(result);

  // Map for O(1) access during render loop if we want to preserve RESOURCE_LIST order
  const sectionsMap = useMemo(() => {
    return sections.reduce((acc, sec) => {
      acc[sec.id] = sec;
      return acc;
    }, {});
  }, [sections]);

  // Run Full Audit
  const handleFullAudit = async () => {
    if (!file) {
      alert("Please upload your GCP Service Account JSON file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult({});
    setSelectedResource(null);

    try {
      const formData = new FormData();
      formData.append("keyFile", file);

      const res = await client.post("/full-audit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const normalizedResult = {};
      if (res.data?.results) {
        res.data.results.forEach((item) => {
          normalizedResult[item.name] = item.result;
        });
      }

      setResult(normalizedResult);
    } catch (err) {
      console.error("Full audit error:", err);
      setError(err.response?.data?.detail || "Full audit failed");
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

            {RESOURCE_LIST.map((res) => (
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
          {RESOURCE_LIST.map(resId => {
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
