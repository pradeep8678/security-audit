/**
 * Rule: OS Login Enforcement Check
 * --------------------------------
 * OS Login replaces SSH keys with IAM-based access control.
 * If OS Login is not enforced, VMs may rely on unmanaged SSH keys,
 * increasing the risk of unauthorized access.
 */

module.exports = function checkOsLogin(instances, projectMetadata) {
  const riskyInstances = [];

  // 🔍 Determine project-level OS Login status
  const projectOsLoginEnabled =
    projectMetadata?.items?.some(
      (item) =>
        item.key === "enable-oslogin" &&
        (item.value === "true" ||
          item.value === "TRUE" ||
          item.value === true)
    ) || false;

  instances.forEach((vm) => {
    let instanceOsLoginEnabled = false;

    // Extract instance-level metadata
    const metadataItems = vm.metadataItems || [];

    // Look for override enabling OS Login at instance level
    const osLoginEntry = metadataItems.find(
      (item) =>
        item.key === "enable-oslogin" &&
        (item.value === "true" ||
          item.value === "TRUE" ||
          item.value === true)
    );

    if (osLoginEntry) {
      instanceOsLoginEnabled = true;
    }

    // Computing final decision
    const isOsLoginEnabled =
      instanceOsLoginEnabled || projectOsLoginEnabled;

    // If OS Login is disabled → add to risky list
    if (!isOsLoginEnabled) {
      riskyInstances.push({
        name: vm.name,
        zone: vm.zone,
        machineType: vm.machineType,
        status: vm.status,
        osLoginStatus: "Disabled (Not Enforced)",
        recommendation:
          "Enable OS Login to enforce IAM-based SSH access and eliminate unmanaged SSH keys."
      });
    }
  });

  return {
    ruleId: "GCP-COMPUTE-004",
    title: "OS Login Enforcement Check",
    description:
      "Ensures VM instances enforce IAM-based OS Login instead of unmanaged SSH keys. CIS strongly recommends enabling OS Login.",
    totalAffected: riskyInstances.length,
    affectedInstances: riskyInstances,
    recommendation:
      "Enable OS Login at the project or per-instance level to centralize SSH access control and improve security.",
    status: riskyInstances.length > 0 ? "FAIL" : "PASS",
    humanReadableStatus:
      riskyInstances.length > 0
        ? "Some VMs do not enforce OS Login, allowing unmanaged SSH keys and increasing the risk of unauthorized access."
        : "All VMs enforce OS Login. Centralized IAM-based SSH access is properly configured.",
    riskLevel: "HIGH" // 🔥 High-risk: unmanaged SSH keys elevate threat exposure
  };
};
