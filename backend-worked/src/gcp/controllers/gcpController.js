const { google } = require("googleapis");
const checkDefaultServiceAccount = require("./vmRules/defaultServiceAccount"); 
const checkShieldedVM = require("./vmRules/shieldedVmCheck");
const checkOsLogin = require("./vmRules/osLoginCheck");
const checkBlockProjectSSHKeys = require("./vmRules/blockProjectSshKeysCheck");
const checkIpForwarding = require("./vmRules/ipForwardingCheck");

exports.listVMs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    const keyFile = JSON.parse(req.file.buffer.toString("utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const compute = google.compute({
      version: "v1",
      auth: await auth.getClient(),
    });

    const projectId = keyFile.project_id;
    console.log(`🚀 Scanning Compute Engine instances for project: ${projectId}`);

    const projectInfo = await compute.projects.get({ project: projectId });
    const projectMetadata = projectInfo.data.commonInstanceMetadata || {};

    let request = compute.instances.aggregatedList({ project: projectId });

    const allVMs = [];
    const publicVMs = [];

    while (request) {
      const response = await request;
      const items = response.data.items || {};

      for (const [zone, scopedList] of Object.entries(items)) {
        const instances = scopedList.instances || [];

        instances.forEach((instance) => {
          const vmData = {
            name: instance.name,
            zone,
            machineType: instance.machineType?.split("/").pop(),
            status: instance.status,
            serviceAccounts: instance.serviceAccounts || [],
            networkInterfaces: instance.networkInterfaces || [],
            shieldedVMConfig: instance.shieldedInstanceConfig || {},
            metadataItems: instance.metadata?.items || [],
            canIpForward: instance.canIpForward || false 
          };

          allVMs.push(vmData);

          // Public IP detection + exposure risk
          instance.networkInterfaces?.forEach((nic) => {
            nic.accessConfigs?.forEach((ac) => {
              if (ac.natIP) {
                publicVMs.push({
                  name: instance.name,
                  zone,
                  publicIP: ac.natIP,
                  internalIP: nic.networkIP,
                  machineType: vmData.machineType,
                  status: vmData.status,
                  exposureRisk: "High", // Public IP is always high exposure
                  recommendation:
                    "This VM has a public IP. Restrict public exposure, remove the external IP if not required, and enforce firewall rules.",
                });
              }
            });
          });
        });
      }

      request = response.data.nextPageToken
        ? compute.instances.aggregatedList({
            project: projectId,
            pageToken: response.data.nextPageToken,
          })
        : null;
    }

    console.log(`✔️ Public IP VMs: ${publicVMs.length}`);
    console.log(`✔️ Total VMs scanned: ${allVMs.length}`);

    // RULE EXECUTION
    const defaultSAResults = checkDefaultServiceAccount(allVMs);
    const shieldedVmResults = checkShieldedVM(allVMs);
    const osLoginResults = checkOsLogin(allVMs, projectMetadata);
    const blockProjectSshKeysResults = checkBlockProjectSSHKeys(allVMs, projectMetadata);
    const ipForwardingResults = checkIpForwarding(allVMs);

    // FINAL RESPONSE
    return res.json({
      message: "VM audit completed successfully",
      projectId,
      vmScan: {
        publicIpScan: {
          totalPublicVMs: publicVMs.length,
          instances: publicVMs,
          status: publicVMs.length > 0 ? "FAIL" : "PASS",
        },
        defaultServiceAccountScan: defaultSAResults,
        shieldedVmProtectionScan: shieldedVmResults,
        osLoginEnforcementScan: osLoginResults,
        blockProjectWideSshKeysScan: blockProjectSshKeysResults,
        ipForwardingScan: ipForwardingResults,
      },
    });

  } catch (err) {
    console.error("❌ Error in VM audit:", err);
    return res.status(500).json({ error: err.message });
  }
};
