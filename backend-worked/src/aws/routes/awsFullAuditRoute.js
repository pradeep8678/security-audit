const express = require("express");
const router = express.Router();

const awsFullAudit = require("../controllers/fullAuditController");

router.post("/aws-full-audit", awsFullAudit.runFullAwsAudit);

module.exports = router;
