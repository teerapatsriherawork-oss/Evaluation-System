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
app.use((err, req, res, next) => {
  console.error('Global error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)',
      data: null
    });
  }

  if (err.message && err.message.includes('ไม่รองรับประเภทไฟล์')) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
      data: null
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    data: null
  });
});

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `ไม่พบ Route: ${req.method} ${req.originalUrl}`,
    data: null
  });
});

// ============ Start Server ============
app.listen(PORT, () => {
  console.log(`🚀 Personnel Evaluation API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
