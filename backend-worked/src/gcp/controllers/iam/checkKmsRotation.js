// iam/checkKmsRotation.js
const { google } = require("googleapis");

module.exports = async function checkKmsRotation(client, projectId) {
  const kms = google.cloudkms({ version: "v1", auth: client });
  const results = [];

  try {
    const locationsResp = await kms.projects.locations.list({
      name: `projects/${projectId}`,
    });

    for (const loc of locationsResp.data.locations || []) {
      const locationId = loc.locationId;

      const keyRingsResp = await kms.projects.locations.keyRings.list({
        parent: `projects/${projectId}/locations/${locationId}`,
      });

      for (const kr of keyRingsResp.data.keyRings || []) {
        const keysResp = await kms.projects.locations.keyRings.cryptoKeys.list({
          parent: kr.name,
        });

        for (const key of keysResp.data.cryptoKeys || []) {
          const rotationPeriod = key.rotationPeriod || null;

          // If key rotation is enabled, skip (no vulnerability)
          if (rotationPeriod) continue;

          // If FAIL → return vulnerability
          results.push({
            keyName: key.name,
            location: locationId,
            rotationPeriod: "NONE",
            // status: "FAIL",
            exposureRisk: "High",
            recommendation:
              "Enable automatic key rotation (recommended: every 90 days) to reduce exposure risk.",
          });
        }
      }
    }
  } catch (error) {
    console.error("KMS Rotation Check Error:", error);
    results.push({
      error: "Failed to check KMS rotation",
      details: error.message,
    });
  }

  return results;
};
