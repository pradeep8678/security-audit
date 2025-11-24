const {
  EKSClient,
  ListClustersCommand,
  DescribeClusterCommand
} = require("@aws-sdk/client-eks");

const {
  EC2Client,
  DescribeRegionsCommand
} = require("@aws-sdk/client-ec2");

/**
 * 🔍 Get all AWS regions
 */
async function getAllRegions(credentials) {
  const ec2 = new EC2Client({
    region: "us-east-1",
    credentials
  });

  const res = await ec2.send(new DescribeRegionsCommand({}));
  return res.Regions.map(r => r.RegionName);
}

/**
 * 🔍 Pure function — For full audit
 * Accepts: { accessKeyId, secretAccessKey }
 * Returns: list of EKS clusters with public access
 */
async function analyzeEKSClusters(credentials) {
  try {
    const { accessKeyId, secretAccessKey } = credentials;

    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: "Missing AWS credentials" };
    }

    const awsCreds = {
      accessKeyId,
      secretAccessKey
    };

    const regions = await getAllRegions(awsCreds);
    const publicClusters = [];

    for (const region of regions) {
      const eks = new EKSClient({
        region,
        credentials: awsCreds
      });

      // STEP 1: List clusters in this region
      const listRes = await eks.send(new ListClustersCommand({}));
      const clusters = listRes.clusters || [];

      for (const name of clusters) {
        // STEP 2: Describe cluster to check endpoint access
        const details = await eks.send(
          new DescribeClusterCommand({ name })
        );

        const cluster = details.cluster;
        const endpointPublic =
          cluster?.resourcesVpcConfig?.endpointPublicAccess;

        const endpointPrivate =
          cluster?.resourcesVpcConfig?.endpointPrivateAccess;

        if (endpointPublic && !endpointPrivate) {
          publicClusters.push({
            name,
            region,
            endpoint: cluster?.endpoint,
            recommendation:
              "⚠️ EKS cluster has a public endpoint. Disable public access or restrict CIDR ranges."
          });
        }
      }
    }

    if (publicClusters.length === 0) {
      return {
        success: true,
        message: "✅ No publicly accessible EKS clusters found.",
        clusters: []
      };
    }

    return {
      success: true,
      clusters: publicClusters
    };

  } catch (err) {
    console.error("❌ Error analyzing EKS clusters:", err);
    return { success: false, error: "Failed to analyze EKS clusters" };
  }
}

/**
 * 🌐 Express Route Version
 * Expects: { accessKeyId, secretAccessKey } in req.body
 */
exports.listEKSClusters = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "Missing AWS credentials (accessKeyId, secretAccessKey)"
      });
    }

    const result = await analyzeEKSClusters({ accessKeyId, secretAccessKey });
    res.status(result.success ? 200 : 500).json(result);

  } catch (err) {
    console.error("❌ Error in listEKSClusters route:", err);
    res.status(500).json({ error: "Failed to fetch EKS clusters" });
  }
};

// Export pure function for full audit usage
exports.analyzeEKSClusters = analyzeEKSClusters;
