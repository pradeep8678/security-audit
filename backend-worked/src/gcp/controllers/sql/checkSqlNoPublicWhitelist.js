// sql/checkSqlNoPublicWhitelist.js
const { google } = require("googleapis");

module.exports = async function checkSqlNoPublicWhitelist(auth, projectId) {
  const sql = google.sqladmin({ version: "v1beta4", auth });
  const results = [];

  try {
    const resp = await sql.instances.list({ project: projectId });
    const instances = resp.data.items || [];

    for (const inst of instances) {
      const authorized = inst.settings?.ipConfiguration?.authorizedNetworks || [];

      for (const net of authorized) {
        if (net.value === "0.0.0.0/0") {
          results.push({
            instance: inst.name,
            region: inst.region,
            authorizedNetwork: net.value,
            exposureRisk: "🔴 Critical",
            issue: "Cloud SQL whitelists ALL public IPv4 addresses (0.0.0.0/0).",
            recommendation:
              "Remove 0.0.0.0/0 from authorized networks. Allow only specific IPs or use private IP.",
          });
        }
      }
    }
  } catch (err) {
    results.push({
      error: "Failed to check SQL authorized networks",
      details: err.message,
    });
  }

  return results;
};
