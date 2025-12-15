// sql/checkSqlNoPublicIp.js
const { google } = require("googleapis");

module.exports = async function checkSqlNoPublicIp(auth, projectId) {
  const sql = google.sqladmin({ version: "v1beta4", auth });
  const results = [];

  try {
    const resp = await sql.instances.list({ project: projectId });
    const instances = resp.data.items || [];

    for (const inst of instances) {
      const ipConfig = inst.settings?.ipConfiguration;

      if (ipConfig?.ipv4Enabled) {
        results.push({
          instance: inst.name,
          region: inst.region,
          exposureRisk: "🔴 High",
          issue: "Cloud SQL instance has Public IP enabled.",
          recommendation:
            "Disable public IP. Use Private IP (VPC networks) for secure access.",
        });
      }
    }
  } catch (err) {
    results.push({
      error: "Failed to check SQL public IP",
      details: err.message,
    });
  }

  return results;
};
