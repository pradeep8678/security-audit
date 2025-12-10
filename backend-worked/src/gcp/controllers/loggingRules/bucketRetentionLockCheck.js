// loggingRules/bucketRetentionLockCheck.js
const { google } = require("googleapis");

async function checkBucketRetentionLock(keyFile) {
  const findings = [];
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const storage = google.storage("v1");

    const projectId = keyFile.project_id;

    const res = await storage.buckets.list({
      project: projectId,
    });

    const buckets = res.data.items || [];

    buckets.forEach((b) => {
      if (!b.retentionPolicy?.isLocked) {
        findings.push({
          bucket: b.name,
          issue: "Retention Lock missing",
          exposureRisk: "High",
          recommendation:
            "Enable 'Bucket Lock' (retentionPolicy.isLocked) for log buckets.",
        });
      }
    });
  } catch (err) {
    console.error("Bucket Retention Lock Error:", err.message);
    throw new Error("Failed to check bucket lock");
  }
  return findings;
};

module.exports = checkBucketRetentionLock;
