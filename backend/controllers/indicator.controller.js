/**
 * Indicator Controller
 * จัดการตัวชี้วัด (KPIs) ในแต่ละหัวข้อ
 */
const db = require('../config/db');

// GET /api/topics/:topicId/indicators — ดึงตัวชี้วัดในหัวข้อ
exports.getByTopic = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM indicators WHERE topic_id = ? ORDER BY sort_order ASC',
      [req.params.topicId]
    );
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Indicator getByTopic error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/indicators/:id — ดึงตัวชี้วัดตาม ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM indicators WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบตัวชี้วัด', data: null });
    }
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows[0] });
  } catch (error) {
    console.error('Indicator getById error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// POST /api/topics/:topicId/indicators — สร้างตัวชี้วัดใหม่
exports.create = async (req, res) => {
  try {
    const { name, description, weight, evidence_type, score_type, sort_order } = req.body;
    const [result] = await db.query(
      `INSERT INTO indicators (topic_id, name, description, weight, evidence_type, score_type, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.topicId, name, description, weight || 1, evidence_type || 'both', score_type || 'scale', sort_order || 0]
    );
    res.status(201).json({
      status: 'success',
      message: 'สร้างตัวชี้วัดสำเร็จ',
      data: { id: result.insertId, name }
    });
  } catch (error) {
    console.error('Indicator create error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PUT /api/indicators/:id — แก้ไขตัวชี้วัด
exports.update = async (req, res) => {
  try {
    const { name, description, weight, evidence_type, score_type, sort_order } = req.body;
    const [result] = await db.query(
      `UPDATE indicators SET name=?, description=?, weight=?, evidence_type=?, score_type=?, sort_order=? WHERE id=?`,
      [name, description, weight, evidence_type, score_type, sort_order, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบตัวชี้วัด', data: null });
    }
    res.json({ status: 'success', message: 'แก้ไขสำเร็จ', data: { id: req.params.id } });
  } catch (error) {
    console.error('Indicator update error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// DELETE /api/indicators/:id — ลบตัวชี้วัด
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM indicators WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบตัวชี้วัด', data: null });
    }
    res.json({ status: 'success', message: 'ลบสำเร็จ', data: null });
  } catch (error) {
    console.error('Indicator remove error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/indicators/period/:periodId — ดึงตัวชี้วัดทั้งหมดในรอบประเมิน (พร้อมหัวข้อ)
exports.getByPeriod = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, t.title as topic_title, t.sort_order as topic_sort_order
       FROM indicators i
       JOIN evaluation_topics t ON i.topic_id = t.id
       WHERE t.period_id = ?
       ORDER BY t.sort_order ASC, i.sort_order ASC`,
      [req.params.periodId]
    );
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Indicator getByPeriod error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};
