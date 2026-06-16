/**
 * Upload Controller
 * จัดการอัปโหลดไฟล์ (multer)
 */
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// POST /api/upload — อัปโหลดไฟล์
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาเลือกไฟล์', data: null });
    }

    const { originalname, filename, mimetype, size } = req.file;

    // บันทึกข้อมูลไฟล์ลง DB
    const [result] = await db.query(
      `INSERT INTO uploaded_files (user_id, original_name, file_path, file_type, file_size)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, originalname, filename, mimetype, size]
    );

    res.status(201).json({
      status: 'success',
      message: 'อัปโหลดไฟล์สำเร็จ',
      data: {
        id: result.insertId,
        original_name: originalname,
        file_path: `/api/uploads/${filename}`,
        file_type: mimetype,
        file_size: size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปโหลด', data: null });
  }
};

// POST /api/upload/multiple — อัปโหลดหลายไฟล์
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'กรุณาเลือกไฟล์', data: null });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const [result] = await db.query(
        `INSERT INTO uploaded_files (user_id, original_name, file_path, file_type, file_size)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, file.originalname, file.filename, file.mimetype, file.size]
      );
      uploadedFiles.push({
        id: result.insertId,
        original_name: file.originalname,
        file_path: `/api/uploads/${file.filename}`,
        file_type: file.mimetype,
        file_size: file.size
      });
    }

    res.status(201).json({
      status: 'success',
      message: `อัปโหลด ${uploadedFiles.length} ไฟล์สำเร็จ`,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/upload/list — รายการไฟล์ที่อัปโหลด
exports.getFiles = async (req, res) => {
  try {
    let query = 'SELECT * FROM uploaded_files';
    const params = [];
    if (req.query.user_id) {
      query += ' WHERE user_id = ?';
      params.push(req.query.user_id);
    }
    query += ' ORDER BY uploaded_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('GetFiles error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// DELETE /api/upload/:id — ลบไฟล์
exports.deleteFile = async (req, res) => {
  try {
    const [files] = await db.query('SELECT * FROM uploaded_files WHERE id = ?', [req.params.id]);
    if (files.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบไฟล์', data: null });
    }

    // ลบไฟล์จริง (file_path เก็บเป็น filename เช่น 1234567890-123.pdf)
    const filePath = path.join(__dirname, '..', 'uploads', files[0].file_path);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.warn('Could not delete physical file:', fsErr.message);
    }

    // ลบจาก DB
    await db.query('DELETE FROM uploaded_files WHERE id = ?', [req.params.id]);
    res.json({ status: 'success', message: 'ลบไฟล์สำเร็จ', data: null });
  } catch (error) {
    console.error('DeleteFile error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};
