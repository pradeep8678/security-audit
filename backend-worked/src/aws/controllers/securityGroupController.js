const {
  EC2Client,
  DescribeSecurityGroupsCommand,
} = require("@aws-sdk/client-ec2");

exports.scanSecurityGroups = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "AWS accessKeyId and secretAccessKey are required",
      });
    }

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

    const riskyRules = [];
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
          // Ignore AWS-managed default security group
          if (sg.GroupName === "default") continue;

          const sgId = sg.GroupId;
          const sgName = sg.GroupName;

          /** -------------------------------------------
           * 🔥 INGRESS RULES (INBOUND)
           * -------------------------------------------*/
          for (const rule of sg.IpPermissions || []) {
            const isPublic =
              (rule.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0") ||
              (rule.Ipv6Ranges || []).some(r => r.CidrIpv6 === "::/0");

            if (isPublic) {
              riskyRules.push({
                name: sgName,
                id: sgId,
                region,
                direction: "INGRESS",
                severity: "HIGH",
                protocol: rule.IpProtocol === "-1" ? "ALL" : rule.IpProtocol,
                ports: getPortRange(rule),
                sources: [
                  ...rule.IpRanges.map(r => r.CidrIp),
                  ...rule.Ipv6Ranges.map(r => r.CidrIpv6),
                ],
                impact: "This allows anyone on the internet to reach your resources.",
                recommendation: [
                  `Remove 0.0.0.0/0 or ::/0 from inbound rules.`,
                  `Limit access to specific IPs or corporate ranges.`,
                  `Use VPN / Direct Connect / Security Groups referencing instead of public access.`,
                  `If required temporarily, ensure logging & monitoring via VPC Flow Logs.`
                ]
              });
            }
          }

          /** -------------------------------------------
           * 🔥 EGRESS RULES (OUTBOUND)
           * -------------------------------------------*/
          for (const rule of sg.IpPermissionsEgress || []) {
            const isPublic =
              (rule.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0") ||
              (rule.Ipv6Ranges || []).some(r => r.CidrIpv6 === "::/0");

            if (isPublic) {
              riskyRules.push({
                name: sgName,
                id: sgId,
                region,
                direction: "EGRESS",
                severity: "MEDIUM",
                protocol: rule.IpProtocol === "-1" ? "ALL" : rule.IpProtocol,
                ports: getPortRange(rule),
                destinations: [
                  ...rule.IpRanges.map(r => r.CidrIp),
                  ...rule.Ipv6Ranges.map(r => r.CidrIpv6),
                ],
                impact: "Instances can send traffic to any destination on the internet.",
                recommendation: [
                  `Restrict outbound traffic to required IPs or VPC CIDRs.`,
                  `Block outgoing internet access unless explicitly needed.`,
                  `Use VPC endpoints for AWS service access.`,
                ]
              });
            }
          }
        }
      } catch (err) {
        console.log(`⚠️ Skipping region ${region} → ${err.message}`);
      }
    }

    /** --------------------------------------------------------
     * 📌 Final Response
     * --------------------------------------------------------*/
    if (riskyRules.length === 0) {
      return res.json({
        success: true,
        totalSecurityGroups,
        message: "✅ No publicly exposed Security Group rules found.",
        findings: [],
      });
    }

    return res.json({
      success: true,
      totalSecurityGroups,
      riskyRulesCount: riskyRules.length,
      findings: riskyRules,
    });

  } catch (error) {
    console.error("❌ Error scanning security groups:", error);
    res.status(500).json({
      error: "Failed to scan security groups",
      details: error.message,
    });
  }
};


/** Utility: Format port range nicely */
function getPortRange(rule) {
  if (rule.IpProtocol === "-1") return "ALL PORTS";

  if (rule.FromPort == null || rule.ToPort == null)
    return "N/A";

  if (rule.FromPort === rule.ToPort)
    return `${rule.FromPort}`;

  return `${rule.FromPort}-${rule.ToPort}`;
}
