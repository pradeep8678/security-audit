const { google } = require("googleapis");

exports.listVMs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // Parse the uploaded key JSON file
    const keyFile = JSON.parse(req.file.buffer.toString("utf8"));

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const compute = google.compute({
      version: "v1",
      auth: await auth.getClient(),
    });

    const projectId = keyFile.project_id;
    const publicVMs = [];

    console.log(`🚀 Scanning all Compute Engine instances in project: ${projectId}`);

    // Call aggregatedList once (includes all zones)
    let request = compute.instances.aggregatedList({ project: projectId });

    while (request) {
      const response = await request;

      if (!response || !response.data) {
        console.warn("⚠️ Empty response received from aggregatedList.");
        break;
      }

      const items = response.data.items || {};

      for (const [zone, scopedList] of Object.entries(items)) {
        const instances = scopedList.instances || [];

        instances.forEach((instance) => {
          const name = instance.name;
          const networkInterfaces = instance.networkInterfaces || [];

          networkInterfaces.forEach((nic) => {
            const accessConfigs = nic.accessConfigs || [];

            accessConfigs.forEach((ac) => {
              if (ac.natIP) {
                publicVMs.push({
                  name,
                  zone,
                  publicIP: ac.natIP,
                  internalIP: nic.networkIP,
                  machineType: instance.machineType?.split("/").pop(),
                  status: instance.status,
                });
              }
            });
          });
        });
      }

      // Pagination
      request = response.data.nextPageToken
        ? compute.instances.aggregatedList({
            project: projectId,
            pageToken: response.data.nextPageToken,
          })
        : null;
    }

    console.log(`✅ Found ${publicVMs.length} VM(s) with public IPs.`);

    res.json({
      message: "Public VM audit completed successfully",
      projectId,
      totalPublicVMs: publicVMs.length,
      instances: publicVMs,
    });
  } catch (err) {
    console.error("❌ Error in VM audit:", err);
    res.status(500).json({ error: err.message });
  }
};
