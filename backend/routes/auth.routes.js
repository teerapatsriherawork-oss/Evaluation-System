const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const { loginRules, registerRules, validate } = require('../validators');

/**
 * @route POST /api/auth/register
 * @desc ลงทะเบียนผู้ใช้ใหม่
 * @body { username, password, full_name, email?, phone?, department?, position?, role? }
 */
router.post('/register', registerRules, validate, ctrl.register);

/**
 * @route POST /api/auth/login
 * @desc เข้าสู่ระบบ (JWT → httpOnly Cookie)
 * @body { username, password }
 */
router.post('/login', loginRules, validate, ctrl.login);

/**
 * @route POST /api/auth/logout
 * @desc ออกจากระบบ (ล้าง Cookie)
 */
router.post('/logout', ctrl.logout);

/**
 * @route GET /api/auth/me
 * @desc ดึงข้อมูลผู้ใช้ปัจจุบัน
 * @auth Required
 */
router.get('/me', auth, ctrl.getMe);

module.exports = router;
