import React from "react";
import AgTable from "../table/AgTable";
import styles from "../../styles/FullAudit.module.css";
import { generateColumnDefs } from "../../utils/auditUtils";

const AuditSection = ({ title, type, data, subSections }) => {
    // ------------------------------------------
    // MULTI-SECTION (e.g. Broken Down by Rule)
    // ------------------------------------------
    if (type === "multi") {
        // Filter out empty subsections to avoid rendering empty cards
        const populatedSubSections = subSections?.filter(sub => sub.data && sub.data.length > 0);

        // If nothing to show at all
        if (!populatedSubSections || populatedSubSections.length === 0) {
            // Optional: For critical sections like VM Security, show a "Safe" card
            if (title === "VM Security Findings" || title === "Firewall Rules") {
                return (
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>{title}</h3>
                        <p className={styles.infoText}>
                            ✅ No high-risk findings detected. Systems appear secure.
                        </p>
                    </div>
                );
            }
            return null;
        }

        return (
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {populatedSubSections.map((sub, idx) => {
                    const colDefs = generateColumnDefs(sub.data);
                    return (
                        <div key={idx} className={styles.subCard}>
                            <h4 className={styles.subHeading}>{sub.title}</h4>
                            <AgTable rowData={sub.data} columnDefs={colDefs} height={350} />
                        </div>
                    );
                })}
            </div>
        );
    }

    // ------------------------------------------
    // SINGLE TABLE SECTION
    // ------------------------------------------
    if (!data || data.length === 0) return null;

    const colDefs = generateColumnDefs(data);

    return (
        <div className={styles.card}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <AgTable rowData={data} columnDefs={colDefs} height={400} />
        </div>
    );
};

export default AuditSection;
