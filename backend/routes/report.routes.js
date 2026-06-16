const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

/** GET /api/reports/individual/:evaluateeId — รายงานรายบุคคล */
router.get('/individual/:evaluateeId', auth, ctrl.getIndividualReport);

/** GET /api/reports/summary/:periodId — สรุปภาพรวมรอบประเมิน */
router.get('/summary/:periodId', auth, authorize('hr'), ctrl.getPeriodSummary);

/** GET /api/reports/statistics/:periodId — สถิติ */
router.get('/statistics/:periodId', auth, authorize('hr'), ctrl.getStatistics);

/** GET /api/reports/tracking/:periodId — ติดตามสถานะ */
router.get('/tracking/:periodId', auth, authorize('hr'), ctrl.getTracking);

/** GET /api/reports/pdf/:evaluateeId — ออกรายงานรายบุคคลเป็น PDF */
router.get('/pdf/:evaluateeId', auth, ctrl.exportPdf);

/** GET /api/reports/csv/:periodId — ส่งออกผลรวมเป็น CSV/Excel (HR) */
router.get('/csv/:periodId', auth, authorize('hr'), ctrl.exportCsv);

/** POST /api/reports/backup — สำรองข้อมูล (HR) */
router.post('/backup', auth, authorize('hr'), ctrl.createBackup);

/** POST /api/reports/restore — กู้คืนข้อมูล (HR) */
router.post('/restore', auth, authorize('hr'), ctrl.restoreBackup);

/** GET /api/reports/backup/list — รายการ backups */
router.get('/backup/list', auth, authorize('hr'), ctrl.getBackups);

module.exports = router;
