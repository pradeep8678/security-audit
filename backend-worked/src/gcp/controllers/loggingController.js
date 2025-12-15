// loggingController.js
const { google } = require("googleapis");

// LOGGING RULE IMPORTS
const checkCloudAuditLogging = require("./loggingRules/cloudAuditLoggingCheck");
const checkLogSinks = require("./loggingRules/logSinkCheck");
const checkBucketRetentionLock = require("./loggingRules/bucketRetentionLockCheck");
const checkLogMetricAlerts = require("./loggingRules/logMetricAlertsCheck");
const checkCloudDnsLogging = require("./loggingRules/cloudDnsLoggingCheck");
const checkCloudAssetInventory = require("./loggingRules/cloudAssetInventoryCheck");
const checkAccessTransparency = require("./loggingRules/accessTransparencyCheck");
const checkAccessApproval = require("./loggingRules/accessApprovalCheck");
const checkLoadBalancerLogging = require("./loggingRules/loadBalancerLoggingCheck");

exports.checkLogging = async (req, res) => {
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

    console.log(`🚀 Running LOGGING Audit for project: ${projectId}`);

    google.options({ auth: client });

    // Execute logging checks
    const cloudAuditScan = await checkCloudAuditLogging(keyFile, client);
    const logSinkScan = await checkLogSinks(keyFile, client);
    const bucketRetentionScan = await checkBucketRetentionLock(keyFile, client);
    const logMetricAlertsScan = await checkLogMetricAlerts(keyFile, client);
    const dnsLoggingScan = await checkCloudDnsLogging(keyFile, client);
    const assetInventoryScan = await checkCloudAssetInventory(keyFile, client);
    const accessTransparencyScan = await checkAccessTransparency(keyFile, client);
    const accessApprovalScan = await checkAccessApproval(keyFile, client);
    const loadBalancerLoggingScan = await checkLoadBalancerLogging(keyFile, client);

    // Send final JSON
    return res.json({
      projectId,
      loggingScan: {
        cloudAuditLoggingScan: cloudAuditScan,
        logSinkScan: logSinkScan,
        bucketRetentionLockScan: bucketRetentionScan,
        logMetricAlertsScan: logMetricAlertsScan,
        dnsLoggingScan: dnsLoggingScan,
        cloudAssetInventoryScan: assetInventoryScan,
        accessTransparencyScan: accessTransparencyScan,
        accessApprovalScan: accessApprovalScan,
        loadBalancerLoggingScan: loadBalancerLoggingScan,
      },
    });
  } catch (err) {
    console.error("❌ Error in LOGGING audit:", err);
    return res.status(500).json({
      error: "Logging audit failed",
      details: err.message,
    });
  }
};
