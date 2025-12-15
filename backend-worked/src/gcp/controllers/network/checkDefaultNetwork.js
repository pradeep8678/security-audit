const { google } = require("googleapis");

/**
 * 🚫 Ensure that the Default VPC Network Does Not Exist
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - List of vulnerabilities
 */
async function checkDefaultNetwork(keyFile, passedAuthClient = null) {
  try {
    let authClient;
    if (passedAuthClient) {
      authClient = passedAuthClient;
    } else {
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      authClient = await auth.getClient();
    }

    const compute = google.compute("v1");
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;

    // Fetch all VPC networks
    const networksRes = await compute.networks.list({ project: projectId });
    const networks = networksRes.data.items || [];

    const results = [];

    for (const net of networks) {
      if (net.name === "default") {
        results.push({
          name: net.name,
          autoCreateSubnetworks: net.autoCreateSubnetworks,
          exposure: "default-network-present",
          exposureRisk: "🟠 Medium",
          recommendation:
            `Delete the default network in project "${projectId}". ` +
            `Default networks come with overly permissive firewall rules ` +
            `and increase attack surface. Create custom VPCs with least-privileged controls.`,
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Error checking default VPC network:", err.message);
    throw new Error("Failed to check default VPC network");
  }
}

// ✅ Export function directly
module.exports = checkDefaultNetwork;
