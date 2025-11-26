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

    // Base client for regions
    const baseClient = new EC2Client({
      region: "us-east-1",
      credentials: { accessKeyId, secretAccessKey }
    });

    // Step 1 — Get all AWS regions
    const regionData = await baseClient.send(new DescribeRegionsCommand({}));
    const allRegions = regionData.Regions.map(r => r.RegionName);

    console.log("🌎 Scanning regions:", allRegions.join(", "));

    let allInstances = []; // <-- IMPORTANT

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

        reservations.forEach((r) => {
          (r.Instances || []).forEach((instance) => {
            const publicIP = instance.PublicIpAddress;

            allInstances.push({
              instanceId: instance.InstanceId,
              region,
              instanceType: instance.InstanceType,
              publicIp: publicIP || null,
              privateIp: instance.PrivateIpAddress || null,
              state: instance.State?.Name,

              // 🚫 launchTime removed
              // launchTime: instance.LaunchTime,

              // ⭐ Correct recommendation
              recommendation: publicIP
                ? "⚠️ Instance exposed publicly — remove public IP or restrict inbound rules"
                : "No public exposure detected"
            });
          });
        });
      } catch (err) {
        console.warn(`⚠️ Skipping region ${region}: ${err.message}`);
      }
    }

    const publicCount = allInstances.filter(i => i.publicIp).length;

    return res.json({
      message: "AWS EC2 Public VM audit completed successfully",
      scannedRegions: allRegions.length,
      totalInstances: allInstances.length,
      totalPublicInstances: publicCount,
      instances: allInstances
    });

  } catch (error) {
    console.error("❌ AWS EC2 Audit Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
