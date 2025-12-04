// iam/checkUserManagedKeys.js
const { google } = require("googleapis");

module.exports = async function checkUserManagedKeys(auth, projectId) {
  const iam = google.iam({ version: "v1", auth });
  const results = [];

  try {
    const parent = `projects/${projectId}`;

    // List all service accounts
    const saList = await iam.projects.serviceAccounts.list({ name: parent });
    const accounts = saList.data.accounts || [];

    for (const sa of accounts) {
      const serviceAccountEmail = sa.email;
      const fullName = sa.name;

      // List keys for this service account
      const keyList = await iam.projects.serviceAccounts.keys.list({ name: fullName });
      const keys = keyList.data.keys || [];

      // Filter only user-managed keys
      const userManagedKeys = keys.filter(k => k.keyType === "USER_MANAGED");

      const hasUserManagedKeys = userManagedKeys.length > 0;

      results.push({
        projectId,
        serviceAccount: serviceAccountEmail,
        hasUserManagedKeys,
        userManagedKeyCount: userManagedKeys.length,
        // status: hasUserManagedKeys ? "FAIL" : "PASS",
        exposureRisk: hasUserManagedKeys ? "High" : "Low",
        recommendation: hasUserManagedKeys
          ? "Remove user-managed service account keys immediately. Prefer Google-managed keys or workload identity federation."
          : "No user-managed keys found. Compliant.",
      });
    }
  } catch (error) {
    console.error("User-Managed SA Keys Check Error:", error);
    results.push({
      error: "Failed to check user-managed service account keys",
      details: error.message,
    });
  }

  return results;
};
