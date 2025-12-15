// iam/checkSaKeyRotation90Days.js
const { google } = require("googleapis");

module.exports = async function checkSaKeyRotation90Days(auth, projectId) {
  const iam = google.iam({ version: "v1", auth });
  const report = [];

  try {
    const parent = `projects/${projectId}`;

    // List service accounts
    const saList = await iam.projects.serviceAccounts.list({ name: parent });
    const accounts = saList.data.accounts || [];

    for (const sa of accounts) {
      const saEmail = sa.email;
      const fullName = sa.name;

      // List keys for each service account
      const keyList = await iam.projects.serviceAccounts.keys.list({ name: fullName });
      const keys = keyList.data.keys || [];

      for (const key of keys) {
        // Only check user-managed keys
        if (key.keyType !== "USER_MANAGED") continue;

        const validAfter = key.validAfterTime;
        const lastRotatedDate = new Date(validAfter);
        const now = new Date();

        const diffDays = Math.floor(
          (now - lastRotatedDate) / (1000 * 60 * 60 * 24)
        );

        const isFail = diffDays > 90;

        report.push({
          projectId,
          serviceAccount: saEmail,
          keyName: key.name,
          lastRotatedDaysAgo: diffDays,
          // status: isFail ? "FAIL" : "PASS",
          exposureRisk: isFail ? "🔴 High" : "🟡 Low",
          recommendation: isFail
            ? "Rotate this user-managed key immediately and enforce an automated 90-day rotation policy."
            : "Key rotation is compliant. No action required.",
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
