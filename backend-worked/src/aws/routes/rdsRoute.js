const express = require("express");
const router = express.Router();
const { checkRdsPublicInstances } = require("../controllers/rdsController");

// POST /api/aws/check-rds-public
router.post("/scan-rds-public", checkRdsPublicInstances);

module.exports = router;
