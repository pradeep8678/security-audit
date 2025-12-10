// loggingRules/accessApprovalCheck.js
const { google } = require("googleapis");

async function checkAccessApproval(keyFile) {
  const findings = [];

  try {
    const accessapproval = google.accessapproval("v1");
    const projectId = keyFile.project_id;

    const res = await accessapproval.projects.getAccessApprovalSettings({
      name: `projects/${projectId}/accessApprovalSettings`,
    });

    if (!res.data.enrolledServices?.length) {
      findings.push({
        issue: "Access Approval disabled",
        exposureRisk: "High",
        recommendation: "Enable Access Approval for required services.",
      });
    }
  } catch (err) {
    findings.push({
      issue: "Access Approval not configured",
      exposureRisk: "High",
      recommendation: "Enable Access Approval.",
    });
  }

  return findings;
}

module.exports = checkAccessApproval;
