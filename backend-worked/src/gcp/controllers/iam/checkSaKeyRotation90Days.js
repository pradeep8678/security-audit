// iam/checkSaKeyRotation90Days.js
const { google } = require("googleapis");

module.exports = async function checkSaKeyRotation90Days(auth, projectId) {
  const iam = google.iam({ version: "v1", auth });
  const vulnerableKeys = [];
  const report = [];

  try {
    const parent = `projects/${projectId}`;

    // List all service accounts
    const saList = await iam.projects.serviceAccounts.list({ name: parent });
    const accounts = saList.data.accounts || [];

    for (const sa of accounts) {
      const saEmail = sa.email;
      const fullName = sa.name;

      // Get keys associated with this SA
      const keyList = await iam.projects.serviceAccounts.keys.list({ name: fullName });
      const keys = keyList.data.keys || [];

      for (const key of keys) {
        if (key.keyType !== "USER_MANAGED") continue;

        const validAfter = key.validAfterTime;
        const lastRotatedDate = new Date(validAfter);
        const now = new Date();
        const diffDays = Math.floor((now - lastRotatedDate) / (1000 * 60 * 60 * 24));

        let status = "PASS";
        let message = `User-managed key ${key.name} for account ${saEmail} was rotated within the last 90 days (${diffDays} days ago).`;

        if (diffDays > 90) {
          status = "FAIL";
          message = `User-managed key ${key.name} for account ${saEmail} was NOT rotated in the last 90 days (${diffDays} days ago).`;
          vulnerableKeys.push({
            serviceAccount: saEmail,
            keyName: key.name,
            lastRotatedDaysAgo: diffDays,
          });
        }

        report.push({
          serviceAccount: saEmail,
          keyName: key.name,
          lastRotatedDaysAgo: diffDays,
          status,
          message,
          recommendation:
            status === "FAIL"
              ? "Rotate the user-managed key immediately and enforce a 90-day rotation policy."
              : "Key rotation is compliant.",
        });
      }
    }

  } catch (error) {
    console.error("SA Key Rotation Check Error:", error);
    report.push({
      error: "Failed to check SA key rotation for 90 days",
      details: error.message,
    });
  }

  return report;
};
