
import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import styles from "../../styles/FullAudit.module.css";

const COLORS = {
  High: "#ef4444", // Tailwind red-500
  Medium: "#f59e0b", // Tailwind amber-500
  Low: "#22c55e", // Tailwind green-500
};

export default function RiskExposureGraph({ serviceName, data: serviceData }) {

  // Calculate Risk Data
  const data = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    if (!serviceData) {
      return [
        { name: "High", value: 0 },
        { name: "Medium", value: 0 },
        { name: "Low", value: 0 },
      ];
    }

    const countRisks = (details) => {
      // 1. VM Scan
      if (serviceName === "VM Scan" && details.vmScan) {
        if (details.vmScan.publicIpScan?.instances?.length) {
          high += details.vmScan.publicIpScan.instances.length;
        }
        const checks = [
          "defaultServiceAccountScan", "shieldedVmProtectionScan",
          "osLoginEnforcementScan", "blockProjectWideSshKeysScan",
          "ipForwardingScan"
        ];
        checks.forEach(check => {
          const checkData = details.vmScan[check];
          if (checkData?.instances && Array.isArray(checkData.instances)) {
            medium += checkData.instances.length;
          } else if (checkData?.affectedInstances && Array.isArray(checkData.affectedInstances)) {
            medium += checkData.affectedInstances.length;
          }
        });
        return;
      }

      // 2. Firewall Rules
      if (serviceName === "Firewall Rules") {
        const publicRules = details.publicRules || [];
        publicRules.forEach(rule => {
          if (rule.exposureRisk && rule.exposureRisk.includes("High")) high++;
          else if (rule.exposureRisk && rule.exposureRisk.includes("Medium")) medium++;
          else if (rule.exposureRisk && rule.exposureRisk.includes("Low")) low++;
          else high++;
        });
        return;
      }

      // 3. Buckets
      if (serviceName === "Buckets") {
        const publicBuckets = details.publicAccessFindings || [];
        high += publicBuckets.length;
        const uniformIssues = details.uniformAccessFindings || [];
        medium += uniformIssues.length;
        return;
      }

      // 4. Owner IAM Roles
      if (serviceName === "Owner IAM Roles") {
        // Path: iamScan.ownerServiceAccountScan.ownerServiceAccounts
        const iamScan = details.iamScan || {};
        const owners = iamScan.ownerServiceAccountScan?.ownerServiceAccounts || [];
        high += owners.length;

        const kmsPublic = iamScan.kmsPublicAccessScan?.publicKeys || [];
        high += kmsPublic.length;

        return;
      }

      // 5. GKE Clusters
      if (serviceName === "GKE Clusters") {
        const findings = details.findings || [];
        medium += findings.length;
        return;
      }

      // 6. SQL Instances
      if (serviceName === "SQL Instances") {
        // cloudSqlScan.requireSslScan
        const sslScan = details.cloudSqlScan?.requireSslScan || [];
        medium += sslScan.length;
        return;
      }

      // 7. Cloud Run / Functions
      if (serviceName === "Cloud Run / Functions") {
        const resources = details.functionsAndRuns || [];
        resources.forEach(res => {
          if (res.ingressSettings === "Allow all traffic" || !res.ingressSettings) medium++;
          else low++;
        });
        if (resources.length === 0 && Array.isArray(details)) {
          medium += details.length;
        }
        return;
      }

      // 8. Load Balancers
      if (serviceName === "Load Balancers") {
        const lbs = details.loadBalancers || [];
        medium += lbs.length;
        return;
      }

      // 9. Big Query
      if (serviceName === "Big Query Scan") {
        const cmekIssues = details.bigQueryScan?.defaultCmekScan || [];
        medium += cmekIssues.length;
        return;
      }

      // 10. Network Scan / Logging Scan (Multi-section)
      if (serviceName === "Network Scan" && details.networkScan) {
        Object.values(details.networkScan).forEach(scan => {
          if (Array.isArray(scan)) medium += scan.length;
        });
        return;
      }

      if (serviceName === "Logging Scan" && details.loggingScan) {
        Object.values(details.loggingScan).forEach(scan => {
          if (Array.isArray(scan)) medium += scan.length;
        });
        return;
      }

      // GENERIC FALLBACK
      if (Array.isArray(details)) {
        medium += details.length;
      } else if (typeof details === "object" && details !== null) {
        Object.values(details).forEach(val => {
          if (Array.isArray(val)) medium += val.length;
          else if (typeof val === "object" && val !== null) {
            Object.values(val).forEach(subVal => {
              if (Array.isArray(subVal)) medium += subVal.length;
            });
          }
        });
      }
    };

    countRisks(serviceData);

    return [
      { name: "High", value: high },
      { name: "Medium", value: medium },
      { name: "Low", value: low },
    ];
  }, [serviceName, serviceData]);

  const totalRisks = data.reduce((acc, curr) => acc + curr.value, 0);

  // If no risks and not a critical service, maybe don't show graph? 
  // Or show "Safe" state. User asked for "add graph in each service", so let's show it.
  // But a 0-0-0 pie chart looks empty. Let's handle 0 case gracefully.

  if (totalRisks === 0) {
    return null;
    /* 
       Alternative: Return a small "Secure" badge or mini-graph?
       For now, returning null to not clutter the UI if there's nothing to show 
       (e.g. empty lists). Or renders a small "No Risks" block.
       Current Preference: Render nothing if no data to visualize, 
       as "No Data" graphs are noise.
    */
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "20px",
      marginBottom: "20px",
      padding: "15px",
      background: "rgba(0,0,0,0.2)",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.05)"
    }}>
      {/* Small Pie Chart */}
      <div style={{ height: "150px", width: "150px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "0.8rem"
              }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h4 style={{ margin: "0 0 5px 0", color: "#e2e8f0", fontSize: "0.95rem" }}>Risk Analysis</h4>
        {data.map((item) => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS[item.name] }}></div>
            <span style={{ color: "#94a3b8" }}>{item.name}:</span>
            <span style={{ color: "#f1f5f9", fontWeight: "600" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
