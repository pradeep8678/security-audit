/**
 * Rule: Ensure “Block Project-Wide SSH Keys” Is Enabled for VM Instances
 * ---------------------------------------------------------------------
 * If project metadata contains SSH keys and a VM does not block them,
 * the VM becomes vulnerable to inherited unmanaged SSH access.
 */

module.exports = function checkBlockProjectSSHKeys(instances, projectMetadata) {
  const riskyInstances = [];

  // 🔍 Check if project has any SSH keys defined
  const projectHasSshKeys =
    projectMetadata?.items?.some(
      (item) =>
        (item.key === "ssh-keys" || item.key === "sshKeys") &&
        item.value &&
        item.value.trim() !== ""
    ) || false;

  // 🟢 If no SSH keys are defined at the project level → all VMs are safe
  if (!projectHasSshKeys) {
    return {
      ruleId: "GCP-COMPUTE-005",
      title: "Block Project-Wide SSH Keys",
      description:
        "Checks whether VM instances block project-wide SSH keys that may grant unintended access.",
      totalAffected: 0,
      affectedInstances: [],
      recommendation:
        "No project-level SSH keys were found. All VMs are safe from inherited SSH access.",
      status: "PASS",
      humanReadableStatus:
        "No project-level SSH keys detected. All VMs are secure by default.",
      exposureRisk: "LOW",
    };
  }

  // 🔍 Evaluate each VM
  instances.forEach((vm) => {
    const metadata = vm.metadataItems || [];

    // Check if VM metadata explicitly blocks project-wide SSH keys
    const blockEntry = metadata.find(
      (item) =>
        item.key === "block-project-ssh-keys" &&
        (item.value === "true" || item.value === "TRUE" || item.value === true)
    );

    const isBlocking = !!blockEntry;

    if (!isBlocking) {
      riskyInstances.push({
        name: vm.name,
        zone: vm.zone,
        machineType: vm.machineType,
        status: vm.status,
        blockProjectSshKeys: "Not Enabled",
        exposureRisk: "HIGH", // individual VM risk
        recommendation:
          "Enable 'Block Project-Wide SSH Keys' in VM metadata to prevent unintended SSH access from inherited project keys.",
      });
    }
  });

  return {
    ruleId: "GCP-COMPUTE-005",
    title: "Block Project-Wide SSH Keys",
    description:
      "Ensures VM instances block SSH keys defined at the project level to prevent unintended or unauthorized SSH access.",
    totalAffected: riskyInstances.length,
    affectedInstances: riskyInstances,
    recommendation:
      "Enable 'Block Project-Wide SSH Keys' on all VM instances unless a legitimate inheritance use-case exists.",
    status: riskyInstances.length > 0 ? "FAIL" : "PASS",
    humanReadableStatus:
      riskyInstances.length > 0
        ? "Some VMs allow project-wide SSH keys, which may expose them to unauthorized SSH access."
        : "All VMs correctly block project-wide SSH keys.",
    exposureRisk: riskyInstances.length > 0 ? "HIGH" : "LOW", // overall risk
  };
};
