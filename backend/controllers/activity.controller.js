/**
 * Activity Controller — ประวัติการใช้งาน (Audit trail) สำหรับ HR ดู
 */
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok } = require('../utils/response');

// GET /api/activity-logs — รายการประวัติ (?limit=100&action=&entity=)
exports.getLogs = wrap(async (req, res) => {
  let sql = `SELECT al.*, u.full_name AS user_name, u.role AS user_role
             FROM activity_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE 1=1`;
  const params = [];
  if (req.query.action) { sql += ' AND al.action = ?'; params.push(req.query.action); }
  if (req.query.entity) { sql += ' AND al.entity = ?'; params.push(req.query.entity); }
  sql += ' ORDER BY al.created_at DESC LIMIT ?';
  params.push(Number(req.query.limit) || 100);
  ok(res, await db.many(sql, params));
});
