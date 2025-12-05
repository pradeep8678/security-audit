const express = require('express');
const router = express.Router();
const multer = require('multer');
const bigqueryController = require('../controllers/bigqueryController');

// Memory storage to avoid saving sensitive key files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ✅ POST /api/list-buckets
router.post('/list-bigquery', upload.single('keyFile'), bigqueryController.checkBigQuery);

module.exports = router;
