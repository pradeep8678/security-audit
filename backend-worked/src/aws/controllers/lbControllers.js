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
            let exposedToWorld = false;

            // Security Groups Check
            if (lb.SecurityGroups?.length > 0) {
              try {
                const sgResp = await ec2.send(
                  new DescribeSecurityGroupsCommand({
                    GroupIds: lb.SecurityGroups
                  })
                );

                exposedToWorld = sgResp.SecurityGroups.some(sg =>
                  sg.IpPermissions.some(p =>
                    p.IpRanges.some(r => r.CidrIp === "0.0.0.0/0")
                  )
                );
              } catch (err) {
                console.warn(`SG fetch failed in ${region}:`, err.message);
              }
            }

            const isPublic = lb.Scheme === "internet-facing";

            results.push({
              region,
              name: lb.LoadBalancerName,
              dns: lb.DNSName,
              type: lb.Type.toUpperCase(),
              scheme: lb.Scheme,
              is_public: isPublic ? "Yes" : "No",
              exposed_via_sg: exposedToWorld ? "Yes" : "No",
              severity:
                isPublic && exposedToWorld ? "HIGH" :
                isPublic ? "MEDIUM" : "LOW",
              issue:
                isPublic && exposedToWorld
                  ? "Load Balancer is internet-facing AND security group allows 0.0.0.0/0"
                  : isPublic
                  ? "Load Balancer is internet-facing"
                  : "Internal Load Balancer",

              // ✅ SINGLE-LINE RECOMMENDATION
              recommendation:
                isPublic && exposedToWorld
                  ? "Restrict the security group (remove 0.0.0.0/0) and use internal load balancers for production."
                  : isPublic
                  ? "Restrict public access to trusted IPs only and attach AWS WAF to the load balancer."
                  : "No action required; internal load balancer is correctly isolated."
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
            let exposedToWorld = false;

            try {
              const sgResp = await ec2.send(
                new DescribeSecurityGroupsCommand({
                  GroupIds: clb.SecurityGroups
                })
              );

              exposedToWorld = sgResp.SecurityGroups.some(sg =>
                sg.IpPermissions.some(p =>
                  p.IpRanges.some(r => r.CidrIp === "0.0.0.0/0")
                )
              );
            } catch {}

            const isPublic = clb.Scheme === "internet-facing";

            results.push({
              region,
              name: clb.LoadBalancerName,
              dns: clb.DNSName,
              type: "CLASSIC",
              scheme: clb.Scheme,
              is_public: isPublic ? "Yes" : "No",
              exposed_via_sg: exposedToWorld ? "Yes" : "No",
              severity:
                isPublic && exposedToWorld ? "HIGH" :
                isPublic ? "MEDIUM" : "LOW",
              issue:
                isPublic && exposedToWorld
                  ? "Classic Load Balancer is internet-facing AND security group exposes it to 0.0.0.0/0"
                  : isPublic
                  ? "Classic Load Balancer is internet-facing"
                  : "Internal Classic Load Balancer",

              // ✅ SINGLE-LINE RECOMMENDATION
              recommendation:
                isPublic && exposedToWorld
                  ? "Restrict SG inbound access (avoid 0.0.0.0/0) and migrate CLB to ALB/NLB."
                  : isPublic
                  ? "Limit public access to trusted IPs only and move away from Classic ELB."
                  : "No action needed; CLB is internal."
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
