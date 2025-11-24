// src/controllers/awsLbController.js
const {
  LambdaClient,
  ListFunctionsCommand,
  GetPolicyCommand,
} = require("@aws-sdk/client-lambda");

const {
  EC2Client,
  DescribeRegionsCommand,
} = require("@aws-sdk/client-ec2");

const {
  AppRunnerClient,
  ListServicesCommand,
  DescribeServiceCommand,
} = require("@aws-sdk/client-apprunner");

/**
 * 🔍 Reusable AWS audit function — NO REGION INPUT
 */
async function analyzeAwsLambdaAndAppRunner(awsCredentials) {
  const { accessKeyId, secretAccessKey } = awsCredentials;

  try {
    // -----------------------------------------------------------
    // 1. Get ALL AWS regions dynamically
    // -----------------------------------------------------------
    const ec2 = new EC2Client({
      region: "us-east-1", // EC2 is global enough to fetch regions
      credentials: { accessKeyId, secretAccessKey },
    });

    const regionRes = await ec2.send(new DescribeRegionsCommand({}));
    const allRegions = regionRes.Regions.map((r) => r.RegionName);

    const results = [];

    // -----------------------------------------------------------
    // 2. Scan each region for Lambda & App Runner
    // -----------------------------------------------------------
    for (const region of allRegions) {
      console.log(`🔍 Scanning region: ${region}`);

      // AWS clients for the region
      const lambdaClient = new LambdaClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      const appRunnerClient = new AppRunnerClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      // ============================
      // 🟦 AWS Lambda Audit
      // ============================
      try {
        const fnRes = await lambdaClient.send(new ListFunctionsCommand({}));

        for (const fn of fnRes.Functions || []) {
          const name = fn.FunctionName;
          const arn = fn.FunctionArn;
          const runtime = fn.Runtime;

          let unauthenticated = "No";
          let authLevel = "Restricted";

          // IAM Policy Check
          try {
            const policyRes = await lambdaClient.send(
              new GetPolicyCommand({ FunctionName: name })
            );

            const policyDoc = JSON.parse(policyRes.Policy);
            const statements = policyDoc.Statement || [];

            const isPublic = statements.some(
              (s) =>
                s.Principal === "*" ||
                (s.Principal?.AWS === "*") ||
                (s.Principal?.Service === "*")
            );

            if (isPublic) {
              unauthenticated = "Yes";
              authLevel = "Public";
            }
          } catch (_) {
            // No resource-based policy = restricted
          }

          results.push({
            type: "AWS Lambda",
            region,
            name,
            arn,
            runtime,
            unauthenticated,
            auth: authLevel,
            exposureRisk: unauthenticated === "Yes" ? "High" : "Low",
            recommendation:
              "Remove public (“*”) permissions from Lambda resource policies.",
          });
        }
      } catch (err) {
        results.push({
          type: "AWS Lambda",
          region,
          name: `Error: ${err.message}`,
          exposureRisk: "Unknown",
        });
      }

      // ============================
      // 🟦 AWS App Runner Audit
      // ============================
      try {
        const svcList = await appRunnerClient.send(new ListServicesCommand({}));

        for (const svc of svcList.ServiceSummaryList || []) {
          const serviceArn = svc.ServiceArn;
          const details = await appRunnerClient.send(
            new DescribeServiceCommand({ ServiceArn: serviceArn })
          );

          const service = details.Service;

          const ingress =
            service?.NetworkConfiguration?.IngressConfiguration?.IsPublic === true
              ? "Public"
              : "Internal";

          results.push({
            type: "AWS App Runner",
            region,
            name: service.ServiceName,
            arn: serviceArn,
            url: service.ServiceUrl,
            ingress,
            unauthenticated: ingress === "Public" ? "Yes" : "No",
            exposureRisk: ingress === "Public" ? "High" : "Low",
            recommendation:
              "Use private App Runner services or enable VPC Ingress rather than public endpoints.",
          });
        }
      } catch (err) {
        results.push({
          type: "AWS App Runner",
          region,
          name: `Error: ${err.message}`,
          exposureRisk: "Unknown",
        });
      }
    }

    return {
      success: true,
      message: "AWS Lambda & App Runner scan completed",
      regionsScanned: allRegions,
      findings: results,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to scan AWS",
      details: error.message,
    };
  }
}

/**
 * 🌐 Express route — same as GCP style
 */
exports.scanAwsLambdaAndAppRunner = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res
        .status(400)
        .json({ error: "AWS accessKeyId and secretAccessKey are required" });
    }

    const result = await analyzeAwsLambdaAndAppRunner({
      accessKeyId,
      secretAccessKey,
    });

    res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    res.status(500).json({
      error: "AWS audit failed",
      details: err.message,
    });
  }
};

exports.analyzeAwsLambdaAndAppRunner = analyzeAwsLambdaAndAppRunner;
