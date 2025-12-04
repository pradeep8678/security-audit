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

      if (role === "roles/cloudkms.admin") members.forEach(m => kmsAdmins.add(m));
      if (
        role === "roles/cloudkms.cryptoKeyEncrypterDecrypter" ||
        role === "roles/cloudkms.cryptoKeyEncrypter" ||
        role === "roles/cloudkms.cryptoKeyDecrypter"
      )
        members.forEach(m => cryptoUsers.add(m));
    }

    for (const member of cryptoUsers) {
      if (kmsAdmins.has(member)) violatingMembers.add(member);
    }

    results.push({
      projectId,
      status: violatingMembers.size > 0 ? "FAIL" : "PASS",
      violatingMembers: Array.from(violatingMembers),
      message:
        violatingMembers.size > 0
          ? `Separation of duties NOT enforced. Members with both admin and crypto roles: ${Array.from(violatingMembers).join(", ")}`
          : `Separation of duties enforced for all KMS-related roles in project ${projectId}.`,
    });
  } catch (error) {
    console.error("KMS Separation of Duties Check Error:", error);
    results.push({
      error: "Failed to check KMS separation of duties",
      details: error.message,
    });
  }

  return results;
};
