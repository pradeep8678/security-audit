const { google } = require("googleapis");

exports.listBuckets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // Parse uploaded key
    const keyFile = JSON.parse(req.file.buffer.toString());

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

        // ✅ Only push PUBLIC buckets
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
        // Skip permission errors silently
        if (!err.message.includes("Permission")) {
          console.error(`Error checking bucket ${bucket.name}:`, err.message);
        }
      }
    }

    // ✅ Response handling
    if (publicBuckets.length === 0) {
      return res.json({
        projectId,
        message: "✅ No public buckets found. All buckets are private or restricted.",
        buckets: [],
      });
    }

    return res.json({
      projectId,
      buckets: publicBuckets,
    });
  } catch (error) {
    console.error("Error listing buckets:", error);
    res.status(500).json({ error: "Failed to list buckets" });
  }
};
