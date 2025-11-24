/**
 * Full Audit Controller
 * ---------------------
 * Combines all audit controllers (Bucket, Firewall, GKE, SQL, CloudRun, LoadBalancer, Owner, VM)
 * into a single comprehensive endpoint.
 */

const bucketController = require("./bucketController");
const firewallController = require("./firewallController");
const gkeController = require("./gkeController");
const sqlController = require("./sqlController");
const cloudrunController = require("./cloudrunController");
const lbController = require("./lbController");
const ownerController = require("./ownerController");
const gcpController = require("./gcpController"); // VM + additional GCP audits

/**
 * Utility to execute any Express-style controller function and capture its JSON response
 */
async function invokeController(label, controllerFn, file) {
  return new Promise(async (resolve) => {
    try {
      let responseData = null;

      // Fake Express req/res for internal invocation
      const fakeReq = { file };
      const fakeRes = {
        status: (code) => ({
          json: (data) => {
            responseData = data;
            resolve({
              name: label,
              success: code >= 200 && code < 300,
              result: data,
            });
          },
        }),
        json: (data) => {
          responseData = data;
          resolve({
            name: label,
            success: true,
            result: data,
          });
        },
      };

      // Run the controller
      await controllerFn(fakeReq, fakeRes);

      // If no response was sent by controller
      if (!responseData) {
        resolve({
          name: label,
          success: false,
          error: "Controller did not send a response.",
        });
      }
    } catch (err) {
      console.error(`❌ ${label} audit failed:`, err.message);
      resolve({
        name: label,
        success: false,
        error: err.message,
      });
    }
  });
}

/**
 * ✅ Full GCP Audit
 * Runs all audits (Buckets, Firewall, GKE, SQL, Cloud Run, Load Balancers, IAM Owners, VMs)
 */
exports.runFullAudit = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Service account key file required" });
    }

    console.log("🚀 Starting Full GCP Security Audit...");

    const file = req.file;

    // Run all audits in parallel
    const results = await Promise.all([
      invokeController("Buckets", bucketController.listBuckets, file),
      invokeController("Firewall Rules", firewallController.scanFirewallRules, file),
      invokeController("GKE Clusters", gkeController.checkGKEClusters, file),
      invokeController("SQL Instances", sqlController.checkSqlPublicIps, file),
      invokeController("Cloud Run / Functions", cloudrunController.scanCloudRunAndFunctions, file),
      invokeController("Load Balancers", lbController.checkLoadBalancersAudit, file),
      invokeController("Owner IAM Roles", ownerController.checkOwnerServiceAccounts, file),
      invokeController("VM Instances", gcpController.listVMs, file),
    ]);

    // Combine everything into a final report
    return res.status(200).json({
      message: "✅ Full GCP Security Audit completed successfully.",
      timestamp: new Date().toISOString(),
      totalChecks: results.length,
      results,
    });
  } catch (error) {
    console.error("🔥 Full audit failed:", error);
    return res.status(500).json({
      message: "Full audit failed",
      error: error.message,
    });
  }
};
