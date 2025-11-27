// controllers/awsRdsController.js
const {
  RDSClient,
  DescribeDBInstancesCommand,
} = require("@aws-sdk/client-rds");

exports.checkRdsPublicInstances = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        error: "Missing AWS accessKeyId or secretAccessKey",
      });
    }

    const regions = [
      "us-east-1", "us-east-2", "us-west-1", "us-west-2",
      "ap-south-1", "ap-south-2", "ap-southeast-1", "ap-southeast-2",
      "ap-southeast-3", "ap-northeast-1", "ap-northeast-2",
      "ap-northeast-3", "ca-central-1", "eu-central-1",
      "eu-central-2", "eu-west-1", "eu-west-2", "eu-west-3",
      "eu-north-1", "eu-south-1", "sa-east-1",
      "me-central-1", "me-south-1",
    ];

    const publicInstances = [];

    for (const region of regions) {
      const client = new RDSClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      try {
        const response = await client.send(new DescribeDBInstancesCommand({}));

        for (const db of response.DBInstances || []) {
          if (db.PubliclyAccessible) {
            publicInstances.push({
              name: db.DBInstanceIdentifier,
              region,
              engine: db.Engine,
              instanceClass: db.DBInstanceClass,
              endpoint: db.Endpoint?.Address || "N/A",
              publiclyAccessible: true,

              // ✅ SINGLE-LINE RECOMMENDATION
              recommendation:
                "Disable public accessibility and move the RDS instance into private subnets.",
            });
          }
        }

      } catch (innerErr) {
        console.log(`Skipping region ${region}:`, innerErr.message);
      }
    }

    if (publicInstances.length === 0) {
      return res.json({
        success: true,
        message: "✅ No publicly accessible RDS instances found.",
        instances: [],
      });
    }

    return res.json({
      success: true,
      message: "⚠️ Public RDS instances detected.",
      instances: publicInstances,
    });

  } catch (err) {
    console.error("Error checking RDS public access:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to check RDS public instances",
    });
  }
};
