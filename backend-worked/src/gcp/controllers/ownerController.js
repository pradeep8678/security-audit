// ownerController.js
const { google } = require("googleapis");

// IAM RULES
const checkKmsPublicAccess = require("./iam/checkKmsPublicAccess");
const checkKmsRotation = require("./iam/checkKmsRotation");
const checkKmsSeparationOfDuties = require("./iam/checkKmsSeparationOfDuties");
const checkProjectLevelServiceRoles = require("./iam/checkProjectLevelServiceRoles");
const checkSaKeyRotation90Days = require("./iam/checkSaKeyRotation90Days");
const checkUserManagedKeys = require("./iam/checkUserManagedKeys");
const checkOwnerServiceAccounts = require("./iam/checkOwnerServiceAccounts");

exports.checkIAM = async (req, res) => {
  try {
    let keyFile, client, projectId;

    if (req.parsedKey && req.authClient) {
      keyFile = req.parsedKey;
      client = req.authClient;
      projectId = keyFile.project_id;
    } else if (req.file) {
      keyFile = JSON.parse(req.file.buffer.toString("utf8"));
      projectId = keyFile.project_id;
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      client = await auth.getClient();
    } else {
      return res.status(400).json({ error: "Key file is required" });
    }

    console.log(`🚀 Running IAM Audit for project: ${projectId}`);

    // Execute checks
    const ownerSaScan = await checkOwnerServiceAccounts(client, projectId);
    const kmsPublicScan = await checkKmsPublicAccess(client, projectId);
    const kmsRotationScan = await checkKmsRotation(client, projectId);
    const kmsSeparationScan = await checkKmsSeparationOfDuties(client, projectId);
    const projectRolesScan = await checkProjectLevelServiceRoles(client, projectId);
    const saKeyRotationScan = await checkSaKeyRotation90Days(client, projectId);
    const userManagedKeyScan = await checkUserManagedKeys(client, projectId);

    // Final response
    return res.json({
      // message: "IAM audit completed successfully",
      projectId,
      iamScan: {
        ownerServiceAccountScan: ownerSaScan,
        kmsPublicAccessScan: kmsPublicScan,
        kmsRotationScan: kmsRotationScan,
        kmsSeparationOfDutiesScan: kmsSeparationScan,
        projectLevelServiceRolesScan: projectRolesScan,
        saKeyRotation90DaysScan: saKeyRotationScan,
        userManagedKeysScan: userManagedKeyScan,
      },
    });
  } catch (err) {
    console.error("❌ Error in IAM audit:", err);
    return res.status(500).json({ error: "IAM audit failed", details: err.message });
  }
};
