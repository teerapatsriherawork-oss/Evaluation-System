const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middleware/auth');

/** GET /api/notifications — แจ้งเตือนของฉัน */
router.get('/', auth, ctrl.getMine);

/** PATCH /api/notifications/read-all — อ่านทั้งหมด (ต้องอยู่ก่อน /:id/read) */
router.patch('/read-all', auth, ctrl.markAllRead);

/** PATCH /api/notifications/:id/read — อ่านรายการเดียว */
router.patch('/:id/read', auth, ctrl.markRead);

module.exports = router;
