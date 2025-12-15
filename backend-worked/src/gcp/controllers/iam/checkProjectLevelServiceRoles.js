// iam/checkProjectLevelServiceRoles.js
const { google } = require("googleapis");

module.exports = async function checkProjectLevelServiceRoles(auth, projectId) {
  const crm = google.cloudresourcemanager({ version: "v1", auth });
  const report = [];
  const vulnerableBindings = [];

  try {
    const policyResponse = await crm.projects.getIamPolicy({
      resource: projectId,
      requestBody: {},
    });

    const bindings = policyResponse.data.bindings || [];

    // Sensitive roles that should NOT be assigned at project level
    const sensitiveRoles = [
      "roles/iam.serviceAccountUser",
      "roles/iam.serviceAccountTokenCreator",
    ];

    for (const binding of bindings) {
      if (sensitiveRoles.includes(binding.role)) {
        vulnerableBindings.push(binding);

        report.push({
          projectId,
          role: binding.role,
          members: binding.members || [],
          status: "FAIL",
          exposureRisk: "🔴 High",
          recommendation:
            "Avoid assigning Service Account User or Token Creator roles at project level. Grant permissions only on specific service accounts following least privilege.",
        });
      }
    }

    // PASS case (no risky bindings found)
    if (vulnerableBindings.length === 0) {
      report.push({
        projectId,
        // status: "PASS",
        exposureRisk: "🟡 Low",
        recommendation:
          "No risky service roles assigned at project level. No action required.",
      });
    }

  } catch (error) {
    console.error("Project Level Service Roles Check Error:", error);
    report.push({
      error: "Failed to check service roles at project level",
      details: error.message,
    });
  }

  return report;
};
