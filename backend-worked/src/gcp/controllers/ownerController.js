const { google } = require("googleapis");

exports.checkOwnerServiceAccounts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Key file is required" });
    }

    const keyFileBuffer = req.file.buffer.toString("utf8");
    const keyFile = JSON.parse(keyFileBuffer);

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const crm = google.cloudresourcemanager({
      version: "v1",
      auth,
    });

    const projectId = keyFile.project_id;
    const policy = await crm.projects.getIamPolicy({
      resource: projectId,
      requestBody: {},
    });

    const ownerData = [];
    for (const binding of policy.data.bindings || []) {
      if (binding.role === "roles/owner") {
        for (const member of binding.members || []) {
          if (member.startsWith("serviceAccount:")) {
            ownerData.push({
              serviceAccount: member,
              role: binding.role,
            });
          }
        }
      }
    }

    res.json({
      projectId,
      totalOwnerServiceAccounts: ownerData.length,
      ownerServiceAccounts: ownerData,
    });
  } catch (error) {
    console.error("Error checking owner service accounts:", error);
    res.status(500).json({
      error: "Failed to fetch owner service accounts",
      details: error.message,
    });
  }
};
