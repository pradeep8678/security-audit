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
 * 🔍 Main AWS audit function
 */
async function analyzeAwsLambdaAndAppRunner(awsCredentials) {
  const { accessKeyId, secretAccessKey } = awsCredentials;

  try {
    // -------------------------------------------------------
    // 1. Fetch all AWS regions dynamically
    // -------------------------------------------------------
    const ec2 = new EC2Client({
      region: "us-east-1",
      credentials: awsCredentials,
    });

    const regionRes = await ec2.send(new DescribeRegionsCommand({}));
    const allRegions = regionRes.Regions.map((r) => r.RegionName);

    const findings = [];
    const activeAppRunnerRegions = [];

    // -------------------------------------------------------
    // 2. Detect ONLY regions where the user has App Runner apps
    // -------------------------------------------------------
    for (const region of allRegions) {
      try {
        const appRunnerClient = new AppRunnerClient({
          region,
          credentials: awsCredentials,
        });

        const svcList = await appRunnerClient.send(
          new ListServicesCommand({})
        );

        // Only mark region active if user actually deployed an App Runner service
        if (svcList.ServiceSummaryList?.length > 0) {
          activeAppRunnerRegions.push(region);
        }

      } catch (_) {
        // Ignore "subscription needed" errors or regions where App Runner isn't enabled
      }
    }

    // -------------------------------------------------------
    // 3. First scan Lambda in all regions
    // -------------------------------------------------------
    for (const region of allRegions) {
      const lambdaClient = new LambdaClient({
        region,
        credentials: awsCredentials,
      });

      try {
        const fnRes = await lambdaClient.send(new ListFunctionsCommand({}));

        for (const fn of fnRes.Functions || []) {
          const name = fn.FunctionName;
          const arn = fn.FunctionArn;
          const runtime = fn.Runtime;

          let unauthenticated = "No";
          let authLevel = "Restricted";

          // Check resource policy for public access
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
            // No policy → it's private
          }

          findings.push({
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
        findings.push({
          type: "AWS Lambda",
          region,
          name: `Error: ${err.message}`,
          exposureRisk: "Unknown",
        });
      }
    }

    // -------------------------------------------------------
    // 4. Scan App Runner ONLY in regions that have services
    // -------------------------------------------------------
    for (const region of activeAppRunnerRegions) {
      const appRunnerClient = new AppRunnerClient({
        region,
        credentials: awsCredentials,
      });

      try {
        const svcList = await appRunnerClient.send(
          new ListServicesCommand({})
        );

        for (const svc of svcList.ServiceSummaryList || []) {
          const details = await appRunnerClient.send(
            new DescribeServiceCommand({ ServiceArn: svc.ServiceArn })
          );

          const service = details.Service;

          const ingress =
            service?.NetworkConfiguration?.IngressConfiguration?.IsPublic === true
              ? "Public"
              : "Internal";

          findings.push({
            type: "AWS App Runner",
            region,
            name: service.ServiceName,
            arn: svc.ServiceArn,
            url: service.ServiceUrl,
            ingress,
            unauthenticated: ingress === "Public" ? "Yes" : "No",
            exposureRisk: ingress === "Public" ? "High" : "Low",
            recommendation:
              "Use private App Runner endpoints by enabling VPC Ingress instead of public access.",
          });
        }
      } catch (err) {
        findings.push({
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
      appRunnerRegions: activeAppRunnerRegions, // <- real regions with apps
      findings,
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
 * 🌐 Express route
 */
exports.scanAwsLambdaAndAppRunner = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "AWS accessKeyId and secretAccessKey are required",
      });
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
