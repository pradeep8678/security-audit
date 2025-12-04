// iam/checkProjectLevelServiceRoles.js
const { google } = require("googleapis");

module.exports = async function checkProjectLevelServiceRoles(auth, projectId) {
  const crm = google.cloudresourcemanager({ version: "v1", auth });
  const report = [];
  const vulnerableBindings = [];

  try {
    // Get IAM policy
    const policyResponse = await crm.projects.getIamPolicy({
      resource: projectId,
      requestBody: {},
    });

    const bindings = policyResponse.data.bindings || [];

    // Roles to check
    const sensitiveRoles = [
      "roles/iam.serviceAccountUser",
      "roles/iam.serviceAccountTokenCreator",
    ];

    for (const binding of bindings) {
      if (sensitiveRoles.includes(binding.role)) {
        vulnerableBindings.push({
          role: binding.role,
          members: binding.members || [],
          projectId,
        });

        report.push({
          role: binding.role,
          status: "FAIL",
          projectId,
          message: `IAM Users assigned to service role '${binding.role}' at project level ${projectId}.`,
          recommendation:
            "Avoid assigning service roles at project level. Use least privilege principles.",
        });
      }
    }

    if (vulnerableBindings.length === 0) {
      report.push({
        projectId,
        status: "PASS",
        message: `No IAM Users assigned to sensitive service roles at project level ${projectId}.`,
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
