# 📘 BLUEPRINT ฉบับเต็ม — ระบบประเมินบุคลากร (เก็บคะแนนเต็ม 100)

> **คู่กับ** [CHEATSHEET.md](CHEATSHEET.md) — อันนั้นเน้น *pattern จำง่าย/ลด code*, อันนี้เน้น ***function ครบสมบูรณ์ที่สุด เก็บทุกคะแนน***
> ใช้เป็น **checklist + reference** ระหว่างแข่ง: ไล่ทีละข้อ อย่าให้ตกหล่น แล้วต่อยอด feature เสริมถ้าเหลือเวลา

---

## 🎯 ส่วน A — แผนผังเกณฑ์ → Function (ไล่ให้ครบทุกช่อง)

### 5.1 ฝ่ายบุคลากร HR (14 คะแนน) — 13 ฟังก์ชัน
| # | ฟังก์ชัน | endpoint หลัก | หน้าจอ |
|---|----------|---------------|--------|
| 1 | เพิ่มหัวข้อการประเมิน | `POST /evaluations/:id/topics` | IndicatorManage |
| 2 | กำหนดช่วงเวลา เปิด-ปิดระบบ | `POST/PUT /evaluations` + `PATCH /:id/toggle` | EvaluationManage |
| 3 | เพิ่มตัวชี้วัด (ชื่อ/รายละเอียด/น้ำหนัก/หลักฐาน) | `POST /topics/:id/indicators` | IndicatorManage |
| 4 | รูปแบบประเมิน: **มี/ไม่มี** + **สเกล 1-4 พร้อมคำอธิบายระดับ** | field `score_type` + `score_levels` | IndicatorManage |
| 5 | แนบหลักฐานประกอบ (PDF/รูป/URL) | `POST /upload` | IndicatorManage |
| 6 | จัดการข้อมูลผู้รับการประเมิน | `users` CRUD | CommitteeManage |
| 7 | เพิ่มรายชื่อกรรมการ | `POST /auth/register` (role=committee) | CommitteeManage |
| 8 | มอบหมายกรรมการให้ผู้รับแต่ละคน | `POST /assignments` | AssignCommittee |
| 9 | กำหนดบทบาทกรรมการ (ประธาน/ร่วม) | field `committee_role` | AssignCommittee |
| 10 | สรุปผลการประเมินรายกรรมการ | `GET /reports/individual/:id` | ReportSummary |
| 11 | ติดตามสถานะการประเมินของกรรมการ | `GET /reports/tracking/:id` | Tracking |
| 12 | ติดตามสถานะของผู้รับการประเมิน | `GET /reports/tracking/:id` | Tracking |
| 13 | แสดงรายงานผลรายบุคคล | `GET /reports/individual/:id` + PDF | ReportSummary |
| ★ | สรุปสถิติภาพรวม (ค่าเฉลี่ย) | `GET /reports/statistics/:id` | Statistics |

### 5.2 ผู้รับการประเมิน (8 คะแนน) — 8 ฟังก์ชัน
| # | ฟังก์ชัน | endpoint | หมายเหตุ |
|---|----------|----------|----------|
| 1 | ลงทะเบียน + กรอกข้อมูลเบื้องต้น | `POST /auth/register` | Register |
| 2 | เพิ่มข้อมูลในแต่ละตัวชี้วัด | `POST /self-assessments` (`self_data`) | SelfAssessment |
| 3 | เพิ่มหลักฐาน | `POST /upload` → `evidence_file` | SelfAssessment |
| 4 | กรอกคะแนนประเมินตนเอง | `POST /self-assessments` (`self_score`) | SelfAssessment |
| 5 | ดูความคืบหน้าแต่ละหัวข้อ | `GET /self-assessments/progress/:id` | Progress |
| 6 | Export เป็นไฟล์ | window.print / PDF | Progress |
| 7 | ดูความเห็นของกรรมการ | `GET /scores/feedback/:id` | ViewFeedback |
| 8 | **ขอรับการประเมินใหม่** (reopen) | ⚠️ `POST /self-assessments/reopen` *(เพิ่มใหม่ — ดูส่วน C)* | SelfAssessment |

### 5.3 กรรมการผู้ประเมิน (8 คะแนน) — 8 ฟังก์ชัน
| # | ฟังก์ชัน | endpoint | หมายเหตุ |
|---|----------|----------|----------|
| 1 | แสดงข้อมูลผู้ที่ต้องประเมิน | `GET /assignments/committee/:id` | EvaluationList |
| 2 | แสดงรายละเอียดการประเมิน | `GET /scores/assignment/:id` | ScoreForm |
| 3 | แสดงคะแนนที่ผู้รับประเมินตนเอง | join `self_assessments` ใน query | ScoreForm |
| 4 | ให้คะแนนผู้รับการประเมิน | `POST /scores` | ScoreForm |
| 5 | ให้ความเห็น | field `comment` + `overall_comment` | ScoreForm |
| 6 | แสดงผลลัพธ์การประเมิน | `GET /scores/result/:id` | ScoreForm (read-only) |
| 7 | ลงนามแนบลายเซ็น | canvas → `signature_image` | ScoreForm |
| 8 | **ยกเลิกการลงนาม** (unsubmit) | ⚠️ `POST /scores/unsubmit/:id` *(เพิ่มใหม่ — ดูส่วน C)* | ScoreForm |

### 6 / 7 / 8 — Backend / Test / โจทย์พิเศษ
- **6 Backend (10):** GET param, POST body, **upload**, **JWT signing**, exception handling, response มาตรฐาน, comment, parameter ชัดเจน, แยกไฟล์ router/async, ตรวจสิทธิ์ → *ครบใน [CHEATSHEET.md](CHEATSHEET.md)*
- **7 Test (10):** ดูส่วน H
- **8 โจทย์พิเศษ (20):** ดูส่วน D — ครบทั้ง 6 ข้อ

> ⚠️ = ฟังก์ชันที่ระบบเดิมเคยขาด → **ตอนนี้ implement เพิ่มในโค้ดจริงแล้วครบทั้งคู่** (ดูส่วน C)
> ✅ feature เสริมที่เพิ่มเข้าระบบจริงแล้ว: Audit log, Notification (กระดิ่ง), Excel export, Pagination, Dark mode, เปลี่ยนรหัสผ่านตนเอง

---

## 🗄️ ส่วน B — Database ฉบับเต็ม (10 ตารางหลัก + เสริมเก็บคะแนน)

### ตารางหลัก (สรุป field สำคัญ)
```
users(id, username⊥, password, email, full_name, role[hr|evaluatee|committee], phone, department, position, profile_image, created_at)
evaluation_periods(id, title, description, start_date, end_date, is_active, created_by→users)
evaluation_topics(id, period_id→periods, title, description, sort_order)
indicators(id, topic_id→topics, name, description, weight DECIMAL, evidence_type[file|url|both], score_type[boolean|scale], score_levels TEXT(json 1-4), sort_order)
committee_assignments(id, period_id, committee_id→users, evaluatee_id→users, committee_role[chairman|member], status[pending|in_progress|completed], UNIQUE(period,committee,evaluatee))
self_assessments(id, evaluatee_id, indicator_id, self_score, self_data, evidence_file, evidence_url, status[draft|submitted], UNIQUE(evaluatee,indicator))
committee_scores(id, assignment_id, indicator_id, score, comment, UNIQUE(assignment,indicator))
evaluation_results(id, assignment_id, overall_comment, signature_image LONGTEXT, total_score DECIMAL, is_submitted, submitted_at)
uploaded_files(id, user_id, original_name, file_path, file_type, file_size, uploaded_at)
system_backups(id, backup_name, backup_path, backup_data LONGTEXT, created_by, created_at)
```

### ★ ตารางเสริมเก็บคะแนน (โจทย์พิเศษ 8.6 / "อื่นๆ")
```sql
-- Audit log: บันทึกทุกการเปลี่ยนแปลง (ใครทำอะไรเมื่อไหร่) → โชว์ตอนนำเสนอได้ดีมาก
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, action VARCHAR(50), entity VARCHAR(50), entity_id INT,
  detail TEXT, ip VARCHAR(45), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Notification: แจ้งเตือนผู้รับ/กรรมการเมื่อถูกมอบหมาย/ได้รับผล
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, title VARCHAR(255), message TEXT,
  is_read BOOLEAN DEFAULT FALSE, link VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```
> **เทคนิคเก็บคะแนน ER-Diagram (ส่วนที่ 2, 5 คะแนน):** ตั้งชื่อตาราง/ฟิลด์ตาม convention (snake_case, `_id` สำหรับ FK), เลือก data type เหมาะสม (DECIMAL สำหรับน้ำหนัก/คะแนน ไม่ใช่ FLOAT, ENUM สำหรับสถานะ, TEXT สำหรับ json), ทุกความสัมพันธ์มี FK + ON DELETE ชัดเจน

---

## ⚙️ ส่วน C — Backend Function ครบ (เน้นที่ขาด + business logic สำคัญ)

> CRUD พื้นฐานดู [CHEATSHEET.md](CHEATSHEET.md). ส่วนนี้คือ function ที่ "ต้องมีให้ครบเกณฑ์" แต่มักตกหล่น

### C1. 🔑 Auth — Login/Register/Me/Logout (พร้อม validation เข้ม)
```js
// validators/index.js
exports.registerRules = [
  body('username').trim().notEmpty().withMessage('กรอกชื่อผู้ใช้').isLength({min:3,max:50}),
  body('password').notEmpty().isLength({min:6}).withMessage('รหัสผ่าน ≥ 6 ตัว'),
  body('full_name').trim().notEmpty().withMessage('กรอกชื่อ-สกุล'),
  body('email').optional({values:'falsy'}).isEmail().withMessage('อีเมลไม่ถูกต้อง'),
  body('role').optional().isIn(['hr','evaluatee','committee'])
]
exports.validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ status:'error', message:'ข้อมูลไม่ถูกต้อง',
      data: errors.array().map(e => ({ field:e.path, message:e.msg })) })   // ส่ง field ที่ผิดกลับไปโชว์ใต้ช่อง
  next()
}
```
*(login + register + JWT cookie → [CHEATSHEET.md](CHEATSHEET.md) §7)*

### C2. ✍️ ยกเลิกการลงนาม — เกณฑ์ 5.3.8 *(ระบบเดิมขาด — เพิ่มอันนี้)*
```js
// POST /api/scores/unsubmit/:assignmentId
exports.unsubmitEvaluation = wrap(async (req, res) => {
  const id = req.params.assignmentId
  const r = await db.run('UPDATE evaluation_results SET is_submitted=FALSE WHERE assignment_id=?', [id])
  if (!r.affectedRows) return notFound(res, 'ยังไม่มีการลงนาม')
  await db.run("UPDATE committee_assignments SET status='in_progress' WHERE id=?", [id])
  ok(res, { assignment_id:id }, 'ยกเลิกการลงนามแล้ว — แก้ไขได้อีกครั้ง')
})
// route: router.post('/scores/unsubmit/:assignmentId', auth, authorize('committee'), ctrl.unsubmitEvaluation)
```

### C3. 🔄 ขอรับการประเมินใหม่ — เกณฑ์ 5.2.8 *(ระบบเดิมขาด — เพิ่มอันนี้)*
```js
// POST /api/self-assessments/reopen — ผู้รับขอแก้ไขการประเมินตนเองใหม่ (submitted → draft)
exports.reopenSelfAssessment = wrap(async (req, res) => {
  await db.run("UPDATE self_assessments SET status='draft' WHERE evaluatee_id=? AND status='submitted'", [req.user.id])
  ok(res, null, 'เปิดให้แก้ไขการประเมินใหม่แล้ว')
})
// route: router.post('/self-assessments/reopen', auth, authorize('evaluatee'), ctrl.reopenSelfAssessment)
```

### C4. 🧮 คำนวณคะแนน + ส่งผล (หัวใจ — แยกฟังก์ชันเพื่อ test ได้)
```js
// utils/score.js
const calcWeightedAverage = (scores = []) => {           // Σ(score×weight) / Σweight
  let s = 0, w = 0
  for (const x of scores) if (x.score != null) { s += Number(x.score)*Number(x.weight); w += Number(x.weight) }
  return w > 0 ? (s/w).toFixed(2) : 0
}
const scoreToGrade = (avg) => {                           // 0-4 → ระดับ
  const n = Number(avg)
  return n>=3.5?{label:'ดีเยี่ยม',level:4}:n>=2.5?{label:'ดี',level:3}:n>=1.5?{label:'พอใช้',level:2}:{label:'ปรับปรุง',level:1}
}
module.exports = { calcWeightedAverage, scoreToGrade }
```
```js
// submit: คำนวณ → upsert evaluation_results → status=completed → แจ้งเตือนผู้รับ
exports.submitEvaluation = wrap(async (req, res) => {
  const { overall_comment, signature_image } = req.body
  const id = req.params.assignmentId
  const scores = await db.many(`SELECT cs.score, i.weight FROM committee_scores cs
    JOIN indicators i ON cs.indicator_id=i.id WHERE cs.assignment_id=?`, [id])
  const total = calcWeightedAverage(scores)
  await db.run(`INSERT INTO evaluation_results (assignment_id,overall_comment,signature_image,total_score,is_submitted,submitted_at)
    VALUES (?,?,?,?,TRUE,NOW()) ON DUPLICATE KEY UPDATE overall_comment=VALUES(overall_comment),
    signature_image=VALUES(signature_image), total_score=VALUES(total_score), is_submitted=TRUE, submitted_at=NOW()`,
    [id, overall_comment, signature_image, total])
  await db.run("UPDATE committee_assignments SET status='completed' WHERE id=?", [id])
  ok(res, { total_score: total }, 'ส่งผลการประเมินสำเร็จ')
})
```

### C5. 📊 รายงาน/สถิติ/ติดตาม (SQL aggregate — เกณฑ์ 5.1.10-13)
```sql
-- สถิติรายคน (เรียงคะแนน): GET /reports/statistics/:periodId
SELECT u.full_name, u.department, AVG(er.total_score) avg_score
FROM evaluation_results er JOIN committee_assignments ca ON er.assignment_id=ca.id
JOIN users u ON ca.evaluatee_id=u.id
WHERE ca.period_id=? AND er.is_submitted=1 GROUP BY ca.evaluatee_id ORDER BY avg_score DESC;

-- ติดตามกรรมการ: GET /reports/tracking/:periodId
SELECT u.full_name, ca.committee_role, ca.status,
  COUNT(CASE WHEN ca.status='completed' THEN 1 END) completed, COUNT(*) total
FROM committee_assignments ca JOIN users u ON ca.committee_id=u.id
WHERE ca.period_id=? GROUP BY ca.committee_id, ca.committee_role;
```

### C6. ★ Audit Log + Notification (helper เก็บคะแนน 8.6)
```js
// utils/audit.js — เรียกหลังทุก action สำคัญ (สร้าง/แก้/ลบ/ส่งผล)
const db = require('../config/db')
const logActivity = async (req, action, entity, entityId, detail='') => {
  try { await db.run('INSERT INTO activity_logs (user_id,action,entity,entity_id,detail,ip) VALUES (?,?,?,?,?,?)',
    [req.user?.id||null, action, entity, entityId, detail, req.ip]) } catch {}   // ห้ามให้ log พังงานหลัก
}
const notify = (userId, title, message, link='') =>
  db.run('INSERT INTO notifications (user_id,title,message,link) VALUES (?,?,?,?)', [userId, title, message, link])
module.exports = { logActivity, notify }

// ใช้: await logActivity(req, 'CREATE', 'evaluation', r.insertId, `สร้างรอบ "${title}"`)
//      await notify(evaluatee_id, 'ได้รับการมอบหมาย', 'มีกรรมการได้รับมอบหมายประเมินคุณ', '/evaluatee/feedback')
```

---

## 🌟 ส่วน D — โจทย์พิเศษ 20 คะแนน (ครบทั้ง 6 ข้อ)

### 8.3 📎 Upload ไฟล์ — 5 คะแนน (สูงสุด! ทำให้ครบ)
```js
// routes/upload.routes.js
const storage = multer.diskStorage({
  destination: (req,f,cb) => cb(null, path.join(__dirname,'..','uploads')),
  filename:    (req,f,cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(f.originalname)}`)
})
const SAFE = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const upload = multer({
  storage,
  fileFilter: (req,f,cb) => cb(SAFE.includes(f.mimetype) ? null : new Error('ไม่รองรับประเภทไฟล์นี้'), SAFE.includes(f.mimetype)),
  limits: { fileSize: 10*1024*1024 }                       // จำกัด 10MB
})
router.post('/',         auth, upload.single('file'),   ctrl.uploadFile)      // ไฟล์เดียว
router.post('/multiple', auth, upload.array('files',10), ctrl.uploadMultiple) // หลายไฟล์
router.get ('/list',     auth, ctrl.getFiles)
router.delete('/:id',    auth, ctrl.deleteFile)                              // ลบทั้ง record + ไฟล์จริง
// server.js: app.use('/api/uploads', express.static(path.join(__dirname,'uploads')))
```
**Checklist เก็บครบ 5:** ✓single ✓multiple ✓จำกัดชนิด ✓จำกัดขนาด ✓ลบไฟล์จริง(fs.unlinkSync) ✓บันทึก metadata ลง DB

### 8.4 💾 Backup / Restore — 2 คะแนน (Restore ต้องทำงานจริง!)
```js
const TABLES = ['users','evaluation_periods','evaluation_topics','indicators',
  'committee_assignments','self_assessments','committee_scores','evaluation_results']  // parent→child

exports.createBackup = wrap(async (req,res) => {
  const data = {}
  for (const t of TABLES) data[t] = await db.many(`SELECT * FROM ${t}`)
  const name = `backup_${new Date().toISOString().replace(/[:.]/g,'-')}`
  await db.run('INSERT INTO system_backups (backup_name,backup_data,created_by) VALUES (?,?,?)', [name, JSON.stringify(data), req.user.id])
  ok(res, { backup_name:name }, 'สำรองข้อมูลสำเร็จ')
})

exports.restoreBackup = wrap(async (req,res) => {            // ★ transaction จริง — rollback ถ้าพลาด
  const b = await db.one('SELECT * FROM system_backups WHERE id=?', [req.body.backup_id])
  if (!b) return notFound(res, 'ไม่พบข้อมูลสำรอง')
  const data = JSON.parse(b.backup_data)
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction(); await conn.query('SET FOREIGN_KEY_CHECKS=0')
    for (const t of [...TABLES].reverse()) await conn.query(`DELETE FROM ${t}`)        // ลบ child ก่อน
    for (const t of TABLES) for (const row of data[t]||[]) {                           // insert parent ก่อน
      const c = Object.keys(row)
      await conn.query(`INSERT INTO ${t} (${c.join(',')}) VALUES (${c.map(()=>'?').join(',')})`, c.map(k=>row[k]))
    }
    await conn.query('SET FOREIGN_KEY_CHECKS=1'); await conn.commit()
    ok(res, null, 'กู้คืนข้อมูลสำเร็จ')
  } catch(e){ await conn.rollback(); throw e } finally { conn.release() }
})
```

### 8.5 📄 Report — 3 คะแนน (server PDF + client print, รองรับไทย)
```js
const PDFDocument = require('pdfkit')
exports.exportPdf = wrap(async (req,res) => {
  const u = await db.one('SELECT * FROM users WHERE id=?', [req.params.evaluateeId])
  if (!u) return notFound(res, 'ไม่พบผู้รับการประเมิน')
  const results = await db.many(`SELECT er.total_score, er.overall_comment, c.full_name committee_name, ca.committee_role
    FROM evaluation_results er JOIN committee_assignments ca ON er.assignment_id=ca.id
    JOIN users c ON ca.committee_id=c.id WHERE ca.evaluatee_id=? AND er.is_submitted=1`, [u.id])
  const doc = new PDFDocument({ size:'A4', margin:50 })
  const fonts = ['C:/Windows/Fonts/leelawui.ttf','C:/Windows/Fonts/tahoma.ttf']     // ★ ฟอนต์ไทย!
  const f = fonts.find(p => require('fs').existsSync(p)); if (f) doc.font(f)
  res.setHeader('Content-Type','application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="report_${u.id}.pdf"`)
  doc.pipe(res)
  doc.fontSize(20).text('รายงานผลการประเมินบุคลากร', {align:'center'}); doc.moveDown()
  doc.fontSize(12).text(`ชื่อ-สกุล: ${u.full_name}`).text(`ตำแหน่ง: ${u.position||'-'}`).text(`หน่วยงาน: ${u.department||'-'}`)
  doc.moveDown()
  results.forEach((r,i) => doc.text(`${i+1}. ${r.committee_name} — ${r.total_score} คะแนน`))
  doc.end()
})
// ทางเลือก client (รองรับไทยชัวร์): window.open('','_blank') → เขียน HTML+CSS @media print → w.print()
```

### 8.1 📊 แสดงข้อมูล (2) · 8.2 ✅ ตรวจสอบข้อมูล (2) · 8.6 ✨ อื่นๆ (6)
| ข้อ | ทำอะไรให้ครบ |
|-----|--------------|
| **8.1 แสดง (2)** | ตาราง (v-table) + การ์ด (v-card) + **กราฟ Chart.js** (bar รายคน + doughnut รายหัวข้อ) + progress bar |
| **8.2 ตรวจสอบ (2)** | **2 ชั้น**: frontend `:rules` (required/email/min) + backend `express-validator` (`validate` middleware ส่ง field ผิดกลับ) + ตรวจซ้ำ (username unique, assignment unique ER_DUP_ENTRY) |
| **8.6 อื่นๆ (6)** | เลือกทำหลายอัน: ① **Audit log** (ส่วน C6) ② **Notification** กระดิ่งแจ้งเตือน ③ **Search + Filter + Pagination** ④ **Export Excel** ⑤ **Dashboard analytics** ⑥ **Responsive** มือถือ ⑦ **Dark mode** ⑧ ลายเซ็น canvas ⑨ เปลี่ยนรหัสผ่าน |

```js
// ★ Export Excel (8.6) — ไม่ต้องลง lib: ส่ง CSV ให้ Excel เปิดได้ (ใส่ BOM กันภาษาไทยเพี้ยน)
exports.exportCsv = wrap(async (req,res) => {
  const rows = await db.many(`SELECT u.full_name, u.department, AVG(er.total_score) avg
    FROM evaluation_results er JOIN committee_assignments ca ON er.assignment_id=ca.id
    JOIN users u ON ca.evaluatee_id=u.id WHERE ca.period_id=? AND er.is_submitted=1 GROUP BY ca.evaluatee_id`, [req.params.periodId])
  const header = 'ชื่อ,แผนก,คะแนนเฉลี่ย\n'
  const body = rows.map(r => `${r.full_name},${r.department||''},${Number(r.avg).toFixed(2)}`).join('\n')
  res.setHeader('Content-Type','text/csv; charset=utf-8')
  res.setHeader('Content-Disposition','attachment; filename="report.csv"')
  res.send('﻿' + header + body)        // ﻿ = BOM ให้ Excel อ่านไทยถูก
})
```

---

## 🎨 ส่วน E — Frontend Function เก็บคะแนน (feature ที่ทำให้ครบ + เด่น)

### E1. Search + Filter + Pagination (8.6 — ทำครบในหน้า list)
```js
const search = ref(''), page = ref(1), perPage = 10
const filtered = computed(() => items.value.filter(x =>
  !search.value || x.full_name?.toLowerCase().includes(search.value.toLowerCase())))
const paged = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))
// <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" />
// <tr v-for="x in paged">…  <v-pagination v-model="page" :length="Math.ceil(filtered.length/perPage)" />
```

### E2. กระดิ่งแจ้งเตือน Notification (8.6)
```vue
<v-menu>
  <template #activator="{ props }">
    <v-btn v-bind="props" icon>
      <v-badge :content="unread" :model-value="unread > 0" color="error"><v-icon>mdi-bell</v-icon></v-badge>
    </v-btn>
  </template>
  <v-list width="320">
    <v-list-item v-for="n in notis" :key="n.id" :title="n.title" :subtitle="n.message" @click="goRead(n)" />
    <v-list-item v-if="!notis.length" title="ไม่มีการแจ้งเตือน" />
  </v-list>
</v-menu>
<!-- โหลด GET /notifications, unread = notis.filter(n=>!n.is_read).length -->
```

### E3. Dark mode (Vuetify) + Responsive (8.6)
```js
import { useTheme } from 'vuetify'
const theme = useTheme()
const toggleDark = () => { theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark' }
// Responsive: ใช้ v-col cols="12" md="6" + useDisplay() สลับ table↔card บนมือถือ
```

### E4. หน้าจอที่ "ต้องมี" ครบ (ส่วนที่ 3 — Template 5 คะแนน)
```
Login · Register · Dashboard(3 บทบาท) ·
HR: EvaluationManage, IndicatorManage, CommitteeManage, AssignCommittee, Tracking, ReportSummary, Statistics ·
Evaluatee: Profile, SelfAssessment, Progress, ViewFeedback ·
Committee: EvaluationList, ScoreForm(+ลายเซ็น), Results
```
> Layout เด่น: Sidebar ตามบทบาท + AppBar(โปรไฟล์/แจ้งเตือน/ออกระบบ) + การ์ด glass + gradient — ดูดี = คะแนน UI

---

## ✅ ส่วน F — Validation 2 ชั้น (เกณฑ์ 8.2 + 6.5)
| | Frontend (กันพิมพ์ผิด) | Backend (กันข้อมูลเสีย — สำคัญกว่า) |
|--|----|----|
| required | `:rules="[v=>!!v||'กรอก']"` | `body('x').notEmpty()` |
| email | regex ใน rules | `body('email').isEmail()` |
| ความยาว | `v.length>=6` | `.isLength({min:6})` |
| ตัวเลข/ช่วง | `type="number"` | `.isInt({min:0,max:4})` |
| ซ้ำ | — | DB UNIQUE + จับ `ER_DUP_ENTRY` → 400 |
| ครบถ้วน | — | ตรวจ FK มีจริงก่อน insert |
> **ห้ามเชื่อ frontend อย่างเดียว** — backend ต้อง validate ซ้ำเสมอ (กรรมการชอบลองส่งข้อมูลพังผ่าน DevTools/Thunder Client)

---

## 🧪 ส่วน G — Test ครบ (เกณฑ์ส่วน 7 = 10 คะแนน)
```js
// package.json → "test": "node --test"   (Windows: ห้ามใช้ glob tests/*.js)
// 1) Unit (pure) — utils/score, response helper
// 2) Integration (HTTP) — ครอบ 7.1 login, 7.2 insert, 7.3 update, 7.6 ≥3 service
const { test } = require('node:test'), assert = require('node:assert')
const BASE='http://localhost:3000/api'
const login = async () => { const r=await fetch(`${BASE}/auth/login`,{method:'POST',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'admin123'})});
  return { r, cookie:r.headers.get('set-cookie')||'' } }

test('7.1 login ถูก', async () => { const {r}=await login(); assert.equal(r.status,200) })
test('7.1 login ผิด → 401', async () => { const r=await fetch(`${BASE}/auth/login`,{method:'POST',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'x'})}); assert.equal(r.status,401) })
test('7.2/7.3 insert+update', async () => {
  const {cookie}=await login()
  const c=await fetch(`${BASE}/evaluations`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},
    body:JSON.stringify({title:'t',start_date:'2025-01-01',end_date:'2025-12-31'})})
  const {data}=await c.json(); assert.equal(c.status,201)
  const u=await fetch(`${BASE}/evaluations/${data.id}`,{method:'PUT',headers:{'Content-Type':'application/json',Cookie:cookie},
    body:JSON.stringify({title:'t2',description:'',start_date:'2025-01-01',end_date:'2025-12-31',is_active:false})})
  assert.equal(u.status,200)
  await fetch(`${BASE}/evaluations/${data.id}`,{method:'DELETE',headers:{Cookie:cookie}})  // cleanup
})
```
**ส่วน 7 ครบ:** ✓unit ✓login ✓insert ✓update ✓validate ✓≥3 API ✓DevTools ไม่มี error (Console/Network) ✓Responsive

---

## ⏱️ ส่วน H — แผนเวลาแข่ง 6 ชม. + นำเสนอ (10 คะแนน)

### Timeline แนะนำ (วันแข่ง 09:00–15:00)
| เวลา | งาน |
|------|-----|
| 09:00–09:30 | **เอกสาร**: Flow(5) + ER(5) + Template(5) ร่างคร่าว ๆ ก่อน (15 คะแนนแน่นอน) |
| 09:30–10:30 | Setup + DB + seed + utils + auth → **login ผ่าน** |
| 10:30–12:30 | Backend ทุกโมดูล (copy pattern) + Frontend โครง + useCrud |
| 12:30–14:00 | หน้าจอ 3 บทบาทให้ครบ flow: HR สร้างรอบ→มอบหมาย, ผู้รับประเมินตนเอง, กรรมการให้คะแนน+ลงนาม |
| 14:00–14:40 | **โจทย์พิเศษ** (upload→backup→report→excel) + **test** |
| 14:40–15:00 | เก็บ bug, เช็ค DevTools ไม่มี error, Responsive, เตรียมข้อมูล demo |

### นำเสนอ (ส่วนที่ 9 = 10 คะแนน)
- **9.1 ตอบคำถาม (3):** เตรียมตอบ "ทำไมแยกไฟล์แบบนี้", "JWT ทำงานยังไง", "ถ้าลายเซ็นไม่ครบ handle ยังไง" — รู้ทุกบรรทัดที่เขียน
- **9.2 วิธีการทำงานร่วมกัน (3):** แบ่งงานชัด (เช่น คน A=backend, B=frontend, C=เอกสาร+test) เล่าให้เห็น flow
- **9.3 บุคลิกภาพ (3):** แต่งกายเรียบร้อย พูดชัด มั่นใจ มองกรรมการ
- **9.4 ใน 10 นาที (1):** ซ้อมจับเวลา เตรียม demo flow เดียวที่สมบูรณ์ (login→สร้างรอบ→ประเมิน→ดูผล→PDF)

---

## 🏁 สรุป — ลำดับความสำคัญเก็บคะแนน (ถ้าเวลาไม่พอ ทำตามนี้)
```
1. เอกสาร 4 ส่วน (20)   ← ทำก่อน เร็ว ได้แน่
2. CRUD + auth + 3 บทบาท flow (40)  ← แกนหลัก
3. Backend API คุณภาพ (10)
4. โจทย์พิเศษ: upload→report→backup ก่อน (เก็บง่าย 10/20)
5. Test (10) + นำเสนอ (10)
6. ถ้าเหลือเวลา: notification, audit, excel, dark mode, pagination → ดันโจทย์พิเศษเต็ม 20
```
> 🎖️ ตั้งเป้า **เหรียญทอง ≥80**: เอกสาร(20)+โปรแกรม(40)+API(10) = 70 ก่อน แล้วเก็บพิเศษ/test/นำเสนอเติมให้ถึง 80+

