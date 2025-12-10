// loggingRules/cloudDnsLoggingCheck.js
const { google } = require("googleapis");

async function checkCloudDnsLogging(keyFile) {
  const findings = [];

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const dns = google.dns("v1");
    const projectId = keyFile.project_id;

    const res = await dns.policies.list({ project: projectId });
    const policies = res.data.policies || [];

    policies.forEach((p) => {
      if (!p.enableLogging) {
        findings.push({
          policy: p.name,
          issue: "DNS logging disabled",
          exposureRisk: "Medium",
          recommendation: "Enable DNS logging for all networks.",
        });
      }
    });
  } catch (err) {
    console.error("Cloud DNS Logging Error:", err.message);
    throw new Error("Failed to check DNS logging");
  }
  return findings;
}

module.exports = checkCloudDnsLogging;
