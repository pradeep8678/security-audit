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
              exposureRisk: "High",
              recommendation:
                "Reduce this service account's permissions following the principle of least privilege. Avoid giving 'roles/owner' to service accounts unless absolutely necessary.",
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

  return {
    totalOwnerServiceAccounts: ownerData.length,
    ownerServiceAccounts: ownerData,
    message:
      ownerData.length === 0
        ? "✅ No service accounts with Owner role found."
        : "⚠️ High-risk service accounts found. Review immediately.",
  };
};
