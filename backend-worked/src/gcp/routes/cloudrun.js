const express = require("express");
const multer = require("multer");
const { scanCloudRunAndFunctions } = require("../controllers/cloudrunController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ✅ POST → /api/scan-cloudrun-function
router.post("/scan-cloudrun-function", upload.single("keyFile"), scanCloudRunAndFunctions);

module.exports = router;
