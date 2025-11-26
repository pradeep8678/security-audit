/**
 * AWS Full Audit Controller
 * -------------------------
 * Combines all AWS audit controllers (EC2, S3, LoadBalancers, IAM, SG, EKS, AppRunner, RDS, etc.)
 * into one complete security audit.
 */

const ec2Controller = require("./ec2Controller");
const s3Controller = require("./s3Controller");
const lbController = require("./lbControllers");
   // your LB controller 
const iamController = require("./IAMOwnerController");
const sgController = require("./securityGroupController");
const eksController = require("./EKSController"); 
const appRunnerController = require("./AppRunnerController");
const rdsController = require("./rdsController");
/**
 * Utility: Executes an Express-style controller internally
 * and captures its JSON output.
 */
async function invokeAwsController(label, controllerFn, body) {
  return new Promise(async (resolve) => {
    try {
      let responseData = null;

      const fakeReq = { body };
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

      await controllerFn(fakeReq, fakeRes);

      if (!responseData) {
        resolve({
          name: label,
          success: false,
          error: "Controller did not send any response.",
        });
      }
    } catch (err) {
      console.error(`❌ ${label} audit failed:`, err);
      resolve({
        name: label,
        success: false,
        error: err.message,
      });
    }
  });
}

/**
 * ✅ Full AWS Security Audit
 * Runs: EC2, S3, Load Balancers, IAM, Security Groups, EKS, AppRunner, RDS
 */
exports.runFullAwsAudit = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "AWS accessKeyId and secretAccessKey are required",
      });
    }

    console.log("🚀 Starting Full AWS Security Audit...");

    const credentials = { accessKeyId, secretAccessKey };

    // Run all AWS audits in parallel
    const results = await Promise.all([
      invokeAwsController("EC2 Instances", ec2Controller.listEC2Instances, credentials),
      invokeAwsController("S3 Buckets", s3Controller.analyzeS3Buckets, credentials),
      invokeAwsController("Load Balancers", lbController.listAwsLoadBalancers, credentials),
      invokeAwsController("IAM Users & Roles", iamController.analyzeAWSAdmins, credentials),
      invokeAwsController("Security Groups", sgController.scanSecurityGroups, credentials),
      invokeAwsController("EKS Clusters", eksController.analyzeEKSClusters, credentials),
      invokeAwsController("App Runner Services", appRunnerController.analyzeAwsLambdaAndAppRunner, credentials),
      invokeAwsController("RDS Databases", rdsController.checkRdsPublicInstances, credentials),
    ]);

    return res.status(200).json({
      message: "✅ Full AWS Security Audit completed successfully.",
      timestamp: new Date().toISOString(),
      totalChecks: results.length,
      results,
    });
  } catch (err) {
    console.error("🔥 Full AWS audit failed:", err);
    return res.status(500).json({
      message: "Full AWS audit failed",
      error: err.message,
    });
  }
};
