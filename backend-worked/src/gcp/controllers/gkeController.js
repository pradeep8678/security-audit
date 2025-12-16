const { google } = require("googleapis");

exports.checkGKEClusters = async (req, res) => {
  try {
    let keyFile, authClient, projectId;

    if (req.parsedKey && req.authClient) {
      keyFile = req.parsedKey;
      authClient = req.authClient;
      projectId = keyFile.project_id;
    } else if (req.file) {
      keyFile = JSON.parse(req.file.buffer.toString());
      projectId = keyFile.project_id;
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      authClient = await auth.getClient();
    } else {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    google.options({ auth: authClient });

    const container = google.container("v1");

    // Fetch clusters across all locations
    const response = await container.projects.locations.clusters.list({
      parent: `projects/${projectId}/locations/-`,
    });

    const clusters = response.data.clusters || [];
    const findings = [];

    for (const cluster of clusters) {
      const endpoint = cluster.endpoint || "";
      const privateNodes = cluster.privateClusterConfig?.enablePrivateNodes || false;
      const masterIpv4Cidr = cluster.privateClusterConfig?.masterIpv4CidrBlock || null;

      const hasAuthorizedNetworks =
        cluster.masterAuthorizedNetworksConfig?.enabled || false;

      const legacyAbacEnabled = cluster.legacyAbac?.enabled || false;

      const workloadIdentityEnabled =
        cluster.workloadIdentityConfig?.workloadPool ? true : false;

      const shieldedNodesEnabled = cluster.shieldedNodes?.enabled || false;

      const binaryAuthEnabled = cluster.binaryAuthorization?.enabled || false;

      const networkPolicyEnabled = cluster.networkPolicy?.enabled || false;

      let exposureRisk = "🟡 Low";

      // Risk scoring
      if (!privateNodes) exposureRisk = "High";
      if (!hasAuthorizedNetworks && !privateNodes) exposureRisk = "🔴 High";
      if (privateNodes && !hasAuthorizedNetworks) exposureRisk = "🟠 Medium";

      const issues = [];

      if (!privateNodes) {
        issues.push("Control plane endpoint is public.");
      }

      if (!hasAuthorizedNetworks) {
        issues.push("Master Authorized Networks is not enabled.");
      }

      if (legacyAbacEnabled) {
        issues.push("Legacy ABAC is enabled — insecure.");
      }

      if (!workloadIdentityEnabled) {
        issues.push("Workload Identity is not enabled.");
      }

      if (!shieldedNodesEnabled) {
        issues.push("Shielded GKE Nodes are disabled.");
      }

      if (!networkPolicyEnabled) {
        issues.push("Network Policy is disabled.");
      }

      if (!binaryAuthEnabled) {
        issues.push("Binary Authorization is disabled.");
      }

      findings.push({
        name: cluster.name,
        location: cluster.location,
        endpoint,
        privateNodes,
        // masterIpv4Cidr,
        legacyAbacEnabled,
        workloadIdentityEnabled,
        shieldedNodesEnabled,
        networkPolicyEnabled,
        binaryAuthEnabled,
        authorizedNetworksEnabled: hasAuthorizedNetworks,
        exposureRisk,
        // issues,
        recommendation:
          issues.length === 0
            ? "Cluster is well configured based on security best practices."
            : "Review the listed security issues and apply GKE CIS Benchmark + hardening guidelines.",
      });
    }

    // Response
    res.json({
      projectId,
      totalClusters: clusters.length,
      findings,
    });
  } catch (error) {
    console.error("Error checking GKE clusters:", error);
    res.status(500).json({ error: "Failed to check GKE clusters" });
  }
};
