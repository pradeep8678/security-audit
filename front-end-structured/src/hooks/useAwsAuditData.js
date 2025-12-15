import { useMemo } from "react";

export const useAwsAuditData = (result) => {
    return useMemo(() => {
        if (!result || Object.keys(result).length === 0) return [];

        const sections = [];

        // Helper to add data
        const addSection = (id, title, data, type = "single", subSections = []) => {
            if (type === "single") {
                if (Array.isArray(data) && data.length > 0) {
                    sections.push({ id, title, type: "single", data });
                }
            } else if (type === "multi") {
                const validSubs = subSections.filter(s => s.data && s.data.length > 0);
                if (validSubs.length > 0) {
                    sections.push({ id, title, type: "multi", subSections: validSubs });
                }
            }
        };

        // 1. EC2 Instances
        if (result["EC2 Instances"]) {
            addSection("EC2 Instances", "EC2 Instances", result["EC2 Instances"].instances);
        }

        // 2. S3 Buckets
        if (result["S3 Buckets"]) {
            addSection("S3 Buckets", "S3 Buckets", result["S3 Buckets"].buckets);
        }

        // 3. Load Balancers
        if (result["Load Balancers"]) {
            addSection("Load Balancers", "Load Balancers", result["Load Balancers"].loadBalancers);
        }

        // 4. IAM Users & Roles (Multi)
        if (result["IAM Users & Roles"]) {
            const users = result["IAM Users & Roles"].adminUsers || [];
            const roles = result["IAM Users & Roles"].adminRoles || [];

            addSection("IAM Users & Roles", "IAM Identity Findings", null, "multi", [
                { title: "Admin Users", data: users },
                { title: "Admin Roles", data: roles }
            ]);
        }

        // 5. Security Groups
        if (result["Security Groups"]) {
            addSection("Security Groups", "Security Groups", result["Security Groups"].publicRules);
        }

        // 6. EKS Clusters
        if (result["EKS Clusters"]) {
            addSection("EKS Clusters", "EKS Clusters", result["EKS Clusters"].clusters);
        }

        // 7. App Runner Services
        if (result["App Runner Services"]) {
            addSection("App Runner Services", "App Runner Services", result["App Runner Services"].findings);
        }

        // 8. RDS Databases
        if (result["RDS Databases"]) {
            addSection("RDS Databases", "RDS Databases", result["RDS Databases"].instances);
        }

        return sections;

    }, [result]);
};
