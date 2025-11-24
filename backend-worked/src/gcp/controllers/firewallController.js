const { google } = require("googleapis");

exports.scanFirewallRules = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // ✅ Parse uploaded JSON key
    const keyFile = JSON.parse(req.file.buffer.toString());

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const compute = google.compute("v1");
    const projectId = keyFile.project_id;

    // ✅ Fetch all firewall rules
    const response = await compute.firewalls.list({
      project: projectId,
      auth: authClient,
    });

    const rules = response.data.items || [];

    // ✅ Filter only rules open to public
    const publicRules = rules
      .filter(rule => rule.sourceRanges?.includes("0.0.0.0/0"))
      .map(rule => ({
        name: rule.name,
        direction: rule.direction,
        network: rule.network,
        allowed: rule.allowed,
        sourceRanges: rule.sourceRanges,
        targetTags: rule.targetTags || [],
        disabled: rule.disabled || false,
        recommendation: `⚠️ Rule "${rule.name}" allows traffic from 0.0.0.0/0. Consider restricting this.`,
      }));

    // ✅ Response
    if (publicRules.length === 0) {
      return res.json({
        projectId,
        message: "✅ No public firewall rules found. All rules are restricted.",
        publicRules: [],
      });
    }

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
