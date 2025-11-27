const { google } = require("googleapis");

/**
 * 🔍 Pure function for use in full audit
 * Takes GCP credentials object (parsed JSON)
 * Returns bucket audit data (no res.json here)
 */
async function analyzeBuckets(keyFile) {
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

    const buckets = (bucketsRes.data.items || []).map((b) => ({
      name: b.name,
      location: b.location,
      storageClass: b.storageClass,
    }));

    const publicBuckets = [];

    for (const bucket of buckets) {
      try {
        const policyRes = await storage.buckets.getIamPolicy({
          bucket: bucket.name,
        });

        const bindings = policyRes.data.bindings || [];

        const isPublic = bindings.some(
          (b) =>
            (b.members || []).includes("allUsers") ||
            (b.members || []).includes("allAuthenticatedUsers")
        );

        if (isPublic) {
          publicBuckets.push({
            name: bucket.name,
            location: bucket.location,
            storageClass: bucket.storageClass,
            access: "Public",
            recommendation: `⚠️ Bucket "${bucket.name}" is publicly accessible. Restrict access via IAM or make it private.`,
          });
        }
      } catch (err) {
        if (!err.message.includes("Permission")) {
          console.error(`Error checking bucket ${bucket.name}:`, err.message);
        }
      }
    }

    if (publicBuckets.length === 0) {
      return {
        success: true,
        projectId,
        message: "✅ No public buckets found. All buckets are private or restricted.",
        buckets: [],
      };
    }

    return {
      success: true,
      projectId,
      buckets: publicBuckets,
    };
  } catch (error) {
    console.error("Error listing buckets:", error);
    return { success: false, error: "Failed to list buckets" };
  }
}

/**
 * 🌐 Express route version — keeps your existing API working
 */
exports.listBuckets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    const keyFile = JSON.parse(req.file.buffer.toString());
    const result = await analyzeBuckets(keyFile);
    res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    console.error("Error in listBuckets route:", err);
    res.status(500).json({ error: "Failed to list buckets" });
  }
};

// ✅ Export both functions
exports.analyzeBuckets = analyzeBuckets;
