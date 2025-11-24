const { google } = require("googleapis");

exports.checkLoadBalancersAudit = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Key file is required" });
    }

    // Parse uploaded service account JSON
    const keyFileBuffer = req.file.buffer.toString("utf8");
    const keyFile = JSON.parse(keyFileBuffer);

    // Authenticate
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const compute = google.compute({
      version: "v1",
      auth,
    });

    const projectId = keyFile.project_id;
    const lbData = [];

    // Fetch forwarding rules across all regions
    let reqPage = await compute.forwardingRules.aggregatedList({ project: projectId });
    while (reqPage.data) {
      const items = reqPage.data.items || {};
      for (const [region, scopedList] of Object.entries(items)) {
        const rules = scopedList.forwardingRules || [];
        for (const rule of rules) {
          const lbName = rule.name || "";
          const target =
            rule.target || rule.backendService || rule.targetPool || "";
          const scheme = rule.loadBalancingScheme || "";
          const ip = rule.IPAddress || "";

          // Default values
          let sslPolicy = "N/A";
          let cloudArmorPolicy = "N/A";
          let sslCertStatus = "N/A";
          let httpsRedirect = "N/A";
          let armorRuleStrength = "N/A";
          let internalExposure = "N/A";

          try {
            // ---- HTTPS Proxy ----
            if (target.includes("targetHttpsProxies")) {
              const targetName = target.split("/").pop();
              const proxy = await compute.targetHttpsProxies.get({
                project: projectId,
                targetHttpsProxy: targetName,
              });

              sslPolicy = proxy.data.sslPolicy || "None";
              cloudArmorPolicy = proxy.data.securityPolicy || "None";

              // SSL Certificates
              const certUrls = proxy.data.sslCertificates || [];
              if (certUrls.length > 0) {
                const certStatus = [];
                for (const certUrl of certUrls) {
                  const certName = certUrl.split("/").pop();
                  const cert = await compute.sslCertificates.get({
                    project: projectId,
                    sslCertificate: certName,
                  });
                  certStatus.push(
                    `Valid till: ${cert.data.expireTime || "Unknown"}`
                  );
                }
                sslCertStatus = certStatus.join(", ");
              } else {
                sslCertStatus = "No SSL Certificates attached";
              }

              // Cloud Armor Rule Strength
              if (cloudArmorPolicy && cloudArmorPolicy !== "None") {
                const armorName = cloudArmorPolicy.split("/").pop();
                const policy = await compute.securityPolicies.get({
                  project: projectId,
                  securityPolicy: armorName,
                });
                const rules = policy.data.rules || [];
                armorRuleStrength = rules.length
                  ? `Strong - ${rules.length} rules`
                  : "Weak - No rules found";
              } else {
                armorRuleStrength = "No Cloud Armor policy";
              }
            }

            // ---- HTTP Proxy ----
            else if (target.includes("targetHttpProxies")) {
              const targetName = target.split("/").pop();
              const proxy = await compute.targetHttpProxies.get({
                project: projectId,
                targetHttpProxy: targetName,
              });

              cloudArmorPolicy = proxy.data.securityPolicy || "None";

              // URL Map check for HTTPS redirect
              const urlMapUrl = proxy.data.urlMap;
              if (urlMapUrl) {
                const urlMapName = urlMapUrl.split("/").pop();
                const urlMap = await compute.urlMaps.get({
                  project: projectId,
                  urlMap: urlMapName,
                });
                const matchers = urlMap.data.pathMatchers || [];
                const hasRedirect = matchers.some(
                  (pm) => pm.defaultRouteAction?.redirectAction
                );
                httpsRedirect = hasRedirect ? "Yes" : "No";
              } else {
                httpsRedirect = "No URL map found";
              }

              // Cloud Armor policy rules
              if (cloudArmorPolicy && cloudArmorPolicy !== "None") {
                const armorName = cloudArmorPolicy.split("/").pop();
                const policy = await compute.securityPolicies.get({
                  project: projectId,
                  securityPolicy: armorName,
                });
                const rules = policy.data.rules || [];
                armorRuleStrength = rules.length
                  ? `Strong - ${rules.length} rules`
                  : "Weak - No rules found";
              } else {
                armorRuleStrength = "No Cloud Armor policy";
              }
            }

            // ---- External Exposure ----
            if (scheme === "EXTERNAL") {
              internalExposure = target.includes("backendServices") ||
                target.includes("instanceGroups")
                ? "Potential Risk"
                : "OK";
            }
          } catch (innerErr) {
            console.error("Error fetching details for LB:", innerErr.message);
          }

          lbData.push({
            name: lbName,
            scheme,
            ip,
            ssl_policy: sslPolicy,
            ssl_cert_status: sslCertStatus,
            https_redirect: httpsRedirect,
            cloud_armor_policy: cloudArmorPolicy,
            armor_rule_strength: armorRuleStrength,
            internal_exposure: internalExposure,
          });
        }
      }

      // Pagination
      if (reqPage.data.nextPageToken) {
        reqPage = await compute.forwardingRules.aggregatedList({
          project: projectId,
          pageToken: reqPage.data.nextPageToken,
        });
      } else break;
    }

    res.json({ projectId, loadBalancers: lbData });
  } catch (error) {
    console.error("Error in load balancer audit:", error);
    res.status(500).json({
      error: "Failed to fetch load balancer audit",
      details: error.message,
    });
  }
};
