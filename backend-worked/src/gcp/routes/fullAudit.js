const express = require('express');
const router = express.Router();
const multer = require('multer');
const fullAuditController = require('../controllers/fullAuditController');

// ✅ Use memory storage so no sensitive key files are saved on disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ✅ POST /api/full-audit
// Upload a GCP service account JSON file and run all audits
router.post('/full-audit', upload.single('keyFile'), fullAuditController.runFullAudit);

module.exports = router;
