/**
 * Rule: Ensure VM Instances Are NOT Using the Default Service Account
 * -------------------------------------------------------------------
 * The default Compute Engine service account has broad permissions
 * and violates least-privilege best practices. Using it increases
 * the blast radius of compromised credentials.
 */

module.exports = function checkDefaultServiceAccount(instances) {
  const riskyInstances = [];

  instances.forEach((vm) => {
    const attachedSA = vm.serviceAccounts?.[0]?.email || null;

    if (!attachedSA) return;

    // Match default Compute Engine service account format
    const isDefault =
      attachedSA.includes("compute@developer.gserviceaccount.com");

    if (isDefault) {
      riskyInstances.push({
        name: vm.name,
        zone: vm.zone,
        machineType: vm.machineType,
        status: vm.status,
        serviceAccount: attachedSA,
        exposureRisk: "HIGH", // individual VM risk
        recommendation:
          "Assign a custom service account with least-privilege IAM permissions instead of using the default one.",
      });
    }
  });

  return {
    ruleId: "GCP-COMPUTE-002",
    title: "Default Service Account Usage Check",
    description:
      "Identifies VM instances using the default Compute Engine service account, which has overly broad permissions.",
    totalAffected: riskyInstances.length,
    affectedInstances: riskyInstances,
    recommendation:
      "Create and attach a custom service account with restricted IAM roles to each VM.",
    status: riskyInstances.length > 0 ? "FAIL" : "PASS",
    humanReadableStatus:
      riskyInstances.length > 0
        ? "Some VMs are using the default Compute Engine service account, which is not recommended."
        : "No VM is using the default service account. Good IAM practice!",
    exposureRisk: riskyInstances.length > 0 ? "HIGH" : "LOW", // overall risk
  };
};
