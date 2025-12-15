import React from "react";
import AgTable from "../table/AgTable";
import styles from "../../styles/FullAudit.module.css";
import { generateColumnDefs } from "../../utils/auditUtils";

const AuditSection = ({ title, type, data, subSections }) => {
    // If type is 'multi', we expect subSections to be an array of objects { title, data }
    if (type === "multi") {
        // If no subsections or all are empty, maybe show a "safe" message?
        // But usually the parent filters this out. 
        // If we want to show "No findings" inside the card, we can check here.

        // Check if we have any data to show
        const hasData = subSections && subSections.some(sub => sub.data && sub.data.length > 0);

        if (!hasData) {
            if (title === "VM Security Findings") {
                return (
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>{title}</h3>
                        <p className={styles.infoText}>
                            ✅ No risky findings detected. All checks passed.
                        </p>
                    </div>
                );
            }
            return null;
        }

        return (
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {subSections.map((sub, idx) => {
                    if (!sub.data || sub.data.length === 0) return null;
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

    // Single table type
    if (!data || data.length === 0) return null;

    const colDefs = generateColumnDefs(data);

    return (
        <div className={styles.card}>
            <h3 className={styles.cardTitle}>{title}</h3>
            {/* If it's Owner IAM Roles, it has a specific sub-structure in the original, 
          but we can genericize it or handle it here if we want to keep the "High-Risk..." subtitle.
          For now, we'll just render the table. If we need a subtitle, we can pass it in `data`. 
      */}
            <AgTable rowData={data} columnDefs={colDefs} height={400} />
        </div>
    );
};

export default AuditSection;
