const { google } = require('googleapis');

exports.listBuckets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No key file uploaded' });
    }

    // Parse the uploaded JSON key file (from memory)
    const keyFile = JSON.parse(req.file.buffer.toString());

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const storage = google.storage('v1');
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const projectId = keyFile.project_id;
    const bucketsRes = await storage.buckets.list({ project: projectId });

    const buckets = (bucketsRes.data.items || []).map((b) => ({
      name: b.name,
      location: b.location,
      storageClass: b.storageClass,
      iamConfiguration: b.iamConfiguration || {},
    }));

    // ✅ Check if bucket is public
    const publicBuckets = [];

    for (const bucket of buckets) {
      try {
        const policyRes = await storage.buckets.getIamPolicy({
          bucket: bucket.name,
        });

        const bindings = policyRes.data.bindings || [];
        const isPublic = bindings.some(
          (b) =>
            (b.members || []).includes('allUsers') ||
            (b.members || []).includes('allAuthenticatedUsers')
        );

        if (isPublic) {
          publicBuckets.push({
            name: bucket.name,
            location: bucket.location,
            storageClass: bucket.storageClass,
            access: 'Public',
            recommendation: `⚠️ Bucket "${bucket.name}" is publicly accessible. Restrict access via IAM or make it private.`,
          });
        } else {
          publicBuckets.push({
            name: bucket.name,
            location: bucket.location,
            storageClass: bucket.storageClass,
            access: 'Private',
            recommendation: `✅ Bucket "${bucket.name}" is private.`,
          });
        }
      } catch (err) {
        console.error(`Error checking bucket ${bucket.name}:`, err.message);
      }
    }

    res.json({
      projectId,
      buckets: publicBuckets,
    });
  } catch (error) {
    console.error('Error listing buckets:', error);
    res.status(500).json({ error: 'Failed to list buckets' });
  }
};
