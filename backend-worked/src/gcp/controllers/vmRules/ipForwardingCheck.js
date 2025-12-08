/**
 * Rule: Ensure That IP Forwarding Is Not Enabled on Instances
 * -----------------------------------------------------------
 * IP forwarding allows a VM to route network traffic.
 * This should only be enabled for router/NAT/security-appliance workloads.
 * For normal VM instances, this increases security risk.
 */

module.exports = function checkIpForwarding(instances) {
  const riskyInstances = [];

  instances.forEach((vm) => {
    const canForward = vm.canIpForward || false;

    if (canForward) {
      riskyInstances.push({
        name: vm.name,
        zone: vm.zone,
        machineType: vm.machineType,
        status: vm.status,
        ipForwardingEnabled: true,
        exposureRisk: "HIGH", // per-VM risk
        recommendation:
          "Disable IP forwarding unless this VM is intended to act as a router, NAT gateway, or network appliance.",
      });
    }
  });

  return {
    ruleId: "GCP-COMPUTE-006",
    title: "IP Forwarding Should Be Disabled",
    description:
      "Identifies VM instances that have IP forwarding enabled. This setting should be disabled unless required for specific networking functions.",
    totalAffected: riskyInstances.length,
    affectedInstances: riskyInstances,
    recommendation:
      "Only enable IP forwarding for VMs functioning as routing or NAT devices. Disable it for regular compute workloads.",
    status: riskyInstances.length > 0 ? "FAIL" : "PASS",
    humanReadableStatus:
      riskyInstances.length > 0
        ? "Some VMs have IP forwarding enabled, which may expose them to unintended traffic routing risks."
        : "All VMs have IP forwarding disabled — ideal configuration for most workloads.",
    exposureRisk: riskyInstances.length > 0 ? "HIGH" : "LOW", // overall risk
  };
};
