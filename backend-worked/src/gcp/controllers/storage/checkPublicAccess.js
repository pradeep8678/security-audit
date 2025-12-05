const { google } = require("googleapis");

/**
 * 🔒 Check if buckets are publicly accessible
 * @param {Object} keyFile - Parsed GCP service account JSON
 * @returns {Array} - List of buckets that are publicly accessible
 */
async function checkPublicAccess(keyFile) {
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

    const publicBuckets = [];

    for (const bucket of buckets) {
      try {
        const policyRes = await storage.buckets.getIamPolicy({ bucket: bucket.name });
        const bindings = policyRes.data.bindings || [];

        let exposure = null;
        let risk = "Low";

        const isAllUsers = bindings.some((b) => (b.members || []).includes("allUsers"));
        const isAllAuthenticated = bindings.some((b) => (b.members || []).includes("allAuthenticatedUsers"));

        if (isAllUsers) {
          exposure = "allUsers";
          risk = "High";
        } else if (isAllAuthenticated) {
          exposure = "allAuthenticatedUsers";
          risk = "Medium";
        }

        if (exposure) {
          publicBuckets.push({
            name: bucket.name,
            location: bucket.location,
            storageClass: bucket.storageClass,
            access: exposure,
            riskLevel: risk,
            recommendation: `Bucket "${bucket.name}" is publicly accessible (${exposure}). Restrict access via IAM or make it private immediately.`,
          });
        }
      } catch (err) {
        if (!err.message.includes("Permission")) {
          console.error(`Error checking bucket ${bucket.name}:`, err.message);
        }
      }
    }

    return publicBuckets;
  } catch (err) {
    console.error("Error checking public access:", err);
    throw new Error("Failed to check public access for buckets");
  }
}

// Export the function
module.exports = { checkPublicAccess };
