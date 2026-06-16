const router = require('express').Router();
const ctrl = require('../controllers/indicator.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { indicatorRules, validate } = require('../validators');

/** GET /api/indicators/period/:periodId — ดึงตัวชี้วัดทั้งหมดในรอบประเมิน (ต้องอยู่ก่อน /:id) */
router.get('/period/:periodId', auth, ctrl.getByPeriod);

/** GET /api/indicators/:id — ดึงตัวชี้วัดตาม ID */
router.get('/:id', auth, ctrl.getById);

/** PUT /api/indicators/:id — แก้ไขตัวชี้วัด */
router.put('/:id', auth, authorize('hr'), indicatorRules, validate, ctrl.update);

/** DELETE /api/indicators/:id — ลบตัวชี้วัด */
router.delete('/:id', auth, authorize('hr'), ctrl.remove);

module.exports = router;
