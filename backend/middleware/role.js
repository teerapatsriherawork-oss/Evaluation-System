/**
 * Role-based Authorization Middleware
 * ตรวจสอบสิทธิ์ตาม Role (hr, evaluatee, committee)
 * ใช้งานหลัง auth middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบก่อน',
        data: null
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Forbidden)',
        data: null
      });
    }

    next();
  };
};

module.exports = authorize;
