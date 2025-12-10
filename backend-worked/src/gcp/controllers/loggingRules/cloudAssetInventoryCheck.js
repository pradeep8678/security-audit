// loggingRules/cloudAssetInventoryCheck.js
const { google } = require("googleapis");

async function checkCloudAssetInventory(keyFile) {
  const findings = [];
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const asset = google.cloudasset("v1");
    const projectId = keyFile.project_id;

    try {
      await asset.v1.exportAssets({
        parent: `projects/${projectId}`,
      });
    } catch (err) {
      findings.push({
        issue: "Cloud Asset Inventory seems disabled",
        exposureRisk: "Medium",
        recommendation: "Enable Cloud Asset Inventory API.",
      });
    }
  } catch (err) {
    console.error("Cloud Asset Error:", err.message);
    throw new Error("Failed to check cloud asset inventory");
  }
  return findings;
}

module.exports = checkCloudAssetInventory;
