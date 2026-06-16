/**
 * Response helpers — รูปแบบ response มาตรฐาน { status, message, data }
 * ใช้แทน res.json(...) ที่เคยซ้ำกว่า 100 ที่ทั่วทั้ง backend
 *
 *   ok(res, data)            → 200 success
 *   created(res, data)       → 201 created
 *   fail(res, code, message) → error ตาม status code
 *   notFound(res, message)   → 404
 */
const ok = (res, data = null, message = 'สำเร็จ') =>
  res.json({ status: 'success', message, data });

const created = (res, data = null, message = 'สร้างสำเร็จ') =>
  res.status(201).json({ status: 'success', message, data });

const fail = (res, code = 500, message = 'เกิดข้อผิดพลาด') =>
  res.status(code).json({ status: 'error', message, data: null });

const notFound = (res, message = 'ไม่พบข้อมูล') => fail(res, 404, message);

module.exports = { ok, created, fail, notFound };
