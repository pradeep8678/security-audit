const {
  IAMClient,
  ListUsersCommand,
  ListAttachedUserPoliciesCommand,
  ListRolesCommand,
  ListAttachedRolePoliciesCommand
} = require("@aws-sdk/client-iam");

/**
 * Pure function — For full audit
 * Accepts: AWS credentials
 * Returns: users/roles with AdministratorAccess
 */
async function analyzeAWSAdmins(credentials) {
  try {
    const { accessKeyId, secretAccessKey } = credentials;

    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: "Missing AWS credentials" };
    }

    const iam = new IAMClient({
      region: "us-east-1",
      credentials: { accessKeyId, secretAccessKey }
    });

    const ADMIN_POLICY = "arn:aws:iam::aws:policy/AdministratorAccess";

    let adminUsers = [];
    let adminRoles = [];

    // ---------------------
    // ✔ Check IAM USERS
    // ---------------------
    const usersRes = await iam.send(new ListUsersCommand({}));
    const users = usersRes.Users || [];

    for (const user of users) {
      const policies = await iam.send(
        new ListAttachedUserPoliciesCommand({ UserName: user.UserName })
      );

      const isAdmin = (policies.AttachedPolicies || []).some(
        p => p.PolicyArn === ADMIN_POLICY
      );

      if (isAdmin) {
        adminUsers.push({
          userName: user.UserName,
          type: "IAM_USER",
          attachedPolicy: "AdministratorAccess"
        });
      }
    }

    // ---------------------
    // ✔ Check IAM ROLES
    // ---------------------
    const rolesRes = await iam.send(new ListRolesCommand({}));
    const roles = rolesRes.Roles || [];

    for (const role of roles) {
      const policies = await iam.send(
        new ListAttachedRolePoliciesCommand({ RoleName: role.RoleName })
      );

      const isAdmin = (policies.AttachedPolicies || []).some(
        p => p.PolicyArn === ADMIN_POLICY
      );

      if (isAdmin) {
        adminRoles.push({
          roleName: role.RoleName,
          type: "IAM_ROLE",
          attachedPolicy: "AdministratorAccess"
        });
      }
    }

    return {
      success: true,
      totalAdmins: adminUsers.length + adminRoles.length,
      adminUsers,
      adminRoles
    };

  } catch (err) {
    console.error("❌ Error analyzing AWS IAM admins:", err);
    return { success: false, error: "Failed to analyze IAM admin privileges" };
  }
}


/**
 * 🌐 Express Route version
 * GET Admin-like privileges from AWS
 */
exports.checkAWSAdminIdentities = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        error: "Missing AWS credentials (accessKeyId, secretAccessKey)"
      });
    }

    const result = await analyzeAWSAdmins({ accessKeyId, secretAccessKey });
    res.status(result.success ? 200 : 500).json(result);

  } catch (err) {
    res.status(500).json({ error: "Failed to evaluate AWS admin permissions" });
  }
};

exports.analyzeAWSAdmins = analyzeAWSAdmins;
