// bigquery/checkBigQueryDefaultCmek.js
const { google } = require("googleapis");

module.exports = async function checkBigQueryDefaultCmek(auth, projectId) {
  const bigquery = google.bigquery({ version: "v2", auth });
  const results = [];

  try {
    const settingsResp = await bigquery.projects.getServiceAccount({
      projectId,
    });

    // This API doesn't expose default CMEK directly
    // So we check encryption in the project-wide settings
    const kmsKey = settingsResp.data?.defaultEncryptionConfiguration?.kmsKeyName;

    if (!kmsKey) {
      results.push({
        projectId,
        exposureRisk: "Medium",
        issue: "Default Customer-Managed Key (CMEK) is NOT configured for BigQuery.",
        recommendation:
          "Configure default CMEK in BigQuery project settings to encrypt all new datasets/tables.",
      });
    }
  } catch (err) {
    console.error("BigQuery Default CMEK Check Error:", err);
    results.push({
      error: "Failed to check default BigQuery CMEK",
      details: err.message,
    });
  }

  return results;
};
