// loggingRules/loadBalancerLoggingCheck.js
const { google } = require("googleapis");

async function checkLoadBalancerLogging(keyFile, passedAuthClient = null) {
  const findings = [];

  try {
    const compute = google.compute("v1");

    let authClient;
    if (passedAuthClient) {
      authClient = passedAuthClient;
    } else {
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });

      authClient = await auth.getClient();
    }
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;

    const res = await compute.backendServices.list({
      project: projectId,
    });

    const backends = res.data.items || [];

    backends.forEach((b) => {
      if (!b.logConfig?.enable) {
        findings.push({
          backendService: b.name,
          issue: "Load balancer logging disabled",
          exposureRisk: "🟠 Medium",
          recommendation: "Enable logging in backendService.logConfig.",
        });
      }
    });
  } catch (err) {
    console.error("LB Logging Error:", err.message);
    throw new Error("Failed to check LB logging");
  }

  return findings;
}

module.exports = checkLoadBalancerLogging;
