const express = require("express");
const multer = require("multer");
const router = express.Router();
const networkController = require("../controllers/networkController");

// Memory storage to keep key file in memory (no disk write)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

router.post("/scan-network", upload.single("keyFile"), networkController.checkNETWORK);

module.exports = router;
