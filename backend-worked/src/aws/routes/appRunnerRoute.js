// routes/awsRoutes.js
const express = require("express");
const router = express.Router();

const awsController = require("../controllers/AppRunnerController");

// POST /api/aws-lambda-apprunner
router.post(
  "/scan-lambda-apprunner",
  express.json(),
  awsController.scanAwsLambdaAndAppRunner
);

module.exports = router;
