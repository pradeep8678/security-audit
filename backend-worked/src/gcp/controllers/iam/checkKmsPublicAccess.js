const { google } = require("googleapis");

module.exports = async function checkKmsPublicAccess(client, projectId) {
  const kms = google.cloudkms({ version: "v1", auth: client });
  const results = [];

  try {
    // 1️⃣ List all available locations for the project
    const locationsResp = await kms.projects.locations.list({
      name: `projects/${projectId}`,
    });

    const locations = locationsResp.data.locations || [];

    for (const loc of locations) {
      const locationId = loc.locationId;

      // 2️⃣ List key rings for this location
      const keyRingsResp = await kms.projects.locations.keyRings.list({
        parent: `projects/${projectId}/locations/${locationId}`,
      });

      const keyRings = keyRingsResp.data.keyRings || [];

      // 3️⃣ List keys in each key ring and check public access
      for (const keyRing of keyRings) {
        const cryptoKeysResp = await kms.projects.locations.keyRings.cryptoKeys.list({
          parent: keyRing.name,
        });

        const cryptoKeys = cryptoKeysResp.data.cryptoKeys || [];

        for (const key of cryptoKeys) {
          const policyResp = await kms.projects.locations.keyRings.cryptoKeys.getIamPolicy({
            resource: key.name,
          });

          const bindings = policyResp.data.bindings || [];
          const isPublic = bindings.some(b =>
            (b.members || []).some(m => m === "allUsers" || m === "allAuthenticatedUsers")
          );

          results.push({
            keyName: key.name,
            location: locationId,
            status: isPublic ? "FAIL" : "PASS",
            message: isPublic
              ? `Key ${key.name} may be publicly accessible.`
              : `Key ${key.name} is not exposed to public.`,
          });
        }
      }
    }
  } catch (error) {
    console.error("KMS Public Access Check Error:", error);
    results.push({
      error: "Failed to check public KMS access",
      details: error.message,
    });
  }

  return results;
};
