// controllers/bucketAuditController.js
const { checkPublicAccess } = require("./storage/checkPublicAccess");
const { checkUniformBucketLevelAccess } = require("./storage/checkUniformBucketLevelAccess");

/**
 * 🌐 Main controller to audit buckets
 */
exports.auditBuckets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // Parse uploaded key file
    const keyFile = JSON.parse(req.file.buffer.toString());

    // Run both checks in parallel
    const [publicAccessFindings, uniformAccessFindings] = await Promise.all([
      checkPublicAccess(keyFile),
      checkUniformBucketLevelAccess(keyFile),
    ]);

    // Return combined audit report
    res.json({
      projectId: keyFile.project_id,
      publicAccessFindings,
      uniformAccessFindings,
      // message: "✅ Bucket audit completed successfully",
    });
  } catch (err) {
    console.error("Error in auditBuckets controller:", err);
    res.status(500).json({ error: "Failed to perform bucket audit" });
  }
};
