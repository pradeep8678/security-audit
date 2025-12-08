const { google } = require("googleapis");

/**
 * 🔐 Ensure That DNSSEC Is Enabled for Cloud DNS
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - DNS zones where DNSSEC is NOT enabled
 */
async function checkDnssecEnabled(keyFile) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const dns = google.dns("v1");
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;

    // Fetch all DNS managed zones
    const zonesRes = await dns.managedZones.list({ project: projectId });
    const zones = zonesRes.data.managedZones || [];

    const results = [];

    for (const zone of zones) {
      const dnssecConfig = zone.dnssecConfig;
      const isEnabled =
        dnssecConfig &&
        dnssecConfig.state &&
        dnssecConfig.state.toUpperCase() === "ON";

      if (!isEnabled) {
        results.push({
          name: zone.name,
          dnsName: zone.dnsName,
          type: "Cloud DNS",
          access: "dnssec-disabled",
          exposureRisk: "High",
          recommendation: `DNSSEC is NOT enabled for DNS zone "${zone.name}". ` +
            `Enable DNSSEC to protect domain integrity and prevent DNS spoofing attacks.`,
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Error checking DNSSEC configuration:", err.message);
    throw new Error("Failed to check DNSSEC status");
  }
}

// ✅ Export function directly
module.exports = checkDnssecEnabled;
