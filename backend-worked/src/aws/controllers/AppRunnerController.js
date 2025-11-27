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
    // 1. Get all AWS regions dynamically
    // -------------------------------------------------------
    const ec2 = new EC2Client({
      region: "us-east-1",
      credentials: awsCredentials,
    });

    const regionRes = await ec2.send(new DescribeRegionsCommand({}));
    const allRegions = regionRes.Regions.map(r => r.RegionName);

    const findings = [];
    const activeAppRunnerRegions = [];

    // -------------------------------------------------------
    // 2. Detect regions where App Runner is actually used
    // -------------------------------------------------------
    for (const region of allRegions) {
      try {
        const appRunner = new AppRunnerClient({
          region,
          credentials: awsCredentials,
        });

        const svcList = await appRunner.send(new ListServicesCommand({}));

        if (svcList.ServiceSummaryList?.length > 0) {
          activeAppRunnerRegions.push(region);
        }

      } catch (err) {
        // Ignore regions where App Runner is unavailable
      }
    }

    // -------------------------------------------------------
    // 3. Scan Lambda functions in every region
    // -------------------------------------------------------
    for (const region of allRegions) {
      const lambda = new LambdaClient({
        region,
        credentials: awsCredentials,
      });

      try {
        const fnRes = await lambda.send(new ListFunctionsCommand({}));

        for (const fn of fnRes.Functions || []) {
          const { FunctionName: name, FunctionArn: arn, Runtime: runtime } = fn;

          let unauthenticated = "No";
          let authLevel = "Restricted";

          // Check policy for "*"
          try {
            const policyRes = await lambda.send(
              new GetPolicyCommand({ FunctionName: name })
            );

            const policyJson = JSON.parse(policyRes.Policy);
            const statements = policyJson.Statement || [];

            const isPublic = statements.some(
              (s) =>
                s.Principal === "*" ||
                s.Principal?.AWS === "*" ||
                s.Principal?.Service === "*"
            );

            if (isPublic) {
              unauthenticated = "Yes";
              authLevel = "Public";
            }
          } catch (err) {
            // If no policy — treat as private
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
            recommendation: "Remove '*' from Lambda resource policies.",
          });
        }
      } catch (err) {
        findings.push({
          type: "AWS Lambda",
          region,
          name: "Error",
          exposureRisk: "Unknown",
          error: err.message,
        });
      }
    }

    // -------------------------------------------------------
    // 4. Scan App Runner services (ONLY where deployed)
    // -------------------------------------------------------
    for (const region of activeAppRunnerRegions) {
      const appRunner = new AppRunnerClient({
        region,
        credentials: awsCredentials,
      });

      try {
        const listRes = await appRunner.send(new ListServicesCommand({}));

        for (const svc of listRes.ServiceSummaryList || []) {
          const details = await appRunner.send(
            new DescribeServiceCommand({ ServiceArn: svc.ServiceArn })
          );

          const service = details.Service;

          const ingressPublic =
            service?.NetworkConfiguration?.IngressConfiguration?.IsPublic ===
            true;

          findings.push({
            type: "AWS App Runner",
            region,
            name: service.ServiceName,
            arn: svc.ServiceArn,
            url: service.ServiceUrl,
            ingress: ingressPublic ? "Public" : "Internal",
            unauthenticated: ingressPublic ? "Yes" : "No",
            exposureRisk: ingressPublic ? "High" : "Low",
            recommendation:
              "Enable VPC Ingress for private-only App Runner services.",
          });
        }
      } catch (err) {
        findings.push({
          type: "AWS App Runner",
          region,
          name: "Error",
          exposureRisk: "Unknown",
          error: err.message,
        });
      }
    }

    // -------------------------------------------------------
    // Final Output
    // -------------------------------------------------------
    return {
      success: true,
      // message: "AWS Lambda & App Runner audit completed",
      // regionsScanned: allRegions,
      appRunnerRegions: activeAppRunnerRegions,
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
 * 🌐 Express Route Handler
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

    res.status(result?.success ? 200 : 500).json(result);

  } catch (err) {
    res.status(500).json({
      error: "AWS audit failed",
      details: err.message,
    });
  }
};

exports.analyzeAwsLambdaAndAppRunner = analyzeAwsLambdaAndAppRunner;
