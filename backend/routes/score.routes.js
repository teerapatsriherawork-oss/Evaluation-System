const router = require('express').Router();
const ctrl = require('../controllers/score.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { scoreRules, selfAssessmentRules, validate } = require('../validators');

// ============ Self Assessment ============

/** GET /api/self-assessments/progress/:evaluateeId — ดูความคืบหน้า (ต้องอยู่ก่อน /:evaluateeId) */
router.get('/self-assessments/progress/:evaluateeId', auth, ctrl.getProgress);

/** GET /api/self-assessments/:evaluateeId — ดึง self-assessment ของผู้ประเมิน */
router.get('/self-assessments/:evaluateeId', auth, ctrl.getSelfAssessments);

/** POST /api/self-assessments — สร้าง/อัพเดท self-assessment */
router.post('/self-assessments', auth, authorize('evaluatee'), selfAssessmentRules, validate, ctrl.upsertSelfAssessment);

// ============ Committee Scores ============

/** GET /api/scores/assignment/:assignmentId — ดึงคะแนนของ assignment */
router.get('/scores/assignment/:assignmentId', auth, ctrl.getByAssignment);

/** GET /api/scores/result/:assignmentId — ดึงผลการประเมินที่ submit แล้ว */
router.get('/scores/result/:assignmentId', auth, ctrl.getResult);

/** GET /api/scores/feedback/:evaluateeId — ดูผลประเมินจากกรรมการ */
router.get('/scores/feedback/:evaluateeId', auth, ctrl.getFeedback);

/** POST /api/scores — บันทึกคะแนน */
router.post('/scores', auth, authorize('committee'), scoreRules, validate, ctrl.upsertScore);

/** POST /api/scores/submit/:assignmentId — ยืนยันส่งผลการประเมิน */
router.post('/scores/submit/:assignmentId', auth, authorize('committee'), ctrl.submitEvaluation);

module.exports = router;
