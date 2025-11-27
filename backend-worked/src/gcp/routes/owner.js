const express = require("express");
const multer = require("multer");
const { checkOwnerServiceAccounts } = require("../controllers/ownerController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

router.post("/scan-sa", upload.single("keyFile"), checkOwnerServiceAccounts);

module.exports = router;
