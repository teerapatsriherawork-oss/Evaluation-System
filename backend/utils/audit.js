/**
 * Audit log + Notification helpers (โจทย์พิเศษ 8.6)
 * ออกแบบให้ "ห้าม throw" — ถ้า log/notify ล้มเหลว ต้องไม่ทำให้งานหลักพัง
 */
const db = require('./../config/db');

// บันทึกประวัติการใช้งาน — เรียกหลัง action สำคัญ (สร้าง/แก้/ลบ/ส่งผล/ล็อกอิน)
const logActivity = async (req, action, entity, entityId = null, detail = '') => {
  try {
    const ip = req.ip || req.headers?.['x-forwarded-for'] || null;
    await db.run(
      'INSERT INTO activity_logs (user_id, action, entity, entity_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user?.id || null, action, entity, entityId, detail, ip]
    );
  } catch (e) { console.warn('audit log failed:', e.message); }
};

// สร้างการแจ้งเตือนให้ผู้ใช้คนหนึ่ง
const notify = async (userId, title, message, link = '') => {
  try {
    await db.run('INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)',
      [userId, title, message, link]);
  } catch (e) { console.warn('notify failed:', e.message); }
};

module.exports = { logActivity, notify };
