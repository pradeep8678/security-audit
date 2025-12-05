const { google } = require("googleapis");

/**
 * 🔧 Check if Uniform Bucket-Level Access (UBLA) is disabled
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - Buckets without UBLA enabled + exposure + risk
 */
async function checkUniformBucketLevelAccess(keyFile) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const storage = google.storage("v1");
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;
    const bucketsRes = await storage.buckets.list({ project: projectId });
    const buckets = bucketsRes.data.items || [];

    const nonUniformBuckets = [];

    for (const bucket of buckets) {
      try {
        const bucketRes = await storage.buckets.get({ bucket: bucket.name });
        const uniformAccess =
          bucketRes.data.iamConfiguration?.uniformBucketLevelAccess?.enabled;

        if (!uniformAccess) {
          // Fetch IAM Policy (to detect exposure like public, custom user access)
          let bindings = [];
          try {
            const iamRes = await storage.buckets.getIamPolicy({
              bucket: bucket.name,
            });
            bindings = iamRes.data.bindings || [];
          } catch (err) {
            if (!err.message.includes("Permission")) {
              console.error(`IAM Policy error for ${bucket.name}:`, err.message);
            }
          }

          let exposure = "None";
          let riskLevel = "Low";

          const isAllUsers = bindings.some((b) =>
            (b.members || []).includes("allUsers")
          );
          const isAllAuthenticated = bindings.some((b) =>
            (b.members || []).includes("allAuthenticatedUsers")
          );

          const hasCustomUsers = bindings.some((b) =>
            (b.members || []).some(
              (m) => m.startsWith("user:") || m.startsWith("group:")
            )
          );

          if (isAllUsers) {
            exposure = "allUsers";
            riskLevel = "High";
          } else if (isAllAuthenticated) {
            exposure = "allAuthenticatedUsers";
            riskLevel = "Medium";
          } else if (hasCustomUsers) {
            exposure = "customUserBindings";
            riskLevel = "Medium";
          }

          nonUniformBuckets.push({
            name: bucket.name,
            location: bucket.location,
            storageClass: bucket.storageClass,
            access: exposure,
            riskLevel,
            recommendation: `Enable Uniform Bucket-Level Access (UBLA) on "${bucket.name}" to enforce object-level permissions at the bucket level and reduce access risks.`,
          });
        }
      } catch (err) {
        if (!err.message.includes("Permission")) {
          console.error(`Error checking UBLA for ${bucket.name}:`, err.message);
        }
      }
    }

    return nonUniformBuckets;
  } catch (err) {
    console.error("Error checking UBLA:", err);
    throw new Error("Failed to check Uniform Bucket-Level Access for buckets");
  }
}

module.exports = { checkUniformBucketLevelAccess };
