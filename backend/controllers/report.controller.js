/**
 * Report Controller — รายงาน, สถิติ, ติดตามสถานะ, PDF Export, Backup/Restore
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, notFound } = require('../utils/response');

// ตารางที่ backup/restore (เรียงตาม foreign key: parent → child)
const BACKUP_TABLES = ['users', 'evaluation_periods', 'evaluation_topics', 'indicators',
  'committee_assignments', 'self_assessments', 'committee_scores', 'evaluation_results'];

// ค่าเฉลี่ย total_score จากผลของกรรมการหลายคน
const averageOf = (results) => results.length
  ? (results.reduce((s, r) => s + parseFloat(r.total_score || 0), 0) / results.length).toFixed(2)
  : 0;

// GET /api/reports/individual/:evaluateeId — รายงานรายบุคคล
exports.getIndividualReport = wrap(async (req, res) => {
  const id = req.params.evaluateeId;
  const user = await db.one('SELECT id, full_name, department, position, email FROM users WHERE id = ?', [id]);
  if (!user) return notFound(res, 'ไม่พบผู้รับการประเมิน');

  const self_scores = await db.many(
    `SELECT sa.*, i.name as indicator_name, i.weight, i.score_type, t.title as topic_title
     FROM self_assessments sa
     JOIN indicators i ON sa.indicator_id = i.id
     JOIN evaluation_topics t ON i.topic_id = t.id
     WHERE sa.evaluatee_id = ? ORDER BY t.sort_order, i.sort_order`, [id]);

  const committee_scores = await db.many(
    `SELECT cs.*, i.name as indicator_name, i.weight, i.score_type, t.title as topic_title,
      u.full_name as committee_name, ca.committee_role
     FROM committee_scores cs
     JOIN indicators i ON cs.indicator_id = i.id
     JOIN evaluation_topics t ON i.topic_id = t.id
     JOIN committee_assignments ca ON cs.assignment_id = ca.id
     JOIN users u ON ca.committee_id = u.id
     WHERE ca.evaluatee_id = ? ORDER BY t.sort_order, i.sort_order`, [id]);

  const results = await db.many(
    `SELECT er.*, u.full_name as committee_name, ca.committee_role
     FROM evaluation_results er
     JOIN committee_assignments ca ON er.assignment_id = ca.id
     JOIN users u ON ca.committee_id = u.id
     WHERE ca.evaluatee_id = ? AND er.is_submitted = TRUE`, [id]);

  ok(res, {
    user, self_scores, committee_scores, results,
    summary: { average_score: averageOf(results), total_committees: results.length }
  });
});

// GET /api/reports/summary/:periodId — สรุปภาพรวมรอบประเมิน
exports.getPeriodSummary = wrap(async (req, res) => {
  const id = req.params.periodId;
  const period = await db.one('SELECT * FROM evaluation_periods WHERE id = ?', [id]);
  if (!period) return notFound(res, 'ไม่พบรอบประเมิน');

  const evaluatees = await db.many('SELECT DISTINCT evaluatee_id FROM committee_assignments WHERE period_id = ?', [id]);
  const status_breakdown = await db.many(
    'SELECT status, COUNT(*) as count FROM committee_assignments WHERE period_id = ? GROUP BY status', [id]);
  const score_summary = await db.one(
    `SELECT AVG(er.total_score) as avg_score, MIN(er.total_score) as min_score, MAX(er.total_score) as max_score
     FROM evaluation_results er
     JOIN committee_assignments ca ON er.assignment_id = ca.id
     WHERE ca.period_id = ? AND er.is_submitted = TRUE`, [id]);

  ok(res, { period, total_evaluatees: evaluatees.length, status_breakdown, score_summary });
});

// GET /api/reports/statistics/:periodId — สถิติ (คะแนนรายคน + รายหัวข้อ)
exports.getStatistics = wrap(async (req, res) => {
  const id = req.params.periodId;
  const evaluatee_scores = await db.many(
    `SELECT u.full_name, u.department, AVG(er.total_score) as avg_score
     FROM evaluation_results er
     JOIN committee_assignments ca ON er.assignment_id = ca.id
     JOIN users u ON ca.evaluatee_id = u.id
     WHERE ca.period_id = ? AND er.is_submitted = TRUE
     GROUP BY ca.evaluatee_id ORDER BY avg_score DESC`, [id]);

  const topic_scores = await db.many(
    `SELECT t.title as topic_title, AVG(cs.score) as avg_score
     FROM committee_scores cs
     JOIN indicators i ON cs.indicator_id = i.id
     JOIN evaluation_topics t ON i.topic_id = t.id
     WHERE t.period_id = ? GROUP BY t.id ORDER BY t.sort_order`, [id]);

  ok(res, { evaluatee_scores, topic_scores });
});

// GET /api/reports/tracking/:periodId — ติดตามสถานะการประเมิน
exports.getTracking = wrap(async (req, res) => {
  const id = req.params.periodId;
  const committee_tracking = await db.many(
    `SELECT u.full_name as committee_name, ca.committee_role, ca.status,
      COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed, COUNT(*) as total
     FROM committee_assignments ca
     JOIN users u ON ca.committee_id = u.id
     WHERE ca.period_id = ? GROUP BY ca.committee_id, ca.committee_role`, [id]);

  const evaluatee_tracking = await db.many(
    `SELECT u.full_name as evaluatee_name, COUNT(sa.id) as self_filled,
      (SELECT COUNT(*) FROM indicators i JOIN evaluation_topics t ON i.topic_id = t.id WHERE t.period_id = ?) as total_indicators,
      COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as self_submitted
     FROM users u
     LEFT JOIN self_assessments sa ON sa.evaluatee_id = u.id
     WHERE u.role = 'evaluatee' GROUP BY u.id`, [id]);

  ok(res, { committee_tracking, evaluatee_tracking });
});

// ===== PDF Export =====

// หาฟอนต์ไทย (เครื่องแข่ง Windows มี Leelawadee/Tahoma; วาง Sarabun ใน assets/fonts เองก็ได้)
const THAI_FONTS = [
  path.join(__dirname, '..', 'assets', 'fonts', 'Sarabun-Regular.ttf'),
  'C:/Windows/Fonts/leelawui.ttf',
  'C:/Windows/Fonts/tahoma.ttf',
  '/Library/Fonts/Tahoma.ttf',
  '/System/Library/Fonts/Supplemental/Tahoma.ttf'
];
const findThaiFont = () => THAI_FONTS.find((p) => { try { return fs.existsSync(p); } catch { return false; } });

// GET /api/reports/pdf/:evaluateeId — ออกรายงานรายบุคคลเป็นไฟล์ PDF
exports.exportPdf = wrap(async (req, res) => {
  const id = req.params.evaluateeId;
  const user = await db.one('SELECT id, full_name, department, position FROM users WHERE id = ?', [id]);
  if (!user) return notFound(res, 'ไม่พบผู้รับการประเมิน');

  const results = await db.many(
    `SELECT er.total_score, er.overall_comment, u.full_name as committee_name, ca.committee_role
     FROM evaluation_results er
     JOIN committee_assignments ca ON er.assignment_id = ca.id
     JOIN users u ON ca.committee_id = u.id
     WHERE ca.evaluatee_id = ? AND er.is_submitted = TRUE`, [id]);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const font = findThaiFont();
  if (font) doc.font(font);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report_${user.id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text('รายงานผลการประเมินบุคลากร', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12)
    .text(`ชื่อ-สกุล: ${user.full_name}`)
    .text(`ตำแหน่ง: ${user.position || '-'}`)
    .text(`หน่วยงาน: ${user.department || '-'}`);
  doc.moveDown();
  doc.fontSize(14).text(`คะแนนเฉลี่ยรวม: ${averageOf(results)} / 4.00`);
  doc.moveDown();
  doc.fontSize(12).text('ผลการประเมินรายกรรมการ:');
  results.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.committee_name} (${r.committee_role === 'chairman' ? 'ประธาน' : 'กรรมการ'}) — ${r.total_score} คะแนน`);
    if (r.overall_comment) doc.text(`    ความเห็น: ${r.overall_comment}`);
  });
  if (!results.length) doc.text('— ยังไม่มีผลการประเมิน —');

  doc.end();
});

// ===== Backup / Restore =====

// POST /api/backup — สำรองข้อมูล (ดึงทุกตารางเป็น JSON เก็บใน system_backups)
exports.createBackup = wrap(async (req, res) => {
  const backupData = {};
  for (const table of BACKUP_TABLES) backupData[table] = await db.many(`SELECT * FROM ${table}`);

  const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await db.run('INSERT INTO system_backups (backup_name, backup_data, created_by) VALUES (?, ?, ?)',
    [backupName, JSON.stringify(backupData), req.user.id]);
  ok(res, { backup_name: backupName, tables: BACKUP_TABLES.length }, 'สำรองข้อมูลสำเร็จ');
});

// POST /api/restore — กู้คืนข้อมูลจริงจาก backup (transaction + ปิด FK ชั่วคราว, rollback ถ้าพลาด)
exports.restoreBackup = wrap(async (req, res) => {
  const backup = await db.one('SELECT * FROM system_backups WHERE id = ?', [req.body.backup_id]);
  if (!backup) return notFound(res, 'ไม่พบข้อมูลสำรอง');

  const data = typeof backup.backup_data === 'string' ? JSON.parse(backup.backup_data) : backup.backup_data;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of [...BACKUP_TABLES].reverse()) await conn.query(`DELETE FROM ${table}`);
    for (const table of BACKUP_TABLES) {
      for (const row of data[table] || []) {
        const cols = Object.keys(row);
        if (!cols.length) continue;
        await conn.query(
          `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          cols.map((c) => row[c])
        );
      }
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
    const record_counts = Object.fromEntries(BACKUP_TABLES.map((t) => [t, (data[t] || []).length]));
    ok(res, { tables: BACKUP_TABLES, record_counts }, 'กู้คืนข้อมูลสำเร็จ');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

// GET /api/backup/list — รายการ backups
exports.getBackups = wrap(async (req, res) => {
  ok(res, await db.many('SELECT id, backup_name, created_by, created_at FROM system_backups ORDER BY created_at DESC'));
});

// GET /api/reports/csv/:periodId — ส่งออกผลการประเมินเป็น CSV (เปิดใน Excel ได้)
exports.exportCsv = wrap(async (req, res) => {
  const rows = await db.many(
    `SELECT u.full_name, u.department, AVG(er.total_score) AS avg_score, COUNT(er.id) AS committees
     FROM evaluation_results er
     JOIN committee_assignments ca ON er.assignment_id = ca.id
     JOIN users u ON ca.evaluatee_id = u.id
     WHERE ca.period_id = ? AND er.is_submitted = TRUE
     GROUP BY ca.evaluatee_id ORDER BY avg_score DESC`,
    [req.params.periodId]
  );
  const header = 'ชื่อ-สกุล,แผนก,คะแนนเฉลี่ย,จำนวนกรรมการ\n';
  const body = rows.map(r => `${r.full_name},${r.department || ''},${Number(r.avg_score).toFixed(2)},${r.committees}`).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="evaluation-report.csv"');
  res.send('﻿' + header + body);  // ﻿ = BOM ให้ Excel อ่านภาษาไทยถูกต้อง
});
