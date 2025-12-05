// bigQueryController.js
const { google } = require("googleapis");

// BIGQUERY RULES
const checkBigQueryDatasetPublicAccess = require("./bigquery/checkBigQueryDatasetPublicAccess");
const checkBigQueryTableCmekEncryption = require("./bigquery/checkBigQueryTableCmekEncryption");
const checkBigQueryDefaultCmek = require("./bigquery/checkBigQueryDefaultCmek");

exports.checkBigQuery = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Key file is required" });

    const keyFile = JSON.parse(req.file.buffer.toString("utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const projectId = keyFile.project_id;

    console.log(`🚀 Running BigQuery Audit for project: ${projectId}`);

    // Execute BigQuery Checks
    const datasetPublicAccessScan =
      await checkBigQueryDatasetPublicAccess(client, projectId);

    const tableCmekScan =
      await checkBigQueryTableCmekEncryption(client, projectId);

    const defaultCmekScan =
      await checkBigQueryDefaultCmek(client, projectId);

    // Final JSON response
    return res.json({
      projectId,
      bigQueryScan: {
        datasetPublicAccessScan,
        tableCmekScan,
        defaultCmekScan,
      },
    });
  } catch (err) {
    console.error("❌ BigQuery Audit Error:", err);
    return res
      .status(500)
      .json({ error: "BigQuery audit failed", details: err.message });
  }
};
