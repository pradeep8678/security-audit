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
    if (!req.file) return res.status(400).json({ error: "Key file is required" });

    const keyFile = JSON.parse(req.file.buffer.toString("utf8"));
    const projectId = keyFile.project_id;

    console.log(`🚀 Running LOGGING Audit for project: ${projectId}`);

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    google.options({ auth: client });

    // Execute logging checks
    const cloudAuditScan = await checkCloudAuditLogging(keyFile);
    const logSinkScan = await checkLogSinks(keyFile);
    const bucketRetentionScan = await checkBucketRetentionLock(keyFile);
    const logMetricAlertsScan = await checkLogMetricAlerts(keyFile);
    const dnsLoggingScan = await checkCloudDnsLogging(keyFile);
    const assetInventoryScan = await checkCloudAssetInventory(keyFile);
    const accessTransparencyScan = await checkAccessTransparency(keyFile);
    const accessApprovalScan = await checkAccessApproval(keyFile);
    const loadBalancerLoggingScan = await checkLoadBalancerLogging(keyFile);

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
