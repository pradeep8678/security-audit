const { google } = require("googleapis");

exports.scanFirewallRules = async (req, res) => {
  try {
    let keyFile, authClient, projectId;

    if (req.parsedKey && req.authClient) {
      keyFile = req.parsedKey;
      authClient = req.authClient;
      projectId = keyFile.project_id;
    } else if (req.file) {
      keyFile = JSON.parse(req.file.buffer.toString());
      projectId = keyFile.project_id;
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      authClient = await auth.getClient();
    } else {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    google.options({ auth: authClient });

    const compute = google.compute("v1");

    // Fetch all firewall rules
    const response = await compute.firewalls.list({
      project: projectId,
      auth: authClient,
    });

    const rules = response.data.items || [];

    // Risk scoring logic
    const riskyPorts = [22, 3389, 80, 443, 3306, 5432];

    function getExposureRisk(rule, isPublic, openPorts) {
      if (!isPublic) return "Low";

      // High risk: SSH, RDP, DB ports open to public
      if (openPorts.some(p => [22, 3389, 3306, 5432].includes(p))) {
        return "High";
      }

      // Medium: Public Internet allowed but only HTTP/HTTPS
      if (openPorts.some(p => [80, 443].includes(p))) {
        return "Medium";
      }

      return "High";
    }

    // Check rules open to public Internet
    const publicRules = rules
      .filter(rule => {
        // EXCLUDE default rules (name starts with "default-")
        if (rule.name.startsWith("default-")) return false;
        // Also filter by sourceRanges as before
        return rule.sourceRanges?.some(r =>
          r === "0.0.0.0/0" || r === "::/0"
        );
      })
      .map(rule => {
        const openPorts = (rule.allowed || [])
          .flatMap(a =>
            (a.ports || []).map(p => parseInt(p))
          )
          .filter(p => !isNaN(p));

        const isPublic = true;
        const exposureRisk = getExposureRisk(rule, isPublic, openPorts);

        // Add icons to risk
        let riskWithIcon = exposureRisk;
        if (exposureRisk === "High") riskWithIcon = "🔴 High";
        if (exposureRisk === "Medium") riskWithIcon = "🟠 Medium";
        if (exposureRisk === "Low") riskWithIcon = "🟡 Low";

        return {
          name: rule.name,
          direction: rule.direction,
          network: rule.network,
          allowed: rule.allowed || [],
          sourceRanges: rule.sourceRanges || [],
          targetTags: rule.targetTags || [],
          disabled: rule.disabled || false,
          openPorts,
          exposureRisk: riskWithIcon,
          recommendation:
            exposureRisk === "High"
              ? `Rule "${rule.name}" is HIGH-RISK — restrict or remove public access to SSH/RDP/DB ports.`
              : `Rule "${rule.name}" allows public access — restrict to internal CIDRs or use IAM-based access.`,
        };
      });

    // Response when no risky rules found
    if (publicRules.length === 0) {
      return res.json({
        projectId,
        // message: "✅ No public firewall rules found. All rules are restricted.",
        publicRules: [],
      });
    }

    // Final API response
    res.json({
      projectId,
      totalRules: rules.length,
      publicRulesCount: publicRules.length,
      publicRules,
    });
  } catch (error) {
    console.error("❌ Error scanning firewall rules:", error);
    res.status(500).json({ error: "Failed to scan firewall rules" });
  }
};
