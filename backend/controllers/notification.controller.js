/**
 * Notification Controller — การแจ้งเตือนของผู้ใช้ปัจจุบัน
 */
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok } = require('../utils/response');

// GET /api/notifications — รายการแจ้งเตือนของฉัน (ล่าสุด 50)
exports.getMine = wrap(async (req, res) => {
  ok(res, await db.many(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  ));
});

// PATCH /api/notifications/read-all — ทำเครื่องหมายอ่านทั้งหมด
exports.markAllRead = wrap(async (req, res) => {
  await db.run('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
  ok(res, null, 'อ่านทั้งหมดแล้ว');
});

// PATCH /api/notifications/:id/read — ทำเครื่องหมายอ่านรายการเดียว
exports.markRead = wrap(async (req, res) => {
  await db.run('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]);
  ok(res, null, 'อ่านแล้ว');
});
