const express = require("express");
const multer = require("multer");
const { checkSQL } = require("../controllers/sqlController");

const router = express.Router();
const upload = multer();

// ✅ POST API that accepts uploaded key file
router.post("/scan-sql", upload.single('keyFile'), checkSQL);

module.exports = router;
