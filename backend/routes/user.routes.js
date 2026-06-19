const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

/** GET /api/users — ดึงรายชื่อผู้ใช้ (?role=evaluatee&search=keyword) */
router.get('/', auth, authorize('hr'), ctrl.getAll);

/** PUT /api/users/profile — แก้ไขข้อมูลตนเอง (ต้องอยู่ก่อน /:id) */
router.put('/profile', auth, ctrl.updateProfile);

/** GET /api/users/:id — ดึงข้อมูลผู้ใช้ตาม ID */
router.get('/:id', auth, ctrl.getById);

/** PUT /api/users/:id — แก้ไขข้อมูลผู้ใช้ (HR) */
router.put('/:id', auth, authorize('hr'), ctrl.update);

/** PUT /api/users/:id/password — เปลี่ยนรหัสผ่าน */
router.put('/:id/password', auth, ctrl.changePassword);

/** DELETE /api/users/:id — ลบผู้ใช้ */
router.delete('/:id', auth, authorize('hr'), ctrl.remove);

module.exports = router;
