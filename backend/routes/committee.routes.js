const router = require('express').Router();
const ctrl = require('../controllers/committee.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { assignmentRules, validate } = require('../validators');

/** GET /api/assignments — ดึงการมอบหมายทั้งหมด (?period_id=1) */
router.get('/', auth, ctrl.getAll);

/** POST /api/assignments — มอบหมายกรรมการ (HR) */
router.post('/', auth, authorize('hr'), assignmentRules, validate, ctrl.create);

/** GET /api/assignments/committee/check/:assignmentId — ดูสถานะ assignment (ต้องอยู่ก่อน /:id) */
router.get('/committee/check/:assignmentId', auth, ctrl.checkAssignment);

/** GET /api/assignments/committee/:committeeId — ผู้รับการประเมินของกรรมการ */
router.get('/committee/:committeeId', auth, ctrl.getByCommittee);

/** GET /api/assignments/evaluatee/:evaluateeId — กรรมการที่ประเมินตนเอง */
router.get('/evaluatee/:evaluateeId', auth, ctrl.getByEvaluatee);

/** PUT /api/assignments/:id — แก้ไขการมอบหมาย */
router.put('/:id', auth, authorize('hr'), ctrl.update);

/** DELETE /api/assignments/:id — ลบการมอบหมาย */
router.delete('/:id', auth, authorize('hr'), ctrl.remove);

module.exports = router;
