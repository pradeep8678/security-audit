// iam/checkKmsSeparationOfDuties.js
const { google } = require("googleapis");

module.exports = async function checkKmsSeparationOfDuties(client, projectId) {
  const results = [];

  try {
    const crm = google.cloudresourcemanager("v1");

    const policy = await crm.projects.getIamPolicy({
      resource: projectId,
      auth: client,
      requestBody: {},
    });

    const bindings = policy.data.bindings || [];
    const kmsAdmins = new Set();
    const cryptoUsers = new Set();
    const violatingMembers = new Set();

    for (const binding of bindings) {
      const role = binding.role;
      const members = binding.members || [];

      // Collect KMS Admins
      if (role === "roles/cloudkms.admin") {
        members.forEach((m) => kmsAdmins.add(m));
      }

      // Collect crypto key users
      if (
        role === "roles/cloudkms.cryptoKeyEncrypterDecrypter" ||
        role === "roles/cloudkms.cryptoKeyEncrypter" ||
        role === "roles/cloudkms.cryptoKeyDecrypter"
      ) {
        members.forEach((m) => cryptoUsers.add(m));
      }
    }

    // Identify violations — user having both admin + cryptoKey permissions
    for (const member of cryptoUsers) {
      if (kmsAdmins.has(member)) violatingMembers.add(member);
    }

    // Only return FAIL if violation exists
    if (violatingMembers.size > 0) {
      results.push({
        projectId,
        // status: "FAIL",
        violatingMembers: Array.from(violatingMembers),
        exposureRisk: "🔴 High",
        recommendation:
          "Separate KMS administrative roles from cryptographic key usage roles. No identity should have both admin and encrypter/decrypter permissions.",
      });
    }

    // If no violation → return empty results (no vulnerabilities)
  } catch (error) {
    console.error("KMS Separation of Duties Check Error:", error);
    results.push({
      error: "Failed to check KMS separation of duties",
      details: error.message,
    });
  }

  return results;
};
