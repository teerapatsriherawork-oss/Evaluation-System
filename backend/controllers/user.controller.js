/**
 * User Controller — จัดการข้อมูลผู้ใช้ (สำหรับ HR) + แก้ไขโปรไฟล์ตนเอง
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, fail, notFound } = require('../utils/response');

const USER_COLS = 'id, username, email, full_name, role, phone, department, position, profile_image, created_at';

// GET /api/users — ดึงรายชื่อผู้ใช้ (?role=evaluatee&search=keyword)
exports.getAll = wrap(async (req, res) => {
  let sql = `SELECT ${USER_COLS} FROM users WHERE 1=1`;
  const params = [];
  if (req.query.role) { sql += ' AND role = ?'; params.push(req.query.role); }
  if (req.query.search) {
    sql += ' AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)';
    const kw = `%${req.query.search}%`;
    params.push(kw, kw, kw);
  }
  sql += ' ORDER BY created_at DESC';
  ok(res, await db.many(sql, params));
});

// GET /api/users/:id — ดึงข้อมูลผู้ใช้ตาม ID
exports.getById = wrap(async (req, res) => {
  const user = await db.one(`SELECT ${USER_COLS} FROM users WHERE id = ?`, [req.params.id]);
  if (!user) return notFound(res, 'ไม่พบผู้ใช้');
  ok(res, user);
});

// PUT /api/users/:id — แก้ไขข้อมูลผู้ใช้ (อัปเดตเฉพาะฟิลด์ที่ส่งมา)
exports.update = wrap(async (req, res) => {
  const { email, full_name, phone, department, position, role } = req.body;
  const result = await db.update('users', { email, full_name, phone, department, position, role }, 'id=?', [req.params.id]);
  if (result.noFields) return fail(res, 400, 'ไม่มีข้อมูลที่ต้องแก้ไข');
  if (!result.affectedRows) return notFound(res, 'ไม่พบผู้ใช้');
  ok(res, { id: req.params.id }, 'แก้ไขสำเร็จ');
});

// PUT /api/users/:id/password — เปลี่ยนรหัสผ่าน
exports.changePassword = wrap(async (req, res) => {
  const hashed = await bcrypt.hash(req.body.new_password, 10);
  await db.run('UPDATE users SET password=? WHERE id=?', [hashed, req.params.id]);
  ok(res, null, 'เปลี่ยนรหัสผ่านสำเร็จ');
});

// DELETE /api/users/:id — ลบผู้ใช้
exports.remove = wrap(async (req, res) => {
  const result = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return notFound(res, 'ไม่พบผู้ใช้');
  ok(res, null, 'ลบสำเร็จ');
});

// PUT /api/users/profile — แก้ไขข้อมูลตนเอง (ทุก role)
exports.updateProfile = wrap(async (req, res) => {
  const { email, full_name, phone, department, position } = req.body;
  await db.run(
    'UPDATE users SET email=?, full_name=?, phone=?, department=?, position=? WHERE id=?',
    [email, full_name, phone, department, position, req.user.id]
  );
  ok(res, null, 'แก้ไขข้อมูลส่วนตัวสำเร็จ');
});
