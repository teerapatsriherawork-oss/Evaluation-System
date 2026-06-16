/**
 * Auth Controller
 * จัดการ Login, Register, Logout, Get Profile
 * ใช้ JWT Token + httpOnly Cookie
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/register — ลงทะเบียนผู้ใช้ใหม่
exports.register = async (req, res) => {
  try {
    const { username, password, email, full_name, phone, department, position, role } = req.body;

    // ตรวจสอบ username ซ้ำ
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว',
        data: null
      });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'evaluatee';

    const [result] = await db.query(
      `INSERT INTO users (username, password, email, full_name, role, phone, department, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, email, full_name, userRole, phone, department, position]
    );

    res.status(201).json({
      status: 'success',
      message: 'ลงทะเบียนสำเร็จ',
      data: { id: result.insertId, username, full_name, role: userRole }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในระบบ',
      data: null
    });
  }
};

// POST /api/auth/login — เข้าสู่ระบบ
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ค้นหาผู้ใช้
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        data: null
      });
    }

    const user = users[0];

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        data: null
      });
    }

    // สร้าง JWT Token (Signing)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // ส่ง Token ผ่าน httpOnly Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000
    });

    res.json({
      status: 'success',
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        department: user.department,
        position: user.position
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในระบบ',
      data: null
    });
  }
};

// POST /api/auth/logout — ออกจากระบบ
exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({
    status: 'success',
    message: 'ออกจากระบบสำเร็จ',
    data: null
  });
};

// GET /api/auth/me — ดึงข้อมูลผู้ใช้ปัจจุบัน
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, role, phone, department, position, profile_image, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลผู้ใช้',
        data: null
      });
    }

    res.json({
      status: 'success',
      message: 'ดึงข้อมูลสำเร็จ',
      data: users[0]
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในระบบ',
      data: null
    });
  }
};
