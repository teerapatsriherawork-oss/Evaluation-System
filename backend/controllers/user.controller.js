/**
 * User Controller
 * จัดการข้อมูลผู้ใช้ (สำหรับ HR)
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/users — ดึงรายชื่อผู้ใช้ (รองรับ ?role=evaluatee&search=keyword)
exports.getAll = async (req, res) => {
  try {
    let query = 'SELECT id, username, email, full_name, role, phone, department, position, profile_image, created_at FROM users WHERE 1=1';
    const params = [];

    if (req.query.role) {
      query += ' AND role = ?';
      params.push(req.query.role);
    }
    if (req.query.search) {
      query += ' AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)';
      const keyword = `%${req.query.search}%`;
      params.push(keyword, keyword, keyword);
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('User getAll error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/users/:id — ดึงข้อมูลผู้ใช้ตาม ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, full_name, role, phone, department, position, profile_image, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้', data: null });
    }
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows[0] });
  } catch (error) {
    console.error('User getById error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PUT /api/users/:id — แก้ไขข้อมูลผู้ใช้
exports.update = async (req, res) => {
  try {
    const { email, full_name, phone, department, position, role } = req.body;
    const fields = [];
    const params = [];

    if (email !== undefined) { fields.push('email=?'); params.push(email); }
    if (full_name !== undefined) { fields.push('full_name=?'); params.push(full_name); }
    if (phone !== undefined) { fields.push('phone=?'); params.push(phone); }
    if (department !== undefined) { fields.push('department=?'); params.push(department); }
    if (position !== undefined) { fields.push('position=?'); params.push(position); }
    if (role !== undefined) { fields.push('role=?'); params.push(role); }

    if (fields.length === 0) {
      return res.status(400).json({ status: 'error', message: 'ไม่มีข้อมูลที่ต้องแก้ไข', data: null });
    }

    params.push(req.params.id);
    const [result] = await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้', data: null });
    }
    res.json({ status: 'success', message: 'แก้ไขสำเร็จ', data: { id: req.params.id } });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PUT /api/users/:id/password — เปลี่ยนรหัสผ่าน
exports.changePassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashedPassword, req.params.id]);
    res.json({ status: 'success', message: 'เปลี่ยนรหัสผ่านสำเร็จ', data: null });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// DELETE /api/users/:id — ลบผู้ใช้
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้', data: null });
    }
    res.json({ status: 'success', message: 'ลบสำเร็จ', data: null });
  } catch (error) {
    console.error('User remove error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// PUT /api/users/profile — แก้ไขข้อมูลตนเอง (สำหรับทุก role)
exports.updateProfile = async (req, res) => {
  try {
    const { email, full_name, phone, department, position } = req.body;
    await db.query(
      'UPDATE users SET email=?, full_name=?, phone=?, department=?, position=? WHERE id=?',
      [email, full_name, phone, department, position, req.user.id]
    );
    res.json({ status: 'success', message: 'แก้ไขข้อมูลส่วนตัวสำเร็จ', data: null });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};
