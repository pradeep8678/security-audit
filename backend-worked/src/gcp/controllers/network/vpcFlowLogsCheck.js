// networkRules/vpcFlowLogsCheck.js
const { google } = require("googleapis");

/**
 * 🔍 Ensure VPC Flow Logs Are Enabled for All Subnets
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - Subnets without VPC Flow Logs enabled
 */
async function checkVpcFlowLogs(keyFile) {
  const compute = google.compute("v1");
  const findings = [];

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;

    // Get all subnetworks in the project (across all regions)
    const res = await compute.subnetworks.aggregatedList({
      project: projectId,
    });

    const subnetworks = res.data.items || {};

    // Loop through each region's subnetwork list
    Object.values(subnetworks).forEach((regionData) => {
      const subs = regionData.subnetworks || [];

      subs.forEach((subnet) => {
        const flowLogsEnabled = subnet.enableFlowLogs === true;

        if (!flowLogsEnabled) {
          findings.push({
            subnetName: subnet.name,
            network: subnet.network,
            region: subnet.region,
            access: "vpc-flow-logs-disabled",
            exposureRisk: "Medium",
            recommendation: `Enable VPC Flow Logs for subnet "${subnet.name}" to improve visibility, security analysis, and incident response.`,
          });
        }
      });
    });
  } catch (err) {
    console.error("Error checking VPC Flow Logs:", err.message);
    throw new Error("Failed to check VPC Flow Logs");
  }

  return findings;
}

// ✅ Export function directly
module.exports = checkVpcFlowLogs;
