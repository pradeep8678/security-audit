const { google } = require("googleapis");

/**
 * 🚫 Ensure Legacy Networks Do Not Exist for Older GCP Projects
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - List of legacy network vulnerabilities
 */
async function checkLegacyNetworks(keyFile, passedAuthClient = null) {
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

    const networksRes = await compute.networks.list({ project: projectId });
    const networks = networksRes.data.items || [];

    const results = [];

    for (const net of networks) {
      const isLegacy =
        net.IPv4Range &&
        (!net.subnetworks || net.subnetworks.length === 0) &&
        !net.autoCreateSubnetworks;

      if (isLegacy) {
        results.push({
          name: net.name,
          type: "LEGACY",
          ipv4Range: net.IPv4Range,
          access: "legacy-network",
          exposureRisk: "🟠 Medium",
          recommendation: `Legacy network "${net.name}" exists in project "${projectId}". ` +
            `Legacy networks are flat networks with weaker security boundaries. ` +
            `Create a custom VPC and migrate workloads. Delete this legacy network afterward.`,
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Error checking legacy networks:", err.message);
    throw new Error("Failed to check legacy networks");
  }
}

// ✅ Export the function directly
module.exports = checkLegacyNetworks;
