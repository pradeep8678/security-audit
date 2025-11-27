const express = require("express");
const multer = require("multer");
const upload = multer();
const { listEKSClusters } = require("../controllers/EKSController");

const router = express.Router();

router.post("/scan-eks", upload.single("file"), listEKSClusters);

module.exports = router;
