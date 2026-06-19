/**
 * Auth Controller — Register, Login, Logout, Get Profile
 * ใช้ JWT Token + httpOnly Cookie
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, created, fail, notFound } = require('../utils/response');

// POST /api/auth/register — ลงทะเบียนผู้ใช้ใหม่
exports.register = wrap(async (req, res) => {
  const { username, password, email, full_name, phone, department, position, role } = req.body;

  const exists = await db.one('SELECT id FROM users WHERE username = ?', [username]);
  if (exists) return fail(res, 400, 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');

  const hashed = await bcrypt.hash(password, 10);
  const userRole = role || 'evaluatee';
  const result = await db.run(
    `INSERT INTO users (username, password, email, full_name, role, phone, department, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [username, hashed, email, full_name, userRole, phone, department, position]
  );
  created(res, { id: result.insertId, username, full_name, role: userRole }, 'ลงทะเบียนสำเร็จ');
});

// POST /api/auth/login — เข้าสู่ระบบ
exports.login = wrap(async (req, res) => {
  const { username, password } = req.body;

  const user = await db.one('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return fail(res, 401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000
  });

  ok(res, {
    id: user.id, username: user.username, full_name: user.full_name,
    role: user.role, email: user.email, department: user.department, position: user.position
  }, 'เข้าสู่ระบบสำเร็จ');
});

// POST /api/auth/logout — ออกจากระบบ
exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  ok(res, null, 'ออกจากระบบสำเร็จ');
};

// GET /api/auth/me — ดึงข้อมูลผู้ใช้ปัจจุบัน
exports.getMe = wrap(async (req, res) => {
  const user = await db.one(
    'SELECT id, username, email, full_name, role, phone, department, position, profile_image, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) return notFound(res, 'ไม่พบข้อมูลผู้ใช้');
  ok(res, user);
});
