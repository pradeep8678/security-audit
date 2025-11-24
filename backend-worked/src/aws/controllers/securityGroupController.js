const {
  EC2Client,
  DescribeSecurityGroupsCommand,
} = require("@aws-sdk/client-ec2");

exports.scanSecurityGroups = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    // ❗ Validate input
    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "AWS accessKeyId and secretAccessKey are required",
      });
    }

    // 🌍 All AWS regions supporting EC2
    const regions = [
      "us-east-1", "us-east-2",
      "us-west-1", "us-west-2",
      "eu-west-1", "eu-west-2", "eu-west-3",
      "eu-central-1", "eu-central-2",
      "ap-south-1", "ap-south-2",
      "ap-southeast-1", "ap-southeast-2",
      "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
      "ca-central-1",
      "sa-east-1",
      "me-south-1", "me-central-1"
    ];

    const publicRules = [];
    let totalSecurityGroups = 0;

    for (const region of regions) {
      const ec2 = new EC2Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      try {
        const response = await ec2.send(new DescribeSecurityGroupsCommand({}));
        const groups = response.SecurityGroups || [];

        totalSecurityGroups += groups.length;

        for (const sg of groups) {
          const sgName = sg.GroupName;
          const sgId = sg.GroupId;

          // -------- INGRESS (Inbound Rules) --------
          for (const rule of sg.IpPermissions || []) {
            const isPublic =
              (rule.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0") ||
              (rule.Ipv6Ranges || []).some(r => r.CidrIpv6 === "::/0");

            if (isPublic) {
              publicRules.push({
                name: sgName,
                id: sgId,
                region,
                direction: "INGRESS",
                protocol: rule.IpProtocol,
                ports:
                  rule.FromPort === rule.ToPort
                    ? rule.FromPort
                    : `${rule.FromPort}-${rule.ToPort}`,
                sourceRanges: [
                  ...rule.IpRanges.map(r => r.CidrIp),
                  ...rule.Ipv6Ranges.map(r => r.CidrIpv6),
                ],
                recommendation: `⚠️ Security Group "${sgName}" (${sgId}) in ${region} allows public INGRESS. Restrict 0.0.0.0/0.`,
              });
            }
          }

          // -------- EGRESS (Outbound Rules) --------
          for (const rule of sg.IpPermissionsEgress || []) {
            const isPublic =
              (rule.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0") ||
              (rule.Ipv6Ranges || []).some(r => r.CidrIpv6 === "::/0");

            if (isPublic) {
              publicRules.push({
                name: sgName,
                id: sgId,
                region,
                direction: "EGRESS",
                protocol: rule.IpProtocol,
                ports:
                  rule.FromPort === rule.ToPort
                    ? rule.FromPort
                    : `${rule.FromPort}-${rule.ToPort}`,
                destinationRanges: [
                  ...rule.IpRanges.map(r => r.CidrIp),
                  ...rule.Ipv6Ranges.map(r => r.CidrIpv6),
                ],
                recommendation: `⚠️ Security Group "${sgName}" (${sgId}) in ${region} allows public EGRESS. Restrict if not required.`,
              });
            }
          }
        }
      } catch (err) {
        console.log(`Skipping region ${region}: ${err.message}`);
      }
    }

    // ---------------- Response ----------------
    if (publicRules.length === 0) {
      return res.json({
        message: "✅ No public Security Group rules found in any region.",
        publicRules: [],
      });
    }

    return res.json({
      totalSecurityGroups,
      publicRulesCount: publicRules.length,
      publicRules,
    });
  } catch (error) {
    console.error("❌ Error scanning SG rules:", error);
    res.status(500).json({
      error: "Failed to scan security groups",
      details: error.message,
    });
  }
};
