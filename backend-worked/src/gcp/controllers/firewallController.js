const { google } = require("googleapis");

exports.scanFirewallRules = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // Parse uploaded JSON key
    const keyFile = JSON.parse(req.file.buffer.toString());

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const compute = google.compute("v1");
    const projectId = keyFile.project_id;

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
      .filter(rule =>
        rule.sourceRanges?.some(r =>
          r === "0.0.0.0/0" || r === "::/0"
        )
      )
      .map(rule => {
        const openPorts = (rule.allowed || [])
          .flatMap(a =>
            (a.ports || []).map(p => parseInt(p))
          )
          .filter(p => !isNaN(p));

        const isPublic = true;
        const exposureRisk = getExposureRisk(rule, isPublic, openPorts);

        return {
          name: rule.name,
          direction: rule.direction,
          network: rule.network,
          allowed: rule.allowed || [],
          sourceRanges: rule.sourceRanges || [],
          targetTags: rule.targetTags || [],
          disabled: rule.disabled || false,
          openPorts,
          exposureRisk,
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
