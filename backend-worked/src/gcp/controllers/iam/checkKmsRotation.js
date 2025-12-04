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

          results.push({
            keyName: key.name,
            location: locationId,
            rotationPeriod: rotationPeriod || "NONE",
            status: rotationPeriod ? "PASS" : "FAIL",
            message: rotationPeriod ? "Rotation policy enabled." : "Rotation policy NOT enabled.",
            recommendation: rotationPeriod
              ? "Key is compliant."
              : "Enable automatic key rotation (recommended: every 90 days).",
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
