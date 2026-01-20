import React from "react";
import AgTable from "../table/AgTable";
import SeverityPieChart from "../Charts/SeverityPieChart";
import styles from "../../styles/FullAudit.module.css";
import { generateColumnDefs } from "../../utils/auditUtils";

// Helper to count severities
const countSeverities = (data) => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    if (!data) return counts;

    data.forEach(item => {
        // Check multiple common field names for severity
        // The screenshot showed "EXPOSURE RISK", so 'exposureRisk' is the likely key.
        // We also check others to be safe.
        const sev = (
            item.exposureRisk ||
            item.severity ||
            item.risk ||
            item.rating ||
            item.priority ||
            item.riskLevel ||
            ""
        ).toString();

        if (/critical/i.test(sev)) counts.Critical++;
        else if (/high/i.test(sev)) counts.High++;
        else if (/medium/i.test(sev)) counts.Medium++;
        else if (/low/i.test(sev)) counts.Low++;
    });
    return counts;
};

const AuditSection = ({ title, type, data, subSections }) => {
    // Calculate stats for the chart
    let chartData = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    // Aggregate counts from all subsections or single data source
    if (type === "multi" && subSections) {
        subSections.forEach(sub => {
            if (sub.data) {
                const subCounts = countSeverities(sub.data);
                chartData.Critical += subCounts.Critical;
                chartData.High += subCounts.High;
                chartData.Medium += subCounts.Medium;
                chartData.Low += subCounts.Low;
            }
        });
    } else if (data) {
        chartData = countSeverities(data);
    }

    // Determine if we have anything to show
    const totalFindings = chartData.Critical + chartData.High + chartData.Medium + chartData.Low;
    const hasData = totalFindings > 0;

    // ------------------------------------------
    // MAIN RENDER
    // ------------------------------------------
    return (
        <div className={styles.card}>
            <div className={styles.cardHeaderRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {/* Optional: Add badge count? */}
            </div>

            <div className={styles.cardContent} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

                {/* CHART COLUMN - Only show if we have data to chart */}
                {hasData && (
                    <div style={{
                        flex: '0 0 320px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '12px',
                        padding: '10px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'sticky',
                        top: '20px',
                        alignSelf: 'flex-start'
                    }}>
                        <h4 style={{ textAlign: 'center', marginBottom: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>Severity Distribution</h4>
                        <SeverityPieChart data={chartData} />
                    </div>
                )}

                {/* DATA COLUMN */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    {/* Multi-Section Logic */}
                    {type === "multi" ? (
                        subSections?.filter(sub => sub.data && sub.data.length > 0).length === 0 ? (
                            // Safe State - nothing found in any subsection
                            (title === "VM Scan" || title === "Firewall Rules") ? (
                                <p className={styles.infoText}>✅ No high-risk findings detected. Systems appear secure.</p>
                            ) : null
                        ) : (
                            subSections.filter(sub => sub.data && sub.data.length > 0).map((sub, idx) => {
                                const colDefs = generateColumnDefs(sub.data);
                                return (
                                    <div key={idx} className={styles.subCard}>
                                        <h4 className={styles.subHeading}>{sub.title}</h4>
                                        <AgTable rowData={sub.data} columnDefs={colDefs} height={350} />
                                    </div>
                                );
                            })
                        )
                    ) : (
                        // Single Table Logic
                        data && data.length > 0 && (
                            <AgTable rowData={data} columnDefs={generateColumnDefs(data)} height={400} />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditSection;
