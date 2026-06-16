const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/upload.controller');
const auth = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('ไม่รองรับประเภทไฟล์นี้'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/** POST /api/upload — อัปโหลดไฟล์เดียว */
router.post('/', auth, upload.single('file'), ctrl.uploadFile);

/** POST /api/upload/multiple — อัปโหลดหลายไฟล์ */
router.post('/multiple', auth, upload.array('files', 10), ctrl.uploadMultiple);

/** GET /api/upload/list — รายการไฟล์ (?user_id=1) */
router.get('/list', auth, ctrl.getFiles);

/** DELETE /api/upload/:id — ลบไฟล์ */
router.delete('/:id', auth, ctrl.deleteFile);

module.exports = router;
