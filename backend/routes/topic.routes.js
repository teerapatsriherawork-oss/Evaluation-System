const router = require('express').Router();
const ctrl = require('../controllers/indicator.controller');
const evalCtrl = require('../controllers/evaluation.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { indicatorRules, topicRules, validate } = require('../validators');

// ============ Topic routes ============

/** PUT /api/topics/:id — แก้ไขหัวข้อ */
router.put('/:id', auth, authorize('hr'), topicRules, validate, evalCtrl.updateTopic);

/** DELETE /api/topics/:id — ลบหัวข้อ */
router.delete('/:id', auth, authorize('hr'), evalCtrl.removeTopic);

/** GET /api/topics/:topicId/indicators — ดึงตัวชี้วัดในหัวข้อ */
router.get('/:topicId/indicators', auth, ctrl.getByTopic);

/** POST /api/topics/:topicId/indicators — สร้างตัวชี้วัดใหม่ */
router.post('/:topicId/indicators', auth, authorize('hr'), indicatorRules, validate, ctrl.create);

module.exports = router;
