const { google } = require("googleapis");

exports.checkSqlPublicIps = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    const keyFile = JSON.parse(req.file.buffer.toString());

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const sqladmin = google.sqladmin("v1beta4");
    const projectId = keyFile.project_id;

    const resInstances = await sqladmin.instances.list({ project: projectId });
    const instances = resInstances.data.items || [];

    const publicInstances = [];

    for (const instance of instances) {
      const ipAddresses = instance.ipAddresses || [];

      for (const ip of ipAddresses) {
        if (ip.type === "PRIMARY" && ip.ipAddress) {
          // Determine exposure risk
          const exposureRisk = "High"; // Public IP on a Cloud SQL instance is always high risk

          // Recommendation
          const recommendation = [
            `Cloud SQL instance "${instance.name}" is publicly accessible.`,
            "Consider removing the public IP or configuring private IP.",
            "Use Cloud SQL Proxy or VPC peering for secure access.",
            "Enable SSL/TLS connections and restrict authorized networks."
          ].join(" ");

          publicInstances.push({
            name: instance.name,
            region: instance.region,
            databaseVersion: instance.databaseVersion,
            backendType: instance.backendType,
            ipAddress: ip.ipAddress,
            exposureRisk,
            recommendation,
          });
        }
      }
    }

    if (publicInstances.length === 0) {
      return res.json({
        projectId,
        message: "✅ No public Cloud SQL instances found.",
        instances: [],
      });
    }

    res.json({
      projectId,
      totalPublicInstances: publicInstances.length,
      instances: publicInstances,
    });

  } catch (error) {
    console.error("Error checking SQL public IPs:", error);
    res.status(500).json({ error: "Failed to check SQL public IPs", details: error.message });
  }
};
