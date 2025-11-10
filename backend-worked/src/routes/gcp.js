const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// ✅ Correct import of controller
const gcpController = require('../controllers/gcpController');

// ✅ Setup Multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ Routes
router.post('/list-vms', upload.single('keyFile'), gcpController.listVMs);

module.exports = router;
