// loggingRules/logSinkCheck.js
const { google } = require("googleapis");

async function checkLogSinks(keyFile, passedAuthClient = null) {
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
    const logging = google.logging("v2");

    const res = await logging.projects.sinks.list({
      parent: `projects/${projectId}`,
    });

    const sinks = res.data.sinks || [];

    if (!sinks.find((s) => s.filter?.includes("logName:\"logs/\""))) {
      findings.push({
        access: "log-sink-missing",
        exposureRisk: "🟠 Medium",
        recommendation: "Create a sink to export ALL logs.",
      });
    }
  } catch (err) {
    console.error("Log Sink Error:", err.message);
    throw new Error("Failed to verify log sinks");
  }
  return findings;
}

module.exports = checkLogSinks;
