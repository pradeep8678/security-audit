const { google } = require("googleapis");

/**
 * 🚫 Ensure That RSASHA1 Is Not Used for DNSSEC Keys
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - DNS zones using RSASHA1 (vulnerable)
 */
async function checkDnsRsaSha1(keyFile) {
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
      const config = zone.dnssecConfig;

      // Skip zones with no DNSSEC configuration
      if (!config || !config.defaultKeySpecs) continue;

      const keySpecs = config.defaultKeySpecs;

      // Check if any key uses RSASHA1
      const usesRsaSha1 = keySpecs.some(
        (ks) => ks.algorithm && ks.algorithm.toUpperCase() === "RSASHA1"
      );

      if (usesRsaSha1) {
        results.push({
          name: zone.name,
          dnsName: zone.dnsName,
          type: "Cloud DNS",
          access: "rsa-sha1-used",
          exposureRisk: "High",
          recommendation: `DNS zone "${zone.name}" is using RSASHA1 for DNSSEC keys. ` +
            `RSASHA1 is deprecated and vulnerable. Rotate DNSSEC keys using a stronger algorithm such as RSASHA256 or ECDSAP256SHA256.`,
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Error checking DNSSEC key algorithms:", err.message);
    throw new Error("Failed to check RSASHA1 key usage");
  }
}

// ✅ Export function directly for simpler import
module.exports = checkDnsRsaSha1;
