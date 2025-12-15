// bigquery/checkBigQueryTableCmekEncryption.js
const { google } = require("googleapis");

module.exports = async function checkBigQueryTableCmekEncryption(auth, projectId) {
  const bigquery = google.bigquery({ version: "v2", auth });
  const results = [];

  try {
    const datasetResp = await bigquery.datasets.list({ projectId });
    const datasets = datasetResp.data.datasets || [];

    for (const ds of datasets) {
      const datasetId = ds.datasetReference.datasetId;

      const tableResp = await bigquery.tables.list({
        projectId,
        datasetId,
      });

      const tables = tableResp.data.tables || [];
      for (const tbl of tables) {
        const tableId = tbl.tableReference.tableId;

        const metaResp = await bigquery.tables.get({
          projectId,
          datasetId,
          tableId,
        });

        const encryption = metaResp.data.encryptionConfiguration;

        if (!encryption || !encryption.kmsKeyName) {
          // Table is NOT CMEK encrypted
          results.push({
            projectId,
            datasetId,
            tableId,
            exposureRisk: "🟠 Medium",
            issue: "Table is NOT encrypted with a customer-managed key (CMEK)",
            recommendation:
              "Enable CMEK encryption on this BigQuery table using a Cloud KMS key.",
          });
        }
      }
    }
  } catch (err) {
    console.error("BigQuery Table CMEK Check Error:", err);
    results.push({
      error: "Failed to check BigQuery table CMEK encryption",
      details: err.message,
    });
  }

  return results;
};
