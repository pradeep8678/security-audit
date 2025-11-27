const express = require("express");
const multer = require("multer");
const { checkGKEClusters } = require("../controllers/gkeController");

const router = express.Router();
const upload = multer();

router.post("/scan-gke", upload.single("keyFile"), checkGKEClusters);

module.exports = router;
