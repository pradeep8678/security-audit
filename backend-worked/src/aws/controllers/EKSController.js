const {
  EKSClient,
  ListClustersCommand,
  DescribeClusterCommand
} = require("@aws-sdk/client-eks");

const {
  EC2Client,
  DescribeRegionsCommand
} = require("@aws-sdk/client-ec2");

/** 🔍 Get all AWS regions */
async function getAllRegions(credentials) {
  const ec2 = new EC2Client({
    region: "us-east-1",
    credentials
  });

  const res = await ec2.send(new DescribeRegionsCommand({}));
  return res.Regions.map(r => r.RegionName);
}

/** 🔍 Pure function — For full audit */
async function analyzeEKSClusters(credentials) {
  try {
    const { accessKeyId, secretAccessKey } = credentials;

    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: "Missing AWS credentials" };
    }

    const awsCreds = { accessKeyId, secretAccessKey };
    const regions = await getAllRegions(awsCreds);

    const riskyClusters = [];

    for (const region of regions) {
      const eks = new EKSClient({ region, credentials: awsCreds });

      const listRes = await eks.send(new ListClustersCommand({}));
      const clusters = listRes.clusters || [];

      for (const name of clusters) {
        const details = await eks.send(new DescribeClusterCommand({ name }));
        const cluster = details.cluster;
        const publicAccess = cluster?.resourcesVpcConfig?.endpointPublicAccess;
        const privateAccess = cluster?.resourcesVpcConfig?.endpointPrivateAccess;

        // 🔥 HIGH RISK: Public ON, Private OFF
        if (publicAccess && !privateAccess) {
          riskyClusters.push({
            name,
            region,
            endpoint: cluster?.endpoint,
            severity: "HIGH",
            issue: "EKS cluster API endpoint is publicly accessible without private endpoint enabled.",
            recommendation: "Disable public endpoint access, enable private endpoint, restrict CIDRs, and use IAM/RBAC for least privilege."
          });
        }

        // ⚠️ MEDIUM RISK: Public ON, Private ON
        else if (publicAccess && privateAccess) {
          riskyClusters.push({
            name,
            region,
            endpoint: cluster?.endpoint,
            severity: "MEDIUM",
            issue: "EKS cluster public endpoint is enabled along with private endpoint.",
            recommendation: "Restrict public access CIDRs to trusted IPs, prefer private endpoint only, and monitor API access via CloudTrail."
          });
        }
      }
    }

    if (riskyClusters.length === 0) {
      return {
        success: true,
        message: "✅ No publicly accessible or risky EKS clusters found.",
        clusters: []
      };
    }

    return {
      success: true,
      totalRiskyClusters: riskyClusters.length,
      clusters: riskyClusters
    };

  } catch (err) {
    console.error("❌ Error analyzing EKS clusters:", err);
    return { success: false, error: "Failed to analyze EKS clusters" };
  }
}

/** 🌐 Express Route Version */
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
