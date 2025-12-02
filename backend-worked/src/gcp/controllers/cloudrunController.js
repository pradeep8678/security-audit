// src/controllers/lbController.js
const { google } = require("googleapis");

/**
 * 🔍 Pure reusable audit function (no Express res)
 * Used by fullAuditController
 */
async function analyzeCloudRunAndFunctions(keyFile) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const projectId = keyFile.project_id;
    const cloudFunctions = google.cloudfunctions({ version: "v1", auth });
    const cloudRun = google.run({ version: "v1", auth });
    const results = [];

    // ---------------- Cloud Functions ----------------
    try {
      const fnRes = await cloudFunctions.projects.locations.functions.list({
        parent: `projects/${projectId}/locations/-`,
      });

      for (const fn of fnRes.data.functions || []) {
        const name = fn.name.split("/").pop();
        const region = fn.name.split("/")[3] || "global";
        const runtime = fn.runtime || "N/A";
        const triggerType = fn.httpsTrigger ? "HTTP" : "Event";
        const url =
          fn.httpsTrigger?.url || `https://${region}-${projectId}.cloudfunctions.net/${name}`;
        const ingress = fn.ingressSettings || "N/A";
        const authLevel = fn.httpsTrigger?.securityLevel || "N/A";
        const sa = fn.serviceAccountEmail || "N/A";
        const unauthenticated = authLevel === "SECURE_OPTIONAL" ? "Yes" : "No";

        const exposureRisk =
          ingress === "ALLOW_ALL" || unauthenticated === "Yes"
            ? "High"
            : ingress === "ALLOW_INTERNAL_AND_GCLB"
            ? "Medium"
            : "Low";

        results.push({
          type: "Cloud Function",
          name,
          region,
          runtime,
          url,
          ingress,
          auth: authLevel,
          serviceAccount: sa,
          unauthenticated,
          exposureRisk,
          recommendation:
            "⚠️ Restrict unauthenticated invocations and apply ingress controls for internal-only access.",
        });
      }
    } catch (err) {
      console.error("Error fetching Cloud Functions:", err);
      results.push({
        type: "Cloud Function",
        name: `Error: ${err.message}`,
        exposureRisk: "Unknown",
      });
    }

    // ---------------- Cloud Run ----------------
    try {
      const runRes = await cloudRun.projects.locations.services.list({
        parent: `projects/${projectId}/locations/-`,
      });

      for (const svc of runRes.data.items || []) {
        const metadata = svc.metadata || {};
        const spec = svc.spec || {};
        const tmplSpec = spec.template?.spec || {};

        const name = metadata.name || "N/A";
        const region = metadata.labels?.["cloud.googleapis.com/location"] || "global";
        const url = svc.status?.url || "N/A";
        const ingress = metadata.annotations?.["run.googleapis.com/ingress"] || "N/A";
        const sa = tmplSpec.serviceAccountName || "N/A";

        let unauthenticated = "No";
        let authLevel = "Unknown";

        try {
          const policy = await cloudRun.projects.locations.services.getIamPolicy({
            resource: `projects/${projectId}/locations/${region}/services/${name}`,
          });

          const members = (policy.data.bindings || []).flatMap((b) => b.members || []);
          const hasAllUsers = members.some((m) => m.includes("allUsers"));
          const hasAllAuthUsers = members.some((m) => m.includes("allAuthenticatedUsers"));

          unauthenticated = hasAllUsers ? "Yes" : "No";
          authLevel = hasAllUsers
            ? "Unauthenticated"
            : hasAllAuthUsers
            ? "All Authenticated Users"
            : "Restricted";
        } catch (e) {
          console.warn(`Policy fetch failed for ${name}:`, e.message);
        }

        const exposureRisk =
          ingress === "all" || unauthenticated === "Yes"
            ? "High"
            : ingress === "internal-and-cloud-load-balancing"
            ? "Medium"
            : "Low";

        results.push({
          type: "Cloud Run",
          name,
          region,
          runtime: "N/A",
          url,
          ingress,
          auth: authLevel,
          serviceAccount: sa,
          unauthenticated,
          exposureRisk,
          recommendation:
            "Restrict unauthenticated invocations and use ingress controls for internal-only access.",
        });
      }
    } catch (err) {
      console.error("Error fetching Cloud Run:", err);
      results.push({
        type: "Cloud Run",
        name: `Error: ${err.message}`,
        exposureRisk: "Unknown",
      });
    }

    return { success: true, projectId, functionsAndRuns: results };
  } catch (error) {
    console.error("Scan Cloud Run & Function failed:", error);
    return {
      success: false,
      error: "Failed to scan Cloud Run & Functions",
      details: error.message,
    };
  }
}

/**
 * 🌐 Express route handler — unchanged for your normal API
 */
exports.scanCloudRunAndFunctions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Key file is required" });

    const keyFileBuffer = req.file.buffer.toString("utf8");
    const keyFile = JSON.parse(keyFileBuffer);

    const result = await analyzeCloudRunAndFunctions(keyFile);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Scan Cloud Run & Function failed:", error);
    res
      .status(500)
      .json({ error: "Failed to scan Cloud Run & Functions", details: error.message });
  }
};

// ✅ Export both
exports.analyzeCloudRunAndFunctions = analyzeCloudRunAndFunctions;
