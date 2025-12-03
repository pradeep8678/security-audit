const { google } = require("googleapis");

exports.checkOwnerServiceAccounts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Key file is required" });
    }

    const keyFile = JSON.parse(req.file.buffer.toString("utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const crm = google.cloudresourcemanager({
      version: "v1",
      auth,
    });

    const projectId = keyFile.project_id;

    // Fetch project IAM policy
    const policy = await crm.projects.getIamPolicy({
      resource: projectId,
      requestBody: {},
    });

    const ownerData = [];

    for (const binding of policy.data.bindings || []) {
      if (binding.role === "roles/owner") {
        for (const member of binding.members || []) {
          if (member.startsWith("serviceAccount:")) {
            // -----------------------------
            // 🔍 Determine Exposure Risk
            // -----------------------------
            const exposureRisk = "High"; // Owner role is always high risk for a service account

            // -----------------------------
            // 🔍 Recommendations
            // -----------------------------
            const recommendation = [
              "Reduce this service account's permissions following the principle of least privilege.",
              "Avoid giving 'roles/owner' to service accounts unless absolutely necessary.",
              "Rotate keys regularly to minimize credential exposure risk.",
              "Enable monitoring and audit logs to track any usage of this Owner-role service account."
            ].join(" ");

            ownerData.push({
              serviceAccount: member,
              role: binding.role,
              exposureRisk,
              recommendation,
            });
          }
        }
      }
    }

    res.json({
      projectId,
      totalOwnerServiceAccounts: ownerData.length,
      ownerServiceAccounts: ownerData,
      message:
        ownerData.length === 0
          ? "✅ No service accounts with Owner role found."
          : "⚠️ High-risk service accounts found. Review immediately.",
    });
  } catch (error) {
    console.error("Error checking owner service accounts:", error);
    res.status(500).json({
      error: "Failed to fetch owner service accounts",
      details: error.message,
    });
  }
};
