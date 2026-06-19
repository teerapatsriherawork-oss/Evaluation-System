/**
 * Score Controller — Self-Assessment + Committee Scores + Submit ผลการประเมิน
 */
const db = require('../config/db');
const wrap = require('../utils/handler');
const { ok, notFound } = require('../utils/response');
const { calcWeightedAverage } = require('../utils/score');

// ===== Self Assessment =====

// GET /api/self-assessments/:evaluateeId
exports.getSelfAssessments = wrap(async (req, res) => {
  ok(res, await db.many(
    `SELECT sa.*, i.name as indicator_name, i.description as indicator_desc,
      i.weight, i.score_type, i.evidence_type, t.title as topic_title, t.id as topic_id
     FROM self_assessments sa
     JOIN indicators i ON sa.indicator_id = i.id
     JOIN evaluation_topics t ON i.topic_id = t.id
     WHERE sa.evaluatee_id = ?
     ORDER BY t.sort_order ASC, i.sort_order ASC`,
    [req.params.evaluateeId]
  ));
});

// POST /api/self-assessments — สร้าง/อัปเดต (upsert)
exports.upsertSelfAssessment = wrap(async (req, res) => {
  const { indicator_id, self_score, self_data, evidence_file, evidence_url, status } = req.body;
  const result = await db.run(
    `INSERT INTO self_assessments (evaluatee_id, indicator_id, self_score, self_data, evidence_file, evidence_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE self_score=VALUES(self_score), self_data=VALUES(self_data),
     evidence_file=VALUES(evidence_file), evidence_url=VALUES(evidence_url), status=VALUES(status)`,
    [req.user.id, indicator_id, self_score, self_data, evidence_file, evidence_url, status || 'draft']
  );
  ok(res, { id: result.insertId || result.affectedRows }, 'บันทึกสำเร็จ');
});

// GET /api/self-assessments/progress/:evaluateeId — ความคืบหน้า
exports.getProgress = wrap(async (req, res) => {
  const totalRow = await db.one(
    `SELECT COUNT(*) as total FROM indicators i
     JOIN evaluation_topics t ON i.topic_id = t.id
     JOIN evaluation_periods ep ON t.period_id = ep.id
     WHERE ep.is_active = 1`
  );
  const doneRow = await db.one(
    `SELECT COUNT(*) as done FROM self_assessments WHERE evaluatee_id = ? AND status = 'submitted'`,
    [req.params.evaluateeId]
  );
  const draftRow = await db.one(
    `SELECT COUNT(*) as draft FROM self_assessments WHERE evaluatee_id = ? AND status = 'draft'`,
    [req.params.evaluateeId]
  );
  const total = totalRow?.total || 0;
  const done = doneRow?.done || 0;
  const draft = draftRow?.draft || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  ok(res, { total, completed: done, draft, remaining: total - done - draft, progress });
});

// ===== Committee Scores =====

// GET /api/scores/assignment/:assignmentId — คะแนน + self-assessment ของ assignment
exports.getByAssignment = wrap(async (req, res) => {
  ok(res, await db.many(
    `SELECT i.id as indicator_id, cs.score, cs.comment,
      i.name as indicator_name, i.description as indicator_desc, i.weight, i.score_type, i.score_levels, i.evidence_type,
      t.title as topic_title, sa.self_score, sa.self_data, sa.evidence_file, sa.evidence_url
     FROM committee_assignments ca
     JOIN evaluation_periods ep ON ca.period_id = ep.id
     JOIN evaluation_topics t ON t.period_id = ep.id
     JOIN indicators i ON i.topic_id = t.id
     LEFT JOIN committee_scores cs ON cs.assignment_id = ca.id AND cs.indicator_id = i.id
     LEFT JOIN self_assessments sa ON sa.evaluatee_id = ca.evaluatee_id AND sa.indicator_id = i.id
     WHERE ca.id = ?
     ORDER BY t.sort_order ASC, i.sort_order ASC`,
    [req.params.assignmentId]
  ));
});

// POST /api/scores — บันทึกคะแนน (upsert) + ตั้งสถานะเป็น in_progress
exports.upsertScore = wrap(async (req, res) => {
  const { assignment_id, indicator_id, score, comment } = req.body;
  const result = await db.run(
    `INSERT INTO committee_scores (assignment_id, indicator_id, score, comment)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE score=VALUES(score), comment=VALUES(comment)`,
    [assignment_id, indicator_id, score, comment]
  );
  await db.run(`UPDATE committee_assignments SET status='in_progress' WHERE id=? AND status='pending'`, [assignment_id]);
  ok(res, { id: result.insertId }, 'บันทึกคะแนนสำเร็จ');
});

// POST /api/scores/submit/:assignmentId — ยืนยันส่งผล + ลายเซ็น + คำนวณคะแนนรวม
exports.submitEvaluation = wrap(async (req, res) => {
  const { overall_comment, signature_image } = req.body;
  const assignmentId = req.params.assignmentId;

  const scores = await db.many(
    `SELECT cs.score, i.weight FROM committee_scores cs
     JOIN indicators i ON cs.indicator_id = i.id WHERE cs.assignment_id = ?`,
    [assignmentId]
  );
  const total_score = calcWeightedAverage(scores);

  await db.run(
    `INSERT INTO evaluation_results (assignment_id, overall_comment, signature_image, total_score, is_submitted, submitted_at)
     VALUES (?, ?, ?, ?, TRUE, NOW())
     ON DUPLICATE KEY UPDATE overall_comment=VALUES(overall_comment), signature_image=VALUES(signature_image),
     total_score=VALUES(total_score), is_submitted=TRUE, submitted_at=NOW()`,
    [assignmentId, overall_comment, signature_image, total_score]
  );
  await db.run('UPDATE committee_assignments SET status=? WHERE id=?', ['completed', assignmentId]);
  ok(res, { assignment_id: assignmentId, total_score }, 'ส่งผลการประเมินสำเร็จ');
});

// GET /api/scores/feedback/:evaluateeId — ผลประเมินจากกรรมการ (ผู้รับการประเมินดู)
exports.getFeedback = wrap(async (req, res) => {
  ok(res, await db.many(
    `SELECT er.*, ca.committee_role, u.full_name as committee_name, u.position as committee_position
     FROM evaluation_results er
     JOIN committee_assignments ca ON er.assignment_id = ca.id
     JOIN users u ON ca.committee_id = u.id
     WHERE ca.evaluatee_id = ? AND er.is_submitted = TRUE
     ORDER BY ca.committee_role ASC`,
    [req.params.evaluateeId]
  ));
});

// GET /api/scores/result/:assignmentId — ผลที่ submit แล้ว
exports.getResult = wrap(async (req, res) => {
  const row = await db.one(
    `SELECT overall_comment, signature_image, total_score, is_submitted, submitted_at
     FROM evaluation_results WHERE assignment_id = ? AND is_submitted = TRUE
     ORDER BY submitted_at DESC LIMIT 1`,
    [req.params.assignmentId]
  );
  if (!row) return notFound(res, 'ไม่พบผลการประเมิน');
  ok(res, row);
});
