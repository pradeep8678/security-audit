const express = require("express");
const router = express.Router();
const { listS3Buckets } = require("../controllers/s3Controller");

router.post("/scan-s3", listS3Buckets);

module.exports = router;
