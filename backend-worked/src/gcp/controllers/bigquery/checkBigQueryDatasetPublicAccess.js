// bigquery/checkBigQueryDatasetPublicAccess.js
const { google } = require("googleapis");

module.exports = async function checkBigQueryDatasetPublicAccess(auth, projectId) {
  const bigquery = google.bigquery({ version: "v2", auth });
  const results = [];

  try {
    const datasetsResp = await bigquery.datasets.list({
      projectId: projectId,
    });

    const datasets = datasetsResp.data.datasets || [];
    for (const ds of datasets) {
      const datasetId = ds.datasetReference.datasetId;

      const dsMeta = await bigquery.datasets.get({
        datasetId,
        projectId,
      });

      const policy = dsMeta.data.access || [];

      const publicAccess = policy.some(
        (entry) =>
          entry.specialGroup === "allUsers" ||
          entry.specialGroup === "allAuthenticatedUsers"
      );

      if (publicAccess) {
        results.push({
          datasetId,
          projectId,
          exposureRisk: "🔴 High",
          issue: "Dataset is publicly accessible",
          recommendation:
            "Remove 'allUsers' or 'allAuthenticatedUsers' from dataset IAM policy.",
        });
      }
    }
  } catch (err) {
    console.error("BigQuery Public Dataset Check Error:", err);
    results.push({
      error: "Failed to check BigQuery dataset access",
      details: err.message,
    });
  }

  return results;
};
