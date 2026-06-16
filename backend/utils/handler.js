/**
 * wrap — ครอบ async controller เพื่อส่ง error ไปยัง global error handler โดยอัตโนมัติ
 * ทำให้ controller ทุกตัวไม่ต้องเขียน try/catch เอง (เคยซ้ำ 40+ ที่)
 *
 *   exports.getAll = wrap(async (req, res) => { ... })
 */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
