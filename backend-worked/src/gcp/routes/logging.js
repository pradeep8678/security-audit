const express = require("express");
const multer = require("multer");
const { checkLogging } = require("../controllers/loggingController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

router.post("/scan-logging", upload.single("keyFile"), checkLogging);

module.exports = router;
