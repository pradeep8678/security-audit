const { google } = require("googleapis");

exports.checkSqlPublicIps = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // ✅ Parse uploaded service account JSON
    const keyFile = JSON.parse(req.file.buffer.toString());

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const sqladmin = google.sqladmin("v1beta4");
    const projectId = keyFile.project_id;

    // ✅ Fetch all Cloud SQL instances
    const resInstances = await sqladmin.instances.list({ project: projectId });
    const instances = resInstances.data.items || [];

    // ✅ Filter and extract public IPs
    const publicInstances = [];

    for (const instance of instances) {
      const ipAddresses = instance.ipAddresses || [];
      for (const ip of ipAddresses) {
        if (ip.type === "PRIMARY" && ip.ipAddress) {
          // You can optionally check if it's in a public range (not private 10.x.x.x or 192.168.x.x)
          publicInstances.push({
            name: instance.name,
            region: instance.region,
            databaseVersion: instance.databaseVersion,
            backendType: instance.backendType,
            ipAddress: ip.ipAddress,
            recommendation: `⚠️ Cloud SQL instance "${instance.name}" is publicly accessible. Consider removing the public IP or using a private connection.`,
          });
        }
      }
    }

    // ✅ Response handling
    if (publicInstances.length === 0) {
      return res.json({
        projectId,
        message: "✅ No public Cloud SQL instances found.",
        instances: [],
      });
    }

    return res.json({
      projectId,
      instances: publicInstances,
    });

  } catch (error) {
    console.error("Error checking SQL public IPs:", error);
    res.status(500).json({ error: "Failed to check SQL public IPs" });
  }
};
