/**
 * Upload Controller — อัปโหลด/ลบไฟล์ (multer)
 */
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, created, fail, notFound } = require('../utils/response');

// บันทึก metadata ไฟล์ลง DB แล้วคืน object สำหรับ response (ใช้ทั้ง single + multiple)
const saveFile = async (userId, file) => {
  const result = await db.run(
    'INSERT INTO uploaded_files (user_id, original_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)',
    [userId, file.originalname, file.filename, file.mimetype, file.size]
  );
  return {
    id: result.insertId,
    original_name: file.originalname,
    file_path: `/api/uploads/${file.filename}`,
    file_type: file.mimetype,
    file_size: file.size
  };
};

// POST /api/upload — อัปโหลดไฟล์เดียว
exports.uploadFile = wrap(async (req, res) => {
  if (!req.file) return fail(res, 400, 'กรุณาเลือกไฟล์');
  created(res, await saveFile(req.user.id, req.file), 'อัปโหลดไฟล์สำเร็จ');
});

// POST /api/upload/multiple — อัปโหลดหลายไฟล์
exports.uploadMultiple = wrap(async (req, res) => {
  if (!req.files || req.files.length === 0) return fail(res, 400, 'กรุณาเลือกไฟล์');
  const files = [];
  for (const f of req.files) files.push(await saveFile(req.user.id, f));
  created(res, files, `อัปโหลด ${files.length} ไฟล์สำเร็จ`);
});

// GET /api/upload/list — รายการไฟล์ (?user_id=1)
exports.getFiles = wrap(async (req, res) => {
  let sql = 'SELECT * FROM uploaded_files';
  const params = [];
  if (req.query.user_id) { sql += ' WHERE user_id = ?'; params.push(req.query.user_id); }
  sql += ' ORDER BY uploaded_at DESC';
  ok(res, await db.many(sql, params));
});

// DELETE /api/upload/:id — ลบไฟล์ (ทั้งไฟล์จริงและ record)
exports.deleteFile = wrap(async (req, res) => {
  const file = await db.one('SELECT * FROM uploaded_files WHERE id = ?', [req.params.id]);
  if (!file) return notFound(res, 'ไม่พบไฟล์');

  const filePath = path.join(__dirname, '..', 'uploads', file.file_path);
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }
  catch (e) { console.warn('Could not delete physical file:', e.message); }

  await db.run('DELETE FROM uploaded_files WHERE id = ?', [req.params.id]);
  ok(res, null, 'ลบไฟล์สำเร็จ');
});
