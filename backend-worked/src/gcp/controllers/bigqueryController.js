// bigQueryController.js
const { google } = require("googleapis");

// BIGQUERY RULES
const checkBigQueryDatasetPublicAccess = require("./bigquery/checkBigQueryDatasetPublicAccess");
const checkBigQueryTableCmekEncryption = require("./bigquery/checkBigQueryTableCmekEncryption");
const checkBigQueryDefaultCmek = require("./bigquery/checkBigQueryDefaultCmek");

exports.checkBigQuery = async (req, res) => {
  try {
    let keyFile, client, projectId;

    if (req.parsedKey && req.authClient) {
      keyFile = req.parsedKey;
      client = req.authClient;
      projectId = keyFile.project_id;
    } else if (req.file) {
      keyFile = JSON.parse(req.file.buffer.toString("utf8"));
      projectId = keyFile.project_id;
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      client = await auth.getClient();
    } else {
      return res.status(400).json({ error: "Key file is required" });
    }

    console.log(` Running BigQuery Audit for project: ${projectId}`);

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
    console.error("BigQuery Audit Error:", err);
    return res
      .status(500)
      .json({ error: "BigQuery audit failed", details: err.message });
  }
};
