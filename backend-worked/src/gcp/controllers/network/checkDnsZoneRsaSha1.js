const { google } = require("googleapis");

/**
 * 🚫 Ensure That RSASHA1 Is Not Used for the DNS Zone
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - DNS zones where the zone algorithm is RSASHA1
 */
async function checkDnsZoneRsaSha1(keyFile) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const dns = google.dns("v1");
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;

    // Fetch DNS managed zones
    const zonesRes = await dns.managedZones.list({ project: projectId });
    const zones = zonesRes.data.managedZones || [];

    const results = [];

    for (const zone of zones) {
      const config = zone.dnssecConfig;

      // Skip zones with no DNSSEC configuration
      if (!config) continue;

      const algorithm = config.algorithm ? config.algorithm.toUpperCase() : null;

      // Check if the zone uses RSASHA1
      if (algorithm === "RSASHA1") {
        results.push({
          name: zone.name,
          dnsName: zone.dnsName,
          type: "Cloud DNS",
          access: "rsa-sha1-zone",
          exposureRisk: "High",
          recommendation: `DNS zone "${zone.name}" is configured to use RSASHA1 as its DNSSEC ` +
            `signing algorithm. RSASHA1 is deprecated and vulnerable. Update the zone ` +
            `to a stronger algorithm such as RSASHA256 or ECDSAP256SHA256.`,
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Error checking DNS zone algorithms:", err.message);
    throw new Error("Failed to check zone algorithm for RSASHA1");
  }
}

// ✅ Export function directly for simpler import
module.exports = checkDnsZoneRsaSha1;
