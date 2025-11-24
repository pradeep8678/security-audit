// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');


// const gcpController = require('../controllers/gcpController');


// const upload = multer({
//   dest: path.join(__dirname, '../../uploads/'),
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
// });


// router.post('/list-vms', upload.single('keyFile'), gcpController.listVMs);

// module.exports = router;


// upar wala disk mein store kar raha h ( unsecure )

const express = require('express');
const router = express.Router();
const multer = require('multer');

// ✅ Import controller
const gcpController = require('../controllers/gcpController');

// ✅ Secure multer configuration: use memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ✅ Routes
// keyFile comes from the frontend form field name
router.post('/list-vms', upload.single('keyFile'), gcpController.listVMs);

module.exports = router;
