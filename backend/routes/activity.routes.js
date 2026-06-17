const router = require('express').Router();
const ctrl = require('../controllers/activity.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

/** GET /api/activity-logs — ดูประวัติการใช้งาน (HR เท่านั้น) */
router.get('/', auth, authorize('hr'), ctrl.getLogs);

module.exports = router;
