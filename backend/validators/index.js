/**
 * Validators
 * ตรวจสอบข้อมูลด้วย express-validator
 */
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

// Middleware ตรวจสอบผลลัพธ์ validation
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'ข้อมูลไม่ถูกต้อง',
      data: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Auth validators
exports.loginRules = [
  body('username').notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้').trim(),
  body('password').notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
];

exports.registerRules = [
  body('username').notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้')
    .isLength({ min: 3, max: 50 }).withMessage('ชื่อผู้ใช้ต้องมี 3-50 ตัวอักษร').trim(),
  body('password').notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
    .isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  body('full_name').notEmpty().withMessage('กรุณากรอกชื่อ-สกุล').trim(),
  body('email').optional().isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง')
];

// Evaluation validators
exports.evaluationRules = [
  body('title').notEmpty().withMessage('กรุณากรอกชื่อรอบประเมิน').trim(),
  body('start_date').notEmpty().withMessage('กรุณากรอกวันเริ่มต้น').isDate().withMessage('รูปแบบวันที่ไม่ถูกต้อง'),
  body('end_date').notEmpty().withMessage('กรุณากรอกวันสิ้นสุด').isDate().withMessage('รูปแบบวันที่ไม่ถูกต้อง')
];

// Topic validators
exports.topicRules = [
  body('title').notEmpty().withMessage('กรุณากรอกชื่อหัวข้อ').trim()
];

// Indicator validators
exports.indicatorRules = [
  body('name').notEmpty().withMessage('กรุณากรอกชื่อตัวชี้วัด').trim(),
  body('weight').optional().isFloat({ min: 0 }).withMessage('น้ำหนักคะแนนต้องเป็นตัวเลข'),
  body('score_type').optional().isIn(['boolean', 'scale']).withMessage('รูปแบบการประเมินไม่ถูกต้อง')
];

// Score validators
exports.scoreRules = [
  body('assignment_id').notEmpty().withMessage('กรุณาระบุ assignment').isInt(),
  body('indicator_id').notEmpty().withMessage('กรุณาระบุตัวชี้วัด').isInt(),
  body('score').notEmpty().withMessage('กรุณากรอกคะแนน').isInt({ min: 0, max: 4 }).withMessage('คะแนนต้องอยู่ระหว่าง 0-4')
];

// Self-assessment validators
exports.selfAssessmentRules = [
  body('indicator_id').notEmpty().withMessage('กรุณาระบุตัวชี้วัด').isInt()
];

// Assignment validators
exports.assignmentRules = [
  body('period_id').notEmpty().withMessage('กรุณาระบุรอบประเมิน').isInt(),
  body('committee_id').notEmpty().withMessage('กรุณาระบุกรรมการ').isInt(),
  body('evaluatee_id').notEmpty().withMessage('กรุณาระบุผู้รับการประเมิน').isInt()
];

// ID param validator
exports.idParam = [
  param('id').isInt().withMessage('ID ไม่ถูกต้อง')
];
