const express = require("express");
const router = express.Router();

const {
  listAwsLoadBalancers
} = require("../controllers/lbControllers");

router.post("/scan-awslb", listAwsLoadBalancers);

module.exports = router;
