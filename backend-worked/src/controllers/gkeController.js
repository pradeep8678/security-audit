const { google } = require("googleapis");

exports.checkGKEClusters = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // Parse uploaded key file JSON
    const keyFile = JSON.parse(req.file.buffer.toString());
    const projectId = keyFile.project_id;

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const container = google.container("v1");

    // Get all clusters across all locations
    const response = await container.projects.locations.clusters.list({
      parent: `projects/${projectId}/locations/-`,
    });

    const clusters = response.data.clusters || [];
    const publicClusters = [];

    for (const cluster of clusters) {
      const endpoint = cluster.endpoint || "";
      const privateNodes =
        cluster.privateClusterConfig?.enablePrivateNodes || false;

      if (endpoint && !privateNodes) {
        publicClusters.push({
          name: cluster.name,
          location: cluster.location,
          endpoint,
          privateNodes,
          recommendation:
            "⚠️ Public endpoint detected. Consider enabling Private Nodes or restrict API server access.",
        });
      }
    }

    if (publicClusters.length === 0) {
      return res.json({
        projectId,
        message:
          "✅ No publicly accessible GKE clusters found. All clusters have private endpoints.",
        clusters: [],
      });
    }

    res.json({
      projectId,
      clusters: publicClusters,
    });
  } catch (error) {
    console.error("Error checking GKE clusters:", error);
    res.status(500).json({ error: "Failed to check GKE clusters" });
  }
};
