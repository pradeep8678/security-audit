const express = require("express");
const router = express.Router();
const {
  checkAWSAdminIdentities
} = require("../controllers/IAMOwnerController");

router.post("/scan-admin-identities", checkAWSAdminIdentities);

module.exports = router;
