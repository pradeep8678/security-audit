const {
  S3Client,
  ListBucketsCommand,
  GetBucketAclCommand,
  GetPublicAccessBlockCommand
} = require("@aws-sdk/client-s3");

/**
 * 🔍 Pure function — For full audit (no req/res)
 * Accepts: { accessKeyId, secretAccessKey }
 * Returns: list of publicly exposed S3 buckets
 */
async function analyzeS3Buckets(credentials) {
  try {
    const { accessKeyId, secretAccessKey } = credentials;

    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: "Missing AWS credentials" };
    }

    const client = new S3Client({
      region: "us-east-1", // region doesn't matter for listing buckets
      credentials: { accessKeyId, secretAccessKey }
    });

    // STEP 1: List all buckets
    const listRes = await client.send(new ListBucketsCommand({}));
    const buckets = listRes.Buckets || [];

    let publicBuckets = [];

    for (const bucket of buckets) {
      const bucketName = bucket.Name;

      let isPublic = false;

      // STEP 2: Check ACL
      try {
        const acl = await client.send(
          new GetBucketAclCommand({ Bucket: bucketName })
        );

        const grants = acl.Grants || [];

        const publicGrants = grants.filter((g) => {
          const uri = g.Grantee?.URI || "";
          return uri.includes("AllUsers") || uri.includes("AuthenticatedUsers");
        });

        if (publicGrants.length > 0) {
          isPublic = true;
        }
      } catch (err) {
        console.warn(`⚠️ Cannot read ACL for bucket ${bucketName}: ${err.message}`);
      }

      // STEP 3: Check Public Access Block
      try {
        const pab = await client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        const cfg = pab.PublicAccessBlockConfiguration;

        if (
          !cfg.BlockPublicAcls ||
          !cfg.BlockPublicPolicy ||
          !cfg.IgnorePublicAcls ||
          !cfg.RestrictPublicBuckets
        ) {
          // If any protection is disabled → risky
          isPublic = true;
        }
      } catch (err) {
        // Some buckets don't have PublicAccessBlock
        isPublic = true;
      }

      // Add only public/risky buckets
      if (isPublic) {
        publicBuckets.push({
          name: bucketName,
          access: "Public",
          recommendation: `⚠️ Bucket "${bucketName}" is publicly accessible. Enable Block Public Access or restrict ACL/IAM.`,
        });
      }
    }

    if (publicBuckets.length === 0) {
      return {
        success: true,
        message: "✅ No public S3 buckets found.",
        buckets: []
      };
    }

    return {
      success: true,
      buckets: publicBuckets
    };

  } catch (error) {
    console.error("❌ Error analyzing S3 buckets:", error);
    return { success: false, error: "Failed to analyze S3 buckets" };
  }
}


/**
 * 🌐 Express Route Version
 * Expects: { accessKeyId, secretAccessKey } in req.body
 */
exports.listS3Buckets = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "Missing AWS credentials (accessKeyId, secretAccessKey)"
      });
    }

    const result = await analyzeS3Buckets({ accessKeyId, secretAccessKey });
    res.status(result.success ? 200 : 500).json(result);

  } catch (err) {
    console.error("❌ Error in listS3Buckets route:", err);
    res.status(500).json({ error: "Failed to list S3 buckets" });
  }
};

// Export pure function for full audit
exports.analyzeS3Buckets = analyzeS3Buckets;
