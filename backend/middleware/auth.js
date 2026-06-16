/**
 * JWT Authentication Middleware
 * อ่าน JWT Token จาก httpOnly Cookie
 * แนบข้อมูล user ไปที่ req.user
 */
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // อ่าน token จาก httpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบก่อน (Unauthorized)',
        data: null
      });
    }

    // ตรวจสอบ JWT Token (Signing Verification)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่',
        data: null
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Token ไม่ถูกต้อง (Invalid Token)',
      data: null
    });
  }
};

module.exports = auth;
