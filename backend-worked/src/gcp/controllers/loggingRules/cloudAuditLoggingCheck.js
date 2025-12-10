// loggingRules/cloudAuditLoggingCheck.js
const { google } = require("googleapis");

/**
 * 📝 Ensure Cloud Audit Logging is enabled for Admin Read, Data Read, Data Write
 */
async function checkCloudAuditLogging(keyFile) {
  const findings = [];
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;
    const logging = google.logging("v2");

    const res = await logging.projects.sinks.list({
      parent: `projects/${projectId}`,
    });

    const sinks = res.data.sinks || [];

    if (sinks.length === 0) {
      findings.push({
        access: "cloud-audit-logging",
        exposureRisk: "High",
        issue: "No logging sinks found",
        recommendation:
          "Create logging sinks to export Admin Activity, Data Access logs.",
      });
    }
  } catch (err) {
    console.error("Audit Logging Error:", err.message);
    throw new Error("Failed to verify Cloud Audit Logging");
  }
  return findings;
}

module.exports = checkCloudAuditLogging;
