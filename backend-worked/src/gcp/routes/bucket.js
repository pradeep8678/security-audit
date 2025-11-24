const express = require('express');
const router = express.Router();
const multer = require('multer');
const bucketController = require('../controllers/bucketController');

// Memory storage to avoid saving sensitive key files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ✅ POST /api/list-buckets
router.post('/list-buckets', upload.single('keyFile'), bucketController.listBuckets);

module.exports = router;
