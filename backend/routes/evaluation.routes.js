const router = require('express').Router();
const ctrl = require('../controllers/evaluation.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { evaluationRules, topicRules, validate } = require('../validators');

/**
 * @route GET /api/evaluations
 * @desc ดึงรอบประเมินทั้งหมด
 * @query ?is_active=true
 */
router.get('/', auth, ctrl.getAll);

/**
 * @route GET /api/evaluations/:id
 * @desc ดึงรอบประเมินตาม ID
 */
router.get('/:id', auth, ctrl.getById);

/**
 * @route POST /api/evaluations
 * @desc สร้างรอบประเมินใหม่ (HR เท่านั้น)
 * @body { title, description, start_date, end_date, is_active }
 */
router.post('/', auth, authorize('hr'), evaluationRules, validate, ctrl.create);

/**
 * @route PUT /api/evaluations/:id
 * @desc แก้ไขรอบประเมิน (HR เท่านั้น)
 */
router.put('/:id', auth, authorize('hr'), evaluationRules, validate, ctrl.update);

/**
 * @route PATCH /api/evaluations/:id/toggle
 * @desc เปิด/ปิดรอบประเมิน
 */
router.patch('/:id/toggle', auth, authorize('hr'), ctrl.toggle);

/**
 * @route DELETE /api/evaluations/:id
 * @desc ลบรอบประเมิน
 */
router.delete('/:id', auth, authorize('hr'), ctrl.remove);

// ============ Topics ============

/**
 * @route GET /api/evaluations/:periodId/topics
 * @desc ดึงหัวข้อในรอบประเมิน
 */
router.get('/:periodId/topics', auth, ctrl.getTopics);

/**
 * @route POST /api/evaluations/:periodId/topics
 * @desc สร้างหัวข้อใหม่ (HR)
 * @body { title, description, sort_order }
 */
router.post('/:periodId/topics', auth, authorize('hr'), topicRules, validate, ctrl.createTopic);

module.exports = router;
