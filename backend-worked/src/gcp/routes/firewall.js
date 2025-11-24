const express = require("express");
const multer = require("multer");
const { scanFirewallRules } = require("../controllers/firewallController");

const router = express.Router();
const upload = multer();

// POST → /api/scan-firewall
router.post("/scan-firewall", upload.single("keyFile"), scanFirewallRules);

module.exports = router;
