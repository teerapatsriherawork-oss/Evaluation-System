/**
 * Committee Controller — มอบหมายกรรมการและการประเมิน
 */
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, created, fail, notFound } = require('../utils/response');

// GET /api/assignments — ดึงการมอบหมายทั้งหมด (?period_id=1)
exports.getAll = wrap(async (req, res) => {
  let sql = `
    SELECT ca.*, c.full_name as committee_name, c.department as committee_dept,
      e.full_name as evaluatee_name, e.department as evaluatee_dept, ep.title as period_title
    FROM committee_assignments ca
    JOIN users c ON ca.committee_id = c.id
    JOIN users e ON ca.evaluatee_id = e.id
    JOIN evaluation_periods ep ON ca.period_id = ep.id
    WHERE 1=1`;
  const params = [];
  if (req.query.period_id) { sql += ' AND ca.period_id = ?'; params.push(req.query.period_id); }
  sql += ' ORDER BY ca.created_at DESC';
  ok(res, await db.many(sql, params));
});

// POST /api/assignments — มอบหมายกรรมการ
exports.create = wrap(async (req, res) => {
  const { period_id, committee_id, evaluatee_id, committee_role } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO committee_assignments (period_id, committee_id, evaluatee_id, committee_role) VALUES (?, ?, ?, ?)',
      [period_id, committee_id, evaluatee_id, committee_role || 'member']
    );
    created(res, { id: result.insertId }, 'มอบหมายกรรมการสำเร็จ');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return fail(res, 400, 'กรรมการท่านนี้ถูกมอบหมายแล้ว');
    throw e;
  }
});

// PUT /api/assignments/:id — แก้ไขการมอบหมาย (อัปเดตเฉพาะฟิลด์ที่ส่งมา)
exports.update = wrap(async (req, res) => {
  const { committee_role, status } = req.body;
  const result = await db.update('committee_assignments', { committee_role, status }, 'id=?', [req.params.id]);
  if (result.noFields) return fail(res, 400, 'ไม่มีข้อมูลที่ต้องแก้ไข');
  ok(res, { id: req.params.id }, 'แก้ไขสำเร็จ');
});

// DELETE /api/assignments/:id
exports.remove = wrap(async (req, res) => {
  const result = await db.run('DELETE FROM committee_assignments WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return notFound(res, 'ไม่พบข้อมูล');
  ok(res, null, 'ลบสำเร็จ');
});

// GET /api/assignments/committee/:committeeId — ผู้รับการประเมินที่กรรมการต้องประเมิน (?all=true = ทุกรอบ)
exports.getByCommittee = wrap(async (req, res) => {
  const includeAll = req.query.all === 'true';
  const sql = `SELECT ca.*, e.full_name as evaluatee_name, e.department, e.position, e.email,
      ep.title as period_title, ep.start_date, ep.end_date
     FROM committee_assignments ca
     JOIN users e ON ca.evaluatee_id = e.id
     JOIN evaluation_periods ep ON ca.period_id = ep.id
     WHERE ca.committee_id = ?${includeAll ? '' : ' AND ep.is_active = 1'}
     ORDER BY ca.status ASC, e.full_name ASC`;
  ok(res, await db.many(sql, [req.params.committeeId]));
});

// GET /api/assignments/evaluatee/:evaluateeId — กรรมการที่ประเมินผู้รับการประเมินคนนี้
exports.getByEvaluatee = wrap(async (req, res) => {
  ok(res, await db.many(
    `SELECT ca.*, c.full_name as committee_name, c.department, c.position, ep.title as period_title
     FROM committee_assignments ca
     JOIN users c ON ca.committee_id = c.id
     JOIN evaluation_periods ep ON ca.period_id = ep.id
     WHERE ca.evaluatee_id = ? AND ep.is_active = 1
     ORDER BY ca.committee_role ASC`,
    [req.params.evaluateeId]
  ));
});

// GET /api/assignments/committee/check/:assignmentId — ดูสถานะ assignment
exports.checkAssignment = wrap(async (req, res) => {
  const row = await db.one(
    'SELECT id, period_id, committee_id, evaluatee_id, committee_role, status FROM committee_assignments WHERE id = ?',
    [req.params.assignmentId]
  );
  if (!row) return notFound(res, 'ไม่พบข้อมูล');
  ok(res, row);
});
