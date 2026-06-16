/**
 * Personnel Evaluation System — Backend Server
 * ระบบประเมินบุคลากรด้วยเทคโนโลยีสารสนเทศสมัยใหม่
 *
 * Tech: Node.js + Express + MySQL + JWT (httpOnly Cookie)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { fail } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ Middleware ============
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files — uploads
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ Routes ============
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/evaluations', require('./routes/evaluation.routes'));
app.use('/api/topics', require('./routes/topic.routes'));
app.use('/api/indicators', require('./routes/indicator.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/assignments', require('./routes/committee.routes'));
app.use('/api', require('./routes/score.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// ============ Health Check ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Server is running', data: { timestamp: new Date().toISOString() } });
});

// ============ Global Error Handler ============
// controller ทุกตัวห่อด้วย wrap() → error เด้งมารวมที่นี่จุดเดียว
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 400, 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)');
  if (err.message?.includes('ไม่รองรับประเภทไฟล์')) return fail(res, 400, err.message);
  fail(res, err.status || 500, err.status ? err.message : 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์');
});

// ============ 404 Handler ============
app.use((req, res) => fail(res, 404, `ไม่พบ Route: ${req.method} ${req.originalUrl}`));

// ============ Start Server ============
app.listen(PORT, () => {
  console.log(`🚀 Personnel Evaluation API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
