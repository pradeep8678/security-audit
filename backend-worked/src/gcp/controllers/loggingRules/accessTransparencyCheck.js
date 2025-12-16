// loggingRules/accessTransparencyCheck.js
const { google } = require("googleapis");

async function checkAccessTransparency(keyFile, passedAuthClient = null) {
  const findings = [];

  try {
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

    // No direct API exists → check via service usage
    const service = google.serviceusage("v1");

    const res = await service.services.get({
      name: `projects/${projectId}/services/transparency.googleapis.com`,
    });

    if (res.data.state !== "ENABLED") {
      findings.push({
        issue: "Access Transparency disabled",
        exposureRisk: "🟠 Medium",
        recommendation: "Enable 'Access Transparency' API.",
      });
    }
  } catch (err) {
    findings.push({
      issue: "Access Transparency not enabled",
      exposureRisk: "🟠 Medium",
      recommendation: "Enable Access Transparency.",
    });
  }

  return findings;
}

module.exports = checkAccessTransparency;
