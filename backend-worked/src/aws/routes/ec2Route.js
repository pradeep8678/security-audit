const express = require("express");
const router = express.Router();
const { listEC2Instances } = require("../controllers/ec2Controller");

router.post("/scan-ec2", listEC2Instances);

module.exports = router;
