// sql/checkSqlAutomatedBackups.js
const { google } = require("googleapis");

module.exports = async function checkSqlAutomatedBackups(auth, projectId) {
  const sql = google.sqladmin({ version: "v1beta4", auth });
  const results = [];

  try {
    const resp = await sql.instances.list({ project: projectId });
    const instances = resp.data.items || [];

    for (const inst of instances) {
      const backupConfig = inst.settings?.backupConfiguration;

      if (!backupConfig?.enabled) {
        results.push({
          instance: inst.name,
          region: inst.region,
          exposureRisk: "🟠 Medium",
          issue: "Automated Backups are NOT enabled for this Cloud SQL instance.",
          recommendation:
            "Enable automated backups to prevent data loss from failures or corruption.",
        });
      }
    }
  } catch (err) {
    results.push({
      error: "Failed to check SQL automated backups",
      details: err.message,
    });
  }

  return results;
};
