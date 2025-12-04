// iam/checkUserManagedKeys.js
const { google } = require("googleapis");

module.exports = async function checkUserManagedKeys(auth, projectId) {
  const iam = google.iam({ version: "v1", auth });
  const results = [];
  const vulnerableAccounts = [];

  try {
    const parent = `projects/${projectId}`;

    // Fetch all service accounts
    const saList = await iam.projects.serviceAccounts.list({ name: parent });
    const accounts = saList.data.accounts || [];

    for (const sa of accounts) {
      const serviceAccountEmail = sa.email;
      const fullName = sa.name;

      // Fetch keys of this service account
      const keyList = await iam.projects.serviceAccounts.keys.list({ name: fullName });
      const keys = keyList.data.keys || [];

      let status = "PASS";
      let message = `Account ${serviceAccountEmail} does not have user-managed keys.`;

      for (const key of keys) {
        if (key.keyType === "USER_MANAGED") {
          status = "FAIL";
          message = `Account ${serviceAccountEmail} has user-managed keys.`;

          vulnerableAccounts.push({
            serviceAccount: serviceAccountEmail,
            keyName: key.name,
            keyType: key.keyType,
          });
        }
      }

      results.push({
        serviceAccount: serviceAccountEmail,
        status,
        message,
        recommendation:
          status === "FAIL"
            ? "Remove user-managed keys and use Google-managed keys instead for security."
            : "Compliant.",
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
