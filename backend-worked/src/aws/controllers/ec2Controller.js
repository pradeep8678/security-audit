const {
  EC2Client,
  DescribeInstancesCommand,
  DescribeRegionsCommand
} = require("@aws-sdk/client-ec2");

exports.listEC2Instances = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "Missing AWS credentials (accessKeyId, secretAccessKey)"
      });
    }

    const baseClient = new EC2Client({
      region: "us-east-1",
      credentials: { accessKeyId, secretAccessKey }
    });

    // Step 1 — Get all AWS regions
    const regionData = await baseClient.send(new DescribeRegionsCommand({}));
    const allRegions = regionData.Regions.map(r => r.RegionName);

    console.log("🌎 Scanning regions:", allRegions.join(", "));

    let allPublicInstances = []; // ONLY PUBLIC INSTANCES

    // Step 2 — Scan each region
    for (const region of allRegions) {
      const client = new EC2Client({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });

      console.log(`🔍 Checking region: ${region}`);

      try {
        const response = await client.send(new DescribeInstancesCommand({}));
        const reservations = response.Reservations || [];

        reservations.forEach(r => {
          (r.Instances || []).forEach(instance => {
            const publicIP = instance.PublicIpAddress;

            // ❗ Only include PUBLIC instances
            if (publicIP) {
              allPublicInstances.push({
                instanceId: instance.InstanceId,
                region,
                instanceType: instance.InstanceType,
                publicIp: publicIP,
                privateIp: instance.PrivateIpAddress || null,

                // ⭐ Single-line recommendation
                recommendation: `EC2 instance "${instance.InstanceId}" is publicly accessible — remove public IP if not needed, restrict 0.0.0.0/0 inbound rules, move to private subnet, or use bastion/SSM.`
              });
            }
          });
        });
      } catch (err) {
        console.warn(`⚠️ Skipping region ${region}: ${err.message}`);
      }
    }

    return res.json({
      message: "AWS EC2 Public VM audit completed successfully",
      scannedRegions: allRegions.length,
      totalPublicInstances: allPublicInstances.length,
      instances: allPublicInstances
    });

  } catch (error) {
    console.error("❌ AWS EC2 Audit Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
