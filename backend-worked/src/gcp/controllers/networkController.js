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
    if (!req.file) {
      return res.status(400).json({ error: "Key file is required" });
    }

    // Parse uploaded service account JSON
    const keyFile = JSON.parse(req.file.buffer.toString("utf8"));
    const projectId = keyFile.project_id;

    console.log(`🌐 Running NETWORK Audit for project: ${projectId}`);

    // Run all scans in parallel, passing keyFile directly
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
      checkDefaultNetwork(keyFile),
      checkLegacyNetworks(keyFile),
      checkVpcFlowLogs(keyFile),
      checkSshOpenToInternet(keyFile),
      checkRdpAccess(keyFile),
      checkDnssecEnabled(keyFile),
      checkDnsRsaSha1(keyFile),
      checkDnsZoneRsaSha1(keyFile)
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
