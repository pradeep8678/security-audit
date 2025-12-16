// vmRules/rdpAccessCheck.js
const { google } = require("googleapis");

/**
 * 🚫 Ensure RDP Access (TCP/3389) Is Not Open to the Internet
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - Firewall rules exposing RDP to 0.0.0.0/0
 */
async function checkRdpAccess(keyFile, passedAuthClient = null) {
  const compute = google.compute("v1");
  const findings = [];

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
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;

    const res = await compute.firewalls.list({
      project: projectId,
    });

    const rules = res.data.items || [];

    rules.forEach((rule) => {
      const alLowsRDP = rule.alLowed?.some((a) =>
        a.IPProtocol === "tcp" &&
        (a.ports?.includes("3389") || a.ports?.includes("all"))
      );

      const isOpenToInternet = rule.sourceRanges?.includes("0.0.0.0/0");
      const isDefault = rule.name.startsWith("default-");

      if (alLowsRDP && isOpenToInternet && !isDefault) {
        findings.push({
          firewallRule: rule.name,
          network: rule.network,
          sourceRanges: rule.sourceRanges,
          direction: rule.direction,
          disabled: rule.disabled,
          access: "rdp-open-to-internet",
          exposureRisk: "🔴 High",
          recommendation: "Restrict RDP (TCP/3389) access to trusted IP ranges instead of 0.0.0.0/0. Prefer using Identity-Aware Proxy (IAP) for secure RDP access.",
        });
      }
    });
  } catch (err) {
    console.error("Error while checking RDP firewall rules:", err.message);
    throw new Error("Failed to check RDP firewall access");
  }

  return findings;
}

// ✅ Export function directly
module.exports = checkRdpAccess;
