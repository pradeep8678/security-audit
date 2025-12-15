// networkController.js
// =========================
//   NETWORK RULE IMPORTS
// =========================
const checkDefaultNetwork = require("./network/checkDefaultNetwork");
const checkLegacyNetworks = require("./network/checkLegacyNetworks");
const checkVpcFlowLogs = require("./network/vpcFlowLogsCheck");
const checkSshOpenToInternet = require("./network/checkSshOpenToInternet");
const checkRdpAccess = require("./network/rdpAccessCheck");

const checkDnssecEnabled = require("./network/checkDnssecEnabled");
const checkDnsRsaSha1 = require("./network/checkDnsRsaSha1");
const checkDnsZoneRsaSha1 = require("./network/checkDnsZoneRsaSha1");

exports.checkNETWORK = async (req, res) => {
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

    console.log(`🌐 Running NETWORK Audit for project: ${projectId}`);

    // Run all scans in parallel, passing keyFile AND client
    const [
      defaultNetworkScan,
      legacyNetworkScan,
      vpcFlowLogsScan,
      sshOpenScan,
      rdpOpenScan,
      dnsSecScan,
      rsaSha1KeyScan,
      rsaSha1ZoneScan
    ] = await Promise.all([
      checkDefaultNetwork(keyFile, client),
      checkLegacyNetworks(keyFile, client),
      checkVpcFlowLogs(keyFile, client),
      checkSshOpenToInternet(keyFile, client),
      checkRdpAccess(keyFile, client),
      checkDnssecEnabled(keyFile, client),
      checkDnsRsaSha1(keyFile, client),
      checkDnsZoneRsaSha1(keyFile, client)
    ]);

    // Return consolidated results
    return res.json({
      projectId,
      networkScan: {
        defaultNetworkScan,
        legacyNetworkScan,
        vpcFlowLogsScan,
        sshOpenScan,
        rdpOpenScan,
        dnsSecScan,
        rsaSha1KeyScan,
        rsaSha1ZoneScan
      },
    });

  } catch (err) {
    console.error("❌ Error in NETWORK audit:", err);
    return res.status(500).json({
      error: "NETWORK audit failed",
      details: err.message,
    });
  }
};
