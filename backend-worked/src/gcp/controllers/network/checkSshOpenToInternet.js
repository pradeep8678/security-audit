const { google } = require("googleapis");

/**
 * 🚫 Ensure That SSH Access (TCP/22) Is Not Open to the Internet
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - Firewall rules exposing SSH to 0.0.0.0/0
 */
async function checkSshOpenToInternet(keyFile, passedAuthClient = null) {
  try {
    let authClient;
    if (passedAuthClient) {
      authClient = passedAuthClient;
    } else {
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      authClient = await auth.getClient();
    }

    const compute = google.compute("v1");
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;

    // Get all firewall rules
    const fwRes = await compute.firewalls.list({ project: projectId });
    const firewalls = fwRes.data.items || [];

    const results = [];

    for (const fw of firewalls) {
      // Skip disabled rules
      if (fw.disabled) continue;

      const allows = fw.allowed || [];

      // Check if SSH (tcp/22) is allowed
      const allowsSSH = allows.some((rule) => {
        const isTCP = rule.IPProtocol === "tcp";
        const has22 =
          rule.ports &&
          rule.ports.some((p) => p === "22" || p === "22-22"); // single port or range
        return isTCP && has22;
      });

      if (!allowsSSH) continue;

      // Check if ANY source range is 0.0.0.0/0
      const isOpenToWorld =
        fw.sourceRanges &&
        fw.sourceRanges.some((r) => r === "0.0.0.0/0");

      // Filter default firewall rules
      const isDefault = fw.name.startsWith("default-");

      if (isOpenToWorld && !isDefault) {
        results.push({
          name: fw.name,
          network: fw.network,
          type: "Firewall Rule",
          access: "ssh-open-to-internet",
          exposureRisk: "🔴 High",
          recommendation: `Firewall rule "${fw.name}" allows SSH (TCP/22) from 0.0.0.0/0. ` +
            `Restrict SSH access to specific IP addresses or use Identity-Aware Proxy (IAP).`,
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Error checking SSH exposure:", err.message);
    throw new Error("Failed to check SSH exposure");
  }
}

// ✅ Export function directly
module.exports = checkSshOpenToInternet;
