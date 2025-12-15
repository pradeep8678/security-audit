import { useMemo } from "react";
import { getNested, prettifyScanKey, RESOURCE_MAPPING } from "../utils/auditUtils";

/**
 * Normalizes the raw audit result into a list of sections.
 * Each section has:
 *  - id: string
 *  - title: string
 *  - type: 'single' | 'multi'
 *  - data: array (for single)
 *  - subSections: array (for multi) -> { title, data }
 */
export const useAuditData = (result) => {
    return useMemo(() => {
        if (!result || Object.keys(result).length === 0) return [];

        const sections = [];

        // Helper to add a single section if data exists
        const addSingle = (name, data) => {
            if (Array.isArray(data) && data.length > 0) {
                sections.push({
                    id: name,
                    title: name,
                    type: 'single',
                    data: data
                });
            }
        };

        // Helper to add a multi section
        const addMulti = (name, subSections) => {
            // subSections is [{ title, data }]
            // Filter out empty ones
            const validSubs = subSections.filter(s => s.data && s.data.length > 0);

            // Special case for VM Scan: even if empty, we might want to show "Safe" message.
            // But for generic ones, we might skip.
            // Let's keep the logic consistent with original: VM Scan shows "Safe" if empty.

            if (name === "VM Scan" || validSubs.length > 0) {
                sections.push({
                    id: name,
                    title: name === "VM Scan" ? "VM Security Findings" :
                        name === "Network Scan" ? "Network Security Findings" :
                            name === "Logging Scan" ? "Logging & Monitoring Findings" : name,
                    type: 'multi',
                    subSections: validSubs
                });
            }
        };

        // 1. VM Scan
        if (result["VM Scan"] && result["VM Scan"].vmScan) {
            const vmScan = result["VM Scan"].vmScan;
            const subSections = Object.keys(vmScan).map(k => {
                const rule = vmScan[k];
                const items = rule?.affectedInstances || rule?.instances || [];
                return {
                    title: rule.title || prettifyScanKey(k),
                    data: items
                };
            });
            addMulti("VM Scan", subSections);
        }

        // 2. Network Scan
        if (result["Network Scan"] && result["Network Scan"].networkScan) {
            const ns = result["Network Scan"].networkScan;
            const subSections = Object.keys(ns).map(k => {
                let items = ns[k];
                if (items && !Array.isArray(items)) items = [items];
                return {
                    title: prettifyScanKey(k),
                    data: items || []
                };
            });
            addMulti("Network Scan", subSections);
        }

        // 3. Logging Scan
        if (result["Logging Scan"] && result["Logging Scan"].loggingScan) {
            const ls = result["Logging Scan"].loggingScan;
            const subSections = Object.keys(ls).map(k => {
                let items = ls[k];
                if (items && !Array.isArray(items)) items = [items];
                return {
                    title: prettifyScanKey(k),
                    data: items || []
                };
            });
            addMulti("Logging Scan", subSections);
        }

        // 4. Owner IAM Roles (Special single-ish but has a specific subtitle in original)
        if (result["Owner IAM Roles"]) {
            const items = getNested(result["Owner IAM Roles"], RESOURCE_MAPPING["Owner IAM Roles"]) || [];
            // The original code rendered a "High-Risk Owner Role Assignments" sub-card.
            // We can treat it as a multi-section with one subsection to preserve that UI,
            // or just a single section. 
            // Let's do multi to keep the exact UI structure (card -> subcard -> title).
            if (items.length > 0) {
                addMulti("Owner IAM Roles", [{
                    title: "High-Risk Owner Role Assignments",
                    data: items
                }]);
            }
        }

        // 5. General Resources (Buckets, Firewall, etc.)
        const standardResources = [
            "Buckets",
            "Firewall Rules",
            "GKE Clusters",
            "SQL Instances",
            "Cloud Run / Functions",
            "Load Balancers",
            "Big Query Scan"
        ];

        standardResources.forEach(resName => {
            if (result[resName]) {
                const path = RESOURCE_MAPPING[resName];
                let items;
                if (path.includes(".")) {
                    items = getNested(result[resName], path);
                } else {
                    items = result[resName][path];
                }
                addSingle(resName, items);
            }
        });

        return sections;

    }, [result]);
};
