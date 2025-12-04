const { google } = require("googleapis");

module.exports = async function checkKmsPublicAccess(client, projectId) {
  const kms = google.cloudkms({ version: "v1", auth: client });
  const results = [];

  try {
    // List all locations
    const locationsResp = await kms.projects.locations.list({
      name: `projects/${projectId}`,
    });

    const locations = locationsResp.data.locations || [];

    for (const loc of locations) {
      const locationId = loc.locationId;

      // List key rings
      const keyRingsResp = await kms.projects.locations.keyRings.list({
        parent: `projects/${projectId}/locations/${locationId}`,
      });

      const keyRings = keyRingsResp.data.keyRings || [];

      // List crypto keys inside each key ring
      for (const keyRing of keyRings) {
        const cryptoKeysResp = await kms.projects.locations.keyRings.cryptoKeys.list({
          parent: keyRing.name,
        });

        const cryptoKeys = cryptoKeysResp.data.cryptoKeys || [];

        for (const key of cryptoKeys) {
          const policyResp =
            await kms.projects.locations.keyRings.cryptoKeys.getIamPolicy({
              resource: key.name,
            });

          const bindings = policyResp.data.bindings || [];

          const isPublic = bindings.some(b =>
            (b.members || []).some(
              m => m === "allUsers" || m === "allAuthenticatedUsers"
            )
          );

          // ❗ Only store FAIL items
          if (isPublic) {
            results.push({
              projectId,
              keyName: key.name,
              location: locationId,
              // status: "FAIL",
              exposureRisk: "High",
              recommendation:
                "Remove public access (allUsers/allAuthenticatedUsers) from this KMS key immediately.",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("KMS Public Access Check Error:", error);
    results.push({
      error: "Failed to check public KMS key access",
      details: error.message,
    });
  }

  return results;
};
