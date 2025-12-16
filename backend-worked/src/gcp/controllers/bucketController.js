// controllers/bucketAuditController.js
const { checkPublicAccess } = require("./storage/checkPublicAccess");
const { checkUniformBucketLevelAccess } = require("./storage/checkUniformBucketLevelAccess");

/**
 * 🌐 Main controller to audit buckets
 */
exports.auditBuckets = async (req, res) => {
  try {
    let keyFile, authClient;

    if (req.parsedKey && req.authClient) {
      // Optimized path: use pre-parsed key and pre-auth client
      keyFile = req.parsedKey;
      authClient = req.authClient;
    } else if (req.file) {
      // Standalone path: parse and auth here
      keyFile = JSON.parse(req.file.buffer.toString());
      // Auth will be handled inside helpers if no authClient passed, 
      // OR we can unify it here. But for now helpers expect keyFile + optional authClient.
    } else {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // Run both checks in parallel
    // Pass authClient to helpers to reuse connection
    const [publicAccessFindings, uniformAccessFindings] = await Promise.all([
      checkPublicAccess(keyFile, authClient),
      checkUniformBucketLevelAccess(keyFile, authClient),
    ]);

    // Return combined audit report
    res.json({
      projectId: keyFile.project_id,
      publicAccessFindings,
      uniformAccessFindings,
      // message: "Bucket audit completed successfully",
    });
  } catch (err) {
    console.error("Error in auditBuckets controller:", err);
    res.status(500).json({ error: "Failed to perform bucket audit" });
  }
};
