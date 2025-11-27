const {
  S3Client,
  ListBucketsCommand,
  GetBucketAclCommand,
  GetPublicAccessBlockCommand
} = require("@aws-sdk/client-s3");

/**
 * 🔍 Pure function — For full audit
 * Accepts: { accessKeyId, secretAccessKey }
 * Returns: detailed list of publicly exposed / risky S3 buckets
 */
async function analyzeS3Buckets(credentials) {
  try {
    const { accessKeyId, secretAccessKey } = credentials;

    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: "Missing AWS credentials" };
    }

    const client = new S3Client({
      region: "us-east-1", // Region doesn't matter for bucket-level APIs
      credentials: { accessKeyId, secretAccessKey }
    });

    // STEP 1 → List all buckets
    const listRes = await client.send(new ListBucketsCommand({}));
    const buckets = listRes.Buckets || [];

    const publicBuckets = [];

    for (const bucket of buckets) {
      const bucketName = bucket.Name;
      let isPublic = false;
      let findings = [];

      /** ------------------------------------------------
       * STEP 2 → Check ACL (legacy permissions)
       * ------------------------------------------------*/
      try {
        const acl = await client.send(
          new GetBucketAclCommand({ Bucket: bucketName })
        );

        const publicACL = (acl.Grants || []).filter((g) => {
          const uri = g.Grantee?.URI || "";
          return uri.includes("AllUsers") || uri.includes("AuthenticatedUsers");
        });

        if (publicACL.length > 0) {
          isPublic = true;
          findings.push("Bucket ACL allows public access (AllUsers/AuthenticatedUsers).");
        }
      } catch (err) {
        findings.push(`Unable to read ACL: ${err.message}`);
      }

      /** ------------------------------------------------
       * STEP 3 → Check Public Access Block Config
       * ------------------------------------------------*/
      try {
        const pab = await client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        const cfg = pab.PublicAccessBlockConfiguration || {};

        if (
          !cfg.BlockPublicAcls ||
          !cfg.BlockPublicPolicy ||
          !cfg.IgnorePublicAcls ||
          !cfg.RestrictPublicBuckets
        ) {
          isPublic = true;
          findings.push("Public Access Block settings are partially or fully disabled.");
        }
      } catch (err) {
        // Bucket missing public-access-block = risky
        isPublic = true;
        findings.push("Bucket has no Public Access Block configuration set.");
      }

      /** ------------------------------------------------
       * Add to result if risky/public
       * ------------------------------------------------*/
      if (isPublic) {
        publicBuckets.push({
          name: bucketName,
          status: "Public / Risky",
          findings,
          recommendation: "Enable S3 Block Public Access and remove any public ACLs or bucket policies."

        });
      }
    }

    if (publicBuckets.length === 0) {
      return {
        success: true,
        message: "✅ No publicly accessible S3 buckets found.",
        buckets: []
      };
    }

    return {
      success: true,
      message: "⚠️ Public or risky S3 buckets detected.",
      buckets: publicBuckets
    };

  } catch (error) {
    console.error("❌ Error analyzing S3 buckets:", error);
    return { success: false, error: "Failed to analyze S3 buckets" };
  }
}


/**
 * 🌐 Express API Route — Wrapper over pure function
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

exports.analyzeS3Buckets = analyzeS3Buckets;
