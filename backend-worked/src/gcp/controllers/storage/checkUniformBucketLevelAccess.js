const { google } = require("googleapis");

/**
 * 🔧 Check if Uniform Bucket-Level Access (UBLA) is enabled
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - List of buckets without UBLA enabled
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
        const uniformAccess = bucketRes.data.iamConfiguration?.uniformBucketLevelAccess?.enabled;

        if (!uniformAccess) {
          nonUniformBuckets.push({
            name: bucket.name,
            location: bucket.location,
            storageClass: bucket.storageClass,
            recommendation: `Enable Uniform Bucket-Level Access for bucket "${bucket.name}" to simplify IAM and improve security.`,
          });
        }
      } catch (err) {
        console.error(`Error checking UBLA for bucket ${bucket.name}:`, err.message);
      }
    }

    return nonUniformBuckets;
  } catch (err) {
    console.error("Error checking UBLA:", err);
    throw new Error("Failed to check Uniform Bucket-Level Access for buckets");
  }
}

// Export the function
module.exports = { checkUniformBucketLevelAccess };
