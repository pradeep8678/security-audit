// sql/checkSqlRequireSsl.js
const { google } = require("googleapis");

module.exports = async function checkSqlRequireSsl(auth, projectId) {
  const sql = google.sqladmin({ version: "v1beta4", auth });
  const results = [];

  try {
    const resp = await sql.instances.list({ project: projectId });
    const instances = resp.data.items || [];

    for (const inst of instances) {
      if (!inst.settings?.ipConfiguration?.requireSsl) {
        results.push({
          instance: inst.name,
          region: inst.region,
          exposureRisk: "🔴 High",
          issue: "Cloud SQL does NOT enforce SSL/TLS for incoming connections.",
          recommendation:
            "Enable 'Require SSL' in Cloud SQL > Connections settings to enforce encrypted connections.",
        });
      }
    }
  } catch (err) {
    results.push({
      error: "Failed to check SQL SSL requirement",
      details: err.message,
    });
  }

  return results;
};
