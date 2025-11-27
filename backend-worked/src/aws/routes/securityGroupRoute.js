const express = require("express");
const router = express.Router();
const sgController = require("../controllers/securityGroupController");

router.post("/scan-awsfirewall", sgController.scanSecurityGroups);

module.exports = router;
