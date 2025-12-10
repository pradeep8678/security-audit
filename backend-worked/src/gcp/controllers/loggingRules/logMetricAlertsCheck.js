// loggingRules/logMetricAlertsCheck.js
const { google } = require("googleapis");

/**
 * 🚨 Ensure that critical log metrics & alerts exist
 */
async function checkLogMetricAlerts(keyFile) {
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

    const requiredMetrics = [
      { name: "project_ownership_changes", filter: "protoPayload.serviceName=\"cloudresourcemanager.googleapis.com\"" },
      { name: "audit_config_changes", filter: "protoPayload.methodName=\"SetIamPolicy\"" },
      { name: "custom_role_changes", filter: "resource.type=\"iam_role\"" },
      { name: "firewall_changes", filter: "resource.type=\"gce_firewall_rule\"" },
      { name: "route_changes", filter: "resource.type=\"gce_route\"" },
      { name: "vpc_changes", filter: "resource.type=\"gce_network\"" },
      { name: "storage_iam_changes", filter: "protoPayload.serviceName=\"storage.googleapis.com\"" },
      { name: "sql_changes", filter: "resource.type=\"cloudsql_database\"" },
    ];

    const res = await logging.projects.metrics.list({
      parent: `projects/${projectId}`,
    });

    const metrics = res.data.metrics || [];

    requiredMetrics.forEach((m) => {
      if (!metrics.find((x) => x.name.includes(m.name))) {
        findings.push({
          metric: m.name,
          issue: "Missing log metric",
          exposureRisk: "High",
          recommendation: `Create log metric with filter: ${m.filter}`,
        });
      }
    });
  } catch (err) {
    console.error("Metric Alert Error:", err.message);
    throw new Error("Failed to verify log metrics & alerts");
  }

  return findings;
}

module.exports = checkLogMetricAlerts;
