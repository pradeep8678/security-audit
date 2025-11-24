const express = require("express");
const router = express.Router();
const rdsController = require("../controllers/rdsController");

// POST /api/aws/check-rds-public
router.post("/scan-rds-public", rdsController.checkRdsPublicInstances);

module.exports = router;
