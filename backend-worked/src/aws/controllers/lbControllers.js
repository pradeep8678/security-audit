const {
  EC2Client,
  DescribeRegionsCommand,
  DescribeSecurityGroupsCommand
} = require("@aws-sdk/client-ec2");

// ALB + NLB (v2)
const {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand: DescribeV2LBs
} = require("@aws-sdk/client-elastic-load-balancing-v2");

// Classic ELB
const {
  ElasticLoadBalancingClient,
  DescribeLoadBalancersCommand: DescribeClassicLBs
} = require("@aws-sdk/client-elastic-load-balancing");


// ------------------------------------------------------
// RAW FUNCTION — SCANS ALL REGIONS
// ------------------------------------------------------
async function analyzeAwsLoadBalancers({ accessKeyId, secretAccessKey }) {
  try {
    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: "Missing AWS credentials" };
    }

    // Get list of regions
    const ec2Global = new EC2Client({
      region: "us-east-1",
      credentials: { accessKeyId, secretAccessKey }
    });

    const regionResp = await ec2Global.send(new DescribeRegionsCommand({}));
    const regions = regionResp.Regions.map(r => r.RegionName);

    const results = [];

    // Scan each region
    for (const region of regions) {
      const elbV2 = new ElasticLoadBalancingV2Client({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });

      const elbClassic = new ElasticLoadBalancingClient({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });

      const ec2 = new EC2Client({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });

      // ---------------------- ALB / NLB ----------------------
      try {
        const lbRes = await elbV2.send(new DescribeV2LBs({}));

        if (lbRes.LoadBalancers) {
          for (const lb of lbRes.LoadBalancers) {
            let exposed = "Unknown";

            // Security Groups Check
            if (lb.SecurityGroups?.length > 0) {
              try {
                const sgResp = await ec2.send(
                  new DescribeSecurityGroupsCommand({
                    GroupIds: lb.SecurityGroups
                  })
                );

                const hasPublic = sgResp.SecurityGroups.some(sg =>
                  sg.IpPermissions.some(p =>
                    p.IpRanges.some(r => r.CidrIp === "0.0.0.0/0")
                  )
                );

                exposed = hasPublic ? "Yes" : "No";
              } catch (err) {
                console.warn(`SG fetch failed in ${region}:`, err.message);
              }
            }

            results.push({
              region,
              name: lb.LoadBalancerName,
              dns: lb.DNSName,
              type: lb.Type,
              scheme: lb.Scheme,
              is_public: lb.Scheme === "internet-facing" ? "Yes" : "No",
              exposed_to_public: exposed
            });
          }
        }
      } catch (err) {
        console.warn(`ALB/NLB error in ${region}:`, err.message);
      }

      // ---------------------- CLASSIC ELB ----------------------
      try {
        const clbRes = await elbClassic.send(new DescribeClassicLBs({}));

        if (clbRes.LoadBalancerDescriptions) {
          for (const clb of clbRes.LoadBalancerDescriptions) {
            let exposed = "Unknown";

            try {
              const sgResp = await ec2.send(
                new DescribeSecurityGroupsCommand({
                  GroupIds: clb.SecurityGroups
                })
              );

              const hasPublic = sgResp.SecurityGroups.some(sg =>
                sg.IpPermissions.some(p =>
                  p.IpRanges.some(r => r.CidrIp === "0.0.0.0/0")
                )
              );

              exposed = hasPublic ? "Yes" : "No";
            } catch {}

            results.push({
              region,
              name: clb.LoadBalancerName,
              dns: clb.DNSName,
              type: "classic",
              scheme: clb.Scheme,
              is_public: clb.Scheme === "internet-facing" ? "Yes" : "No",
              exposed_to_public: exposed
            });
          }
        }
      } catch (err) {
        console.warn(`Classic ELB error in ${region}:`, err.message);
      }
    }

    return { success: true, loadBalancers: results };
  } catch (err) {
    console.error("❌ LB Scan Error:", err);
    return { success: false, error: "Failed to analyze AWS Load Balancers" };
  }
}



// ------------------------------------------------------
// EXPRESS ROUTE
// ------------------------------------------------------
async function listAwsLoadBalancers(req, res) {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "Missing AWS credentials"
      });
    }

    const result = await analyzeAwsLoadBalancers({ accessKeyId, secretAccessKey });
    res.status(result.success ? 200 : 500).json(result);

  } catch (err) {
    console.error("Route error:", err);
    res.status(500).json({ error: "Failed to audit AWS Load Balancers" });
  }
}

module.exports = {
  analyzeAwsLoadBalancers,
  listAwsLoadBalancers
};
