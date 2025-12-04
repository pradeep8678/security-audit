// iam/checkOwnerServiceAccounts.js
const { google } = require("googleapis");

module.exports = async function checkOwnerServiceAccounts(client, projectId) {
  const crm = google.cloudresourcemanager({
    version: "v1",
    auth: client,
  });

  const ownerData = [];

  try {
    const policy = await crm.projects.getIamPolicy({
      resource: projectId,
      requestBody: {},
    });

    for (const binding of policy.data.bindings || []) {
      if (binding.role === "roles/owner") {
        for (const member of binding.members || []) {
          if (member.startsWith("serviceAccount:")) {
            ownerData.push({
              serviceAccount: member,
              role: binding.role,

              // Same exact style you used in other checks
              exposureRisk: "High",

              recommendation:
                "Remove 'roles/owner' from this service account and assign only the minimum required permissions.",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Owner SA Check Error:", error);
    return {
      error: "Failed to fetch owner service accounts",
      details: error.message,
    };
  }

  const hasOwners = ownerData.length > 0;

  return {
    totalOwnerServiceAccounts: ownerData.length,
    ownerServiceAccounts: ownerData,
    // status: hasOwners ? "FAIL" : "PASS",

    // Same structure you used in KMS + IAM checks
    exposureRisk: hasOwners ? "High" : "Low",

    recommendation: hasOwners
      ? "Remove Owner permissions from service accounts to prevent full-project compromise."
      : "No risky service accounts found. No action required.",
  };
};
