/**
 * Evaluation Controller
 * จัดการรอบการประเมิน (Evaluation Periods) + หัวข้อการประเมิน (Topics)
 */
const db = require('../config/db');

// GET /api/evaluations — ดึงรอบประเมินทั้งหมด (รองรับ ?is_active=true)
exports.getAll = async (req, res) => {
  try {
    let query = 'SELECT * FROM evaluation_periods ORDER BY created_at DESC';
    let params = [];

    if (req.query.is_active !== undefined) {
      query = 'SELECT * FROM evaluation_periods WHERE is_active = ? ORDER BY created_at DESC';
      params = [req.query.is_active === 'true' ? 1 : 0];
    }

    const [rows] = await db.query(query, params);
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Evaluation getAll error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/evaluations/:id — ดึงรอบประเมินตาม ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evaluation_periods WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรอบการประเมิน', data: null });
    }
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows[0] });
  } catch (error) {
    console.error('Evaluation getById error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// POST /api/evaluations — สร้างรอบประเมินใหม่
exports.create = async (req, res) => {
  try {
    const { title, description, start_date, end_date, is_active } = req.body;
    const [result] = await db.query(
      `INSERT INTO evaluation_periods (title, description, start_date, end_date, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, start_date, end_date, is_active || false, req.user.id]
    );
    res.status(201).json({
      status: 'success',
      message: 'สร้างรอบการประเมินสำเร็จ',
      data: { id: result.insertId, title, start_date, end_date }
    });
  } catch (error) {
    console.error('Evaluation create error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PUT /api/evaluations/:id — แก้ไขรอบประเมิน
exports.update = async (req, res) => {
  try {
    const { title, description, start_date, end_date, is_active } = req.body;
    const [result] = await db.query(
      `UPDATE evaluation_periods SET title=?, description=?, start_date=?, end_date=?, is_active=? WHERE id=?`,
      [title, description, start_date, end_date, is_active, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรอบการประเมิน', data: null });
    }
    res.json({ status: 'success', message: 'แก้ไขสำเร็จ', data: { id: req.params.id } });
  } catch (error) {
    console.error('Evaluation update error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PATCH /api/evaluations/:id/toggle — เปิด/ปิดรอบประเมิน
exports.toggle = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT is_active FROM evaluation_periods WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรอบการประเมิน', data: null });
    }
    const newStatus = !rows[0].is_active;
    await db.query('UPDATE evaluation_periods SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({
      status: 'success',
      message: newStatus ? 'เปิดรอบประเมินแล้ว' : 'ปิดรอบประเมินแล้ว',
      data: { id: req.params.id, is_active: newStatus }
    });
  } catch (error) {
    console.error('Evaluation toggle error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// DELETE /api/evaluations/:id — ลบรอบประเมิน
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM evaluation_periods WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรอบการประเมิน', data: null });
    }
    res.json({ status: 'success', message: 'ลบสำเร็จ', data: null });
  } catch (error) {
    console.error('Evaluation remove error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// ============ Topics (หัวข้อการประเมิน) ============

// GET /api/evaluations/:periodId/topics — ดึงหัวข้อในรอบประเมิน
exports.getTopics = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM evaluation_topics WHERE period_id = ? ORDER BY sort_order ASC',
      [req.params.periodId]
    );
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Topics getAll error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// POST /api/evaluations/:periodId/topics — สร้างหัวข้อใหม่
exports.createTopic = async (req, res) => {
  try {
    const { title, description, sort_order } = req.body;
    const [result] = await db.query(
      `INSERT INTO evaluation_topics (period_id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
      [req.params.periodId, title, description, sort_order || 0]
    );
    res.status(201).json({
      status: 'success',
      message: 'สร้างหัวข้อสำเร็จ',
      data: { id: result.insertId, title }
    });
  } catch (error) {
    console.error('Topic create error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PUT /api/topics/:id — แก้ไขหัวข้อ
exports.updateTopic = async (req, res) => {
  try {
    const { title, description, sort_order } = req.body;
    const [result] = await db.query(
      'UPDATE evaluation_topics SET title=?, description=?, sort_order=? WHERE id=?',
      [title, description, sort_order, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบหัวข้อ', data: null });
    }
    res.json({ status: 'success', message: 'แก้ไขสำเร็จ', data: { id: req.params.id } });
  } catch (error) {
    console.error('Topic update error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// DELETE /api/topics/:id — ลบหัวข้อ
exports.removeTopic = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM evaluation_topics WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบหัวข้อ', data: null });
    }
    res.json({ status: 'success', message: 'ลบสำเร็จ', data: null });
  } catch (error) {
    console.error('Topic remove error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};
