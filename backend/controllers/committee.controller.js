/**
 * Committee Controller
 * จัดการมอบหมายกรรมการและการประเมิน
 */
const db = require('../config/db');

// GET /api/assignments — ดึงการมอบหมายทั้งหมด (?period_id=1)
exports.getAll = async (req, res) => {
  try {
    let query = `
      SELECT ca.*, 
        c.full_name as committee_name, c.department as committee_dept,
        e.full_name as evaluatee_name, e.department as evaluatee_dept,
        ep.title as period_title
      FROM committee_assignments ca
      JOIN users c ON ca.committee_id = c.id
      JOIN users e ON ca.evaluatee_id = e.id
      JOIN evaluation_periods ep ON ca.period_id = ep.id
      WHERE 1=1`;
    const params = [];

    if (req.query.period_id) {
      query += ' AND ca.period_id = ?';
      params.push(req.query.period_id);
    }
    query += ' ORDER BY ca.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Assignment getAll error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// POST /api/assignments — มอบหมายกรรมการ
exports.create = async (req, res) => {
  try {
    const { period_id, committee_id, evaluatee_id, committee_role } = req.body;
    const [result] = await db.query(
      `INSERT INTO committee_assignments (period_id, committee_id, evaluatee_id, committee_role)
       VALUES (?, ?, ?, ?)`,
      [period_id, committee_id, evaluatee_id, committee_role || 'member']
    );
    res.status(201).json({
      status: 'success',
      message: 'มอบหมายกรรมการสำเร็จ',
      data: { id: result.insertId }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'กรรมการท่านนี้ถูกมอบหมายแล้ว', data: null });
    }
    console.error('Assignment create error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PUT /api/assignments/:id — แก้ไขการมอบหมาย
exports.update = async (req, res) => {
  try {
    const { committee_role, status } = req.body;
    const fields = [];
    const params = [];
    if (committee_role) { fields.push('committee_role=?'); params.push(committee_role); }
    if (status) { fields.push('status=?'); params.push(status); }
    if (fields.length === 0) {
      return res.status(400).json({ status: 'error', message: 'ไม่มีข้อมูลที่ต้องแก้ไข', data: null });
    }
    params.push(req.params.id);
    await db.query(`UPDATE committee_assignments SET ${fields.join(', ')} WHERE id=?`, params);
    res.json({ status: 'success', message: 'แก้ไขสำเร็จ', data: { id: req.params.id } });
  } catch (error) {
    console.error('Assignment update error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// DELETE /api/assignments/:id — ลบการมอบหมาย
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM committee_assignments WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล', data: null });
    }
    res.json({ status: 'success', message: 'ลบสำเร็จ', data: null });
  } catch (error) {
    console.error('Assignment remove error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/assignments/committee/:committeeId — ดึงรายชื่อผู้รับการประเมินที่กรรมการต้องประเมิน
// ?all=true — ดึงทุกรอบประเมิน (สำหรับหน้าผลการประเมิน)
exports.getByCommittee = async (req, res) => {
  try {
    const includeAll = req.query.all === 'true';
    const query = `SELECT ca.*, e.full_name as evaluatee_name, e.department, e.position, e.email,
        ep.title as period_title, ep.start_date, ep.end_date
       FROM committee_assignments ca
       JOIN users e ON ca.evaluatee_id = e.id
       JOIN evaluation_periods ep ON ca.period_id = ep.id
       WHERE ca.committee_id = ?${includeAll ? '' : ' AND ep.is_active = 1'}
       ORDER BY ca.status ASC, e.full_name ASC`;
    const [rows] = await db.query(query, [req.params.committeeId]);
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Assignment getByCommittee error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/assignments/evaluatee/:evaluateeId — ดึงกรรมการที่ประเมินตนเอง
exports.getByEvaluatee = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ca.*, c.full_name as committee_name, c.department, c.position,
        ep.title as period_title
       FROM committee_assignments ca
       JOIN users c ON ca.committee_id = c.id
       JOIN evaluation_periods ep ON ca.period_id = ep.id
       WHERE ca.evaluatee_id = ? AND ep.is_active = 1
       ORDER BY ca.committee_role ASC`,
      [req.params.evaluateeId]
    );
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Assignment getByEvaluatee error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/assignments/committee/check/:assignmentId — ดูสถานะ assignment
exports.checkAssignment = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, period_id, committee_id, evaluatee_id, committee_role, status FROM committee_assignments WHERE id = ?',
      [req.params.assignmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล', data: null });
    }
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows[0] });
  } catch (error) {
    console.error('Assignment check error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};
