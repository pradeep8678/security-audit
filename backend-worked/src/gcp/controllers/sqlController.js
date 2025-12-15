// sqlController.js
const { google } = require("googleapis");

// Import SQL RULES
const checkSqlRequireSsl = require("./sql/checkSqlRequireSsl");
const checkSqlNoPublicWhitelist = require("./sql/checkSqlNoPublicWhitelist");
const checkSqlNoPublicIp = require("./sql/checkSqlNoPublicIp");
const checkSqlAutomatedBackups = require("./sql/checkSqlAutomatedBackups");

exports.checkSQL = async (req, res) => {
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

    console.log(`🚀 Running Cloud SQL Audit for project: ${projectId}`);

    // Execute all SQL checks
    const sslScan = await checkSqlRequireSsl(client, projectId);
    const whitelistScan = await checkSqlNoPublicWhitelist(client, projectId);
    const publicIpScan = await checkSqlNoPublicIp(client, projectId);
    const backupScan = await checkSqlAutomatedBackups(client, projectId);

    // Final Output
    return res.json({
      projectId,
      cloudSqlScan: {
        requireSslScan: sslScan,
        noPublicWhitelistScan: whitelistScan,
        noPublicIpScan: publicIpScan,
        automatedBackupScan: backupScan,
      },
    });

  } catch (error) {
    console.error("❌ Error in Cloud SQL Audit:", error);
    return res.status(500).json({
      error: "Cloud SQL audit failed",
      details: error.message,
    });
  }
};
