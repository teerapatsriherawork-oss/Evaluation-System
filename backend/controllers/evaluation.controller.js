/**
 * Evaluation Controller — รอบการประเมิน (Periods) + หัวข้อการประเมิน (Topics)
 */
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, created, notFound } = require('../utils/response');
const { logActivity } = require('../utils/audit');

// ===== Periods =====

// GET /api/evaluations — ดึงรอบประเมิน (?is_active=true)
exports.getAll = wrap(async (req, res) => {
  if (req.query.is_active !== undefined) {
    const active = req.query.is_active === 'true' ? 1 : 0;
    return ok(res, await db.many('SELECT * FROM evaluation_periods WHERE is_active = ? ORDER BY created_at DESC', [active]));
  }
  ok(res, await db.many('SELECT * FROM evaluation_periods ORDER BY created_at DESC'));
});

// GET /api/evaluations/:id
exports.getById = wrap(async (req, res) => {
  const row = await db.one('SELECT * FROM evaluation_periods WHERE id = ?', [req.params.id]);
  if (!row) return notFound(res, 'ไม่พบรอบการประเมิน');
  ok(res, row);
});

// POST /api/evaluations
exports.create = wrap(async (req, res) => {
  const { title, description, start_date, end_date, is_active } = req.body;
  const result = await db.run(
    `INSERT INTO evaluation_periods (title, description, start_date, end_date, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, start_date, end_date, is_active || false, req.user.id]
  );
  await logActivity(req, 'CREATE', 'evaluation', result.insertId, `สร้างรอบประเมิน "${title}"`);
  created(res, { id: result.insertId, title, start_date, end_date }, 'สร้างรอบการประเมินสำเร็จ');
});

// PUT /api/evaluations/:id
exports.update = wrap(async (req, res) => {
  const { title, description, start_date, end_date, is_active } = req.body;
  const result = await db.run(
    'UPDATE evaluation_periods SET title=?, description=?, start_date=?, end_date=?, is_active=? WHERE id=?',
    [title, description, start_date, end_date, is_active, req.params.id]
  );
  if (!result.affectedRows) return notFound(res, 'ไม่พบรอบการประเมิน');
  await logActivity(req, 'UPDATE', 'evaluation', req.params.id, `แก้ไขรอบประเมิน "${title}"`);
  ok(res, { id: req.params.id }, 'แก้ไขสำเร็จ');
});

// PATCH /api/evaluations/:id/toggle — เปิด/ปิดรอบประเมิน
exports.toggle = wrap(async (req, res) => {
  const row = await db.one('SELECT is_active FROM evaluation_periods WHERE id = ?', [req.params.id]);
  if (!row) return notFound(res, 'ไม่พบรอบการประเมิน');
  const is_active = !row.is_active;
  await db.run('UPDATE evaluation_periods SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
  ok(res, { id: req.params.id, is_active }, is_active ? 'เปิดรอบประเมินแล้ว' : 'ปิดรอบประเมินแล้ว');
});

// DELETE /api/evaluations/:id
exports.remove = wrap(async (req, res) => {
  const result = await db.run('DELETE FROM evaluation_periods WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return notFound(res, 'ไม่พบรอบการประเมิน');
  await logActivity(req, 'DELETE', 'evaluation', req.params.id, 'ลบรอบประเมิน');
  ok(res, null, 'ลบสำเร็จ');
});

// ===== Topics (หัวข้อการประเมิน) =====

// GET /api/evaluations/:periodId/topics
exports.getTopics = wrap(async (req, res) => {
  ok(res, await db.many('SELECT * FROM evaluation_topics WHERE period_id = ? ORDER BY sort_order ASC', [req.params.periodId]));
});

// POST /api/evaluations/:periodId/topics
exports.createTopic = wrap(async (req, res) => {
  const { title, description, sort_order } = req.body;
  const result = await db.run(
    'INSERT INTO evaluation_topics (period_id, title, description, sort_order) VALUES (?, ?, ?, ?)',
    [req.params.periodId, title, description, sort_order || 0]
  );
  created(res, { id: result.insertId, title }, 'สร้างหัวข้อสำเร็จ');
});

// PUT /api/topics/:id
exports.updateTopic = wrap(async (req, res) => {
  const { title, description, sort_order } = req.body;
  const result = await db.run(
    'UPDATE evaluation_topics SET title=?, description=?, sort_order=? WHERE id=?',
    [title, description, sort_order, req.params.id]
  );
  if (!result.affectedRows) return notFound(res, 'ไม่พบหัวข้อ');
  ok(res, { id: req.params.id }, 'แก้ไขสำเร็จ');
});

// DELETE /api/topics/:id
exports.removeTopic = wrap(async (req, res) => {
  const result = await db.run('DELETE FROM evaluation_topics WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return notFound(res, 'ไม่พบหัวข้อ');
  await logActivity(req, 'DELETE', 'topic', req.params.id, 'ลบหัวข้อการประเมิน');
  ok(res, null, 'ลบสำเร็จ');
});
