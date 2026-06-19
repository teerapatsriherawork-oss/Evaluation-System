/**
 * Indicator Controller — ตัวชี้วัด (KPIs) ในแต่ละหัวข้อ
 */
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, created, notFound } = require('../utils/response');

// GET /api/topics/:topicId/indicators
exports.getByTopic = wrap(async (req, res) => {
  ok(res, await db.many('SELECT * FROM indicators WHERE topic_id = ? ORDER BY sort_order ASC', [req.params.topicId]));
});

// GET /api/indicators/:id
exports.getById = wrap(async (req, res) => {
  const row = await db.one('SELECT * FROM indicators WHERE id = ?', [req.params.id]);
  if (!row) return notFound(res, 'ไม่พบตัวชี้วัด');
  ok(res, row);
});

// POST /api/topics/:topicId/indicators
exports.create = wrap(async (req, res) => {
  const { name, description, weight, evidence_type, score_type, score_levels, sort_order } = req.body;
  const result = await db.run(
    `INSERT INTO indicators (topic_id, name, description, weight, evidence_type, score_type, score_levels, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.topicId, name, description, weight || 1, evidence_type || 'both', score_type || 'scale', score_levels || null, sort_order || 0]
  );
  created(res, { id: result.insertId, name }, 'สร้างตัวชี้วัดสำเร็จ');
});

// PUT /api/indicators/:id
exports.update = wrap(async (req, res) => {
  const { name, description, weight, evidence_type, score_type, score_levels, sort_order } = req.body;
  const result = await db.run(
    `UPDATE indicators SET name=?, description=?, weight=?, evidence_type=?, score_type=?, score_levels=?, sort_order=? WHERE id=?`,
    [name, description, weight, evidence_type, score_type, score_levels, sort_order, req.params.id]
  );
  if (!result.affectedRows) return notFound(res, 'ไม่พบตัวชี้วัด');
  ok(res, { id: req.params.id }, 'แก้ไขสำเร็จ');
});

// DELETE /api/indicators/:id
exports.remove = wrap(async (req, res) => {
  const result = await db.run('DELETE FROM indicators WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return notFound(res, 'ไม่พบตัวชี้วัด');
  ok(res, null, 'ลบสำเร็จ');
});

// GET /api/indicators/period/:periodId — ดึงตัวชี้วัดทั้งหมดในรอบ (พร้อมชื่อหัวข้อ)
exports.getByPeriod = wrap(async (req, res) => {
  ok(res, await db.many(
    `SELECT i.*, t.title as topic_title, t.sort_order as topic_sort_order
     FROM indicators i JOIN evaluation_topics t ON i.topic_id = t.id
     WHERE t.period_id = ? ORDER BY t.sort_order ASC, i.sort_order ASC`,
    [req.params.periodId]
  ));
});
