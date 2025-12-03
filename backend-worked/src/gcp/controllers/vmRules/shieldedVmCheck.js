/**
 * Rule: Shielded VM Security Posture
 * ----------------------------------
 * Verifies whether Secure Boot, vTPM, and Integrity Monitoring
 * are enabled on each VM instance. These protections defend
 * against boot-level malware, tampering, and rootkits.
 */

module.exports = function checkShieldedVM(instances) {
  const riskyInstances = [];

  instances.forEach((vm) => {
    const shieldConfig = vm.shieldedVMConfig || {};

    const secureBoot = shieldConfig.enableSecureBoot || false;
    const vTPM = shieldConfig.enableVtpm || false;
    const integrityMonitoring = shieldConfig.enableIntegrityMonitoring || false;

    // If ANY Shielded VM protection is missing → mark risky
    if (!secureBoot || !vTPM || !integrityMonitoring) {
      riskyInstances.push({
        name: vm.name,
        zone: vm.zone,
        machineType: vm.machineType,
        status: vm.status,
        shieldedVmSettings: {
          secureBootEnabled: secureBoot,
          vTPMEnabled: vTPM,
          integrityMonitoringEnabled: integrityMonitoring
        },
        exposureRisk: "HIGH", // per-instance risk
        recommendation:
          "Enable all Shielded VM features (Secure Boot, vTPM, Integrity Monitoring) for maximum protection."
      });
    }
  });

  return {
    ruleId: "GCP-COMPUTE-003",
    title: "Shielded VM Protection Check",
    description:
      "Evaluates each VM to ensure Shielded VM protections (Secure Boot, vTPM, Integrity Monitoring) are enabled. These settings reduce risk of bootloader and kernel-level tampering.",
    totalAffected: riskyInstances.length,
    affectedInstances: riskyInstances,
    recommendation:
      "Enable Secure Boot, vTPM, and Integrity Monitoring on all applicable VMs to enforce boot-level security protections.",
    status: riskyInstances.length > 0 ? "FAIL" : "PASS",
    humanReadableStatus:
      riskyInstances.length > 0
        ? "Some VMs do not have complete Shielded VM protection enabled, increasing exposure to low-level attacks."
        : "All VMs have full Shielded VM protection enabled.",
    riskLevel: riskyInstances.length > 0 ? "HIGH" : "LOW" // overall risk
  };
};
