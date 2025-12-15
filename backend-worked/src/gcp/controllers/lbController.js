const { google } = require("googleapis");

exports.checkLoadBalancersAudit = async (req, res) => {
  try {
    let keyFile, authClient, projectId;

    if (req.parsedKey && req.authClient) {
      keyFile = req.parsedKey;
      authClient = req.authClient;
      projectId = keyFile.project_id;
    } else if (req.file) {
      keyFile = JSON.parse(req.file.buffer.toString("utf8"));
      projectId = keyFile.project_id;
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      authClient = await auth.getClient();
    } else {
      return res.status(400).json({ error: "Key file is required" });
    }

    google.options({ auth: authClient });

    const compute = google.compute({ version: "v1", auth: authClient });
    const lbData = [];
    const getName = (url = "") => url.split("/").pop();
    let nextPageToken = null;

    do {
      const page = await compute.forwardingRules.aggregatedList({
        project: projectId,
        pageToken: nextPageToken,
      });

      const items = page.data.items || {};

      for (const [, scopedList] of Object.entries(items)) {
        const rules = scopedList.forwardingRules || [];

        for (const rule of rules) {
          const lbName = rule.name;
          const scheme = rule.loadBalancingScheme || "";
          const target = rule.target || "";
          const ip = rule.IPAddress || "None";

          let sslPolicy = "N/A";
          let sslCertStatus = "N/A";
          let cloudArmorPolicy = "N/A";
          let httpsRedirect = "N/A";
          let armorRuleStrength = "N/A";
          let exposureRisk = "Low";

          try {
            // HTTPS Load Balancer
            if (target.includes("targetHttpsProxies")) {
              const proxyName = getName(target);
              const proxy = await compute.targetHttpsProxies.get({
                project: projectId,
                targetHttpsProxy: proxyName,
              });

              sslPolicy = proxy.data.sslPolicy || "None";
              cloudArmorPolicy = proxy.data.securityPolicy || "None";

              const certUrls = proxy.data.sslCertificates || [];
              sslCertStatus =
                certUrls.length > 0
                  ? certUrls.map((url) => `Valid till: ${url}`).join(", ")
                  : "No SSL Certificates attached";

              if (cloudArmorPolicy !== "None") {
                const policy = await compute.securityPolicies.get({
                  project: projectId,
                  securityPolicy: getName(cloudArmorPolicy),
                });
                armorRuleStrength =
                  policy.data.rules?.length > 0
                    ? `Strong - ${policy.data.rules.length} rules`
                    : "Weak - No rules found";
              }
            }

            // HTTP Load Balancer
            else if (target.includes("targetHttpProxies")) {
              const proxyName = getName(target);
              const proxy = await compute.targetHttpProxies.get({
                project: projectId,
                targetHttpProxy: proxyName,
              });

              cloudArmorPolicy = proxy.data.securityPolicy || "None";

              if (proxy.data.urlMap) {
                const urlMapName = getName(proxy.data.urlMap);
                const urlMap = await compute.urlMaps.get({
                  project: projectId,
                  urlMap: urlMapName,
                });

                const matchers = urlMap.data.pathMatchers || [];
                httpsRedirect = matchers.some((m) =>
                  m.defaultRouteAction?.redirectAction
                )
                  ? "Yes"
                  : "No";
              } else {
                httpsRedirect = "No URL Map found";
              }

              if (cloudArmorPolicy !== "None") {
                const policy = await compute.securityPolicies.get({
                  project: projectId,
                  securityPolicy: getName(cloudArmorPolicy),
                });
                armorRuleStrength =
                  policy.data.rules?.length > 0
                    ? `Strong - ${policy.data.rules.length} rules`
                    : "Weak - No rules found";
              }
            }

            // ---------------------------
            // Determine exposure risk
            // ---------------------------
            // High: No SSL / No Cloud Armor / No HTTPS redirect
            if (
              sslPolicy === "None" ||
              sslCertStatus.includes("No SSL") ||
              armorRuleStrength.startsWith("Weak") ||
              httpsRedirect === "No"
            ) {
              exposureRisk = "High";
            }
            // Medium: Some issues
            else if (
              sslPolicy !== "None" &&
              sslCertStatus.includes("Valid") &&
              armorRuleStrength.startsWith("Strong") &&
              httpsRedirect === "Yes"
            ) {
              exposureRisk = "Low";
            } else {
              exposureRisk = "Medium";
            }
          } catch (err) {
            console.error(`Error fetching LB details for ${lbName}:`, err.message);
            exposureRisk = "High"; // assume high if audit fails
          }

          // ---------------------------
          // Recommendations
          // ---------------------------
          const recommendation = [];
          if (sslPolicy === "None" || sslPolicy === "N/A")
            recommendation.push("Attach SSL policy.");
          if (sslCertStatus.includes("No SSL"))
            recommendation.push("Attach valid SSL certificate.");
          if (armorRuleStrength.startsWith("Weak") || cloudArmorPolicy === "None")
            recommendation.push("Apply Cloud Armor policy.");
          if (httpsRedirect === "No")
            recommendation.push("Enable HTTPS redirect.");
          if (recommendation.length === 0)
            recommendation.push("Configuration follows best practices.");

          lbData.push({
            name: lbName,
            scheme,
            ip,
            ssl_policy: sslPolicy,
            ssl_cert_status: sslCertStatus,
            https_redirect: httpsRedirect,
            cloud_armor_policy: cloudArmorPolicy,
            armor_rule_strength: armorRuleStrength,
            exposure_risk: exposureRisk,
            recommendation: recommendation.join(" "),
          });
        }
      }

      nextPageToken = page.data.nextPageToken;
    } while (nextPageToken);

    return res.json({ projectId, loadBalancers: lbData });
  } catch (error) {
    console.error("Error in load balancer audit:", error);
    return res.status(500).json({
      error: "Failed to fetch load balancer audit",
      details: error.message,
    });
  }
};
