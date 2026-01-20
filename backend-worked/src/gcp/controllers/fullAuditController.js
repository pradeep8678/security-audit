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
const bigqueryController = require("./bigqueryController");
const networkController = require("./networkController");
const loggingController = require("./loggingController");
const { google } = require("googleapis");

/**
 * Utility to execute any Express-style controller function and capture its JSON response
 */
async function invokeController(label, controllerFn, file, parsedKey, authClient) {
  return new Promise(async (resolve) => {
    try {
      let responseData = null;

      // Fake Express req/res for internal invocation
      // Pass pre-parsed key and auth client to avoid re-parsing/re-auth
      const fakeReq = {
        file,
        parsedKey,
        authClient,
        project_id: parsedKey.project_id
      };

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
      console.error(` ${label} audit failed:`, err.message);
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

    console.log(" Starting Full GCP Security Audit (Optimized)...");

    // 1. Parse Key File ONCE
    const file = req.file;
    const parsedKey = JSON.parse(file.buffer.toString("utf8"));

    // --- DEBUG & FIX START ---
    console.log("🔍 Inspecting Service Account Key...");
    console.log(`- Project ID: ${parsedKey.project_id}`);
    console.log(`- Client Email: ${parsedKey.client_email}`);
    
    if (parsedKey.private_key) {
      // Check for common issue: escaped newlines in private key
      if (parsedKey.private_key.includes("\\n") && !parsedKey.private_key.includes("\n")) {
        console.log("⚠️ Private key contains escaped newlines (\\n). Fixing it...");
        parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, "\n");
      }
      
      const keyLines = parsedKey.private_key.split("\n");
      console.log(`- Private Key: Valid Header? ${parsedKey.private_key.startsWith("-----BEGIN PRIVATE KEY-----")}`);
      console.log(`- Private Key Line Count: ${keyLines.length}`);
    } else {
      console.error("❌ Private Key is MISSING from the uploaded file!");
    }
    // --- DEBUG & FIX END ---

    // 2. Initialize Google Auth Client ONCE
    const auth = new google.auth.GoogleAuth({
      credentials: parsedKey,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const authClient = await auth.getClient();

    console.log(`🔑 Authenticated for project: ${parsedKey.project_id}`);

    // Run all audits in parallel, passing the auth client
    const results = await Promise.all([
      invokeController("Buckets", bucketController.auditBuckets, file, parsedKey, authClient),
      invokeController("Firewall Rules", firewallController.scanFirewallRules, file, parsedKey, authClient),
      invokeController("GKE Clusters", gkeController.checkGKEClusters, file, parsedKey, authClient),
      invokeController("SQL Instances", sqlController.checkSQL, file, parsedKey, authClient),
      invokeController("Cloud Run / Functions", cloudrunController.scanCloudRunAndFunctions, file, parsedKey, authClient),
      invokeController("Load Balancers", lbController.checkLoadBalancersAudit, file, parsedKey, authClient),
      invokeController("Owner IAM Roles", ownerController.checkIAM, file, parsedKey, authClient),
      invokeController("VM Scan", gcpController.listVMs, file, parsedKey, authClient),
      invokeController("Big Query Scan", bigqueryController.checkBigQuery, file, parsedKey, authClient),
      invokeController("Network Scan", networkController.checkNETWORK, file, parsedKey, authClient),
      invokeController("Logging Scan", loggingController.checkLogging, file, parsedKey, authClient),
    ]);

    // Combine everything into a final report
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      totalChecks: results.length,
      results,
    });
  } catch (error) {
    console.error(" Full audit failed:", error);
    return res.status(500).json({
      message: "Full audit failed",
      error: error.message,
    });
  }
};

