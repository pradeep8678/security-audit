// loggingRules/accessTransparencyCheck.js
const { google } = require("googleapis");

async function checkAccessTransparency(keyFile) {
  const findings = [];

  try {
    const projectId = keyFile.project_id;

    // No direct API exists → check via service usage
    const service = google.serviceusage("v1");

    const res = await service.services.get({
      name: `projects/${projectId}/services/transparency.googleapis.com`,
    });

    if (res.data.state !== "ENABLED") {
      findings.push({
        issue: "Access Transparency disabled",
        exposureRisk: "Medium",
        recommendation: "Enable 'Access Transparency' API.",
      });
    }
  } catch (err) {
    findings.push({
      issue: "Access Transparency not enabled",
      exposureRisk: "Medium",
      recommendation: "Enable Access Transparency.",
    });
  }

  return findings;
}

module.exports = checkAccessTransparency;
