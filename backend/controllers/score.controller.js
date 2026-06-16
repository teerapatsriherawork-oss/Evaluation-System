/**
 * Score Controller
 * จัดการคะแนนการประเมิน (Self-Assessment + Committee Scores)
 */
const db = require('../config/db');

// ============ Self Assessment ============

// GET /api/self-assessments/:evaluateeId — ดึงข้อมูล self-assessment ของผู้ประเมิน
exports.getSelfAssessments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sa.*, i.name as indicator_name, i.description as indicator_desc,
        i.weight, i.score_type, i.evidence_type,
        t.title as topic_title, t.id as topic_id
       FROM self_assessments sa
       JOIN indicators i ON sa.indicator_id = i.id
       JOIN evaluation_topics t ON i.topic_id = t.id
       WHERE sa.evaluatee_id = ?
       ORDER BY t.sort_order ASC, i.sort_order ASC`,
      [req.params.evaluateeId]
    );
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('SelfAssessment get error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// POST /api/self-assessments — สร้าง/อัพเดท self-assessment (upsert)
exports.upsertSelfAssessment = async (req, res) => {
  try {
    const { indicator_id, self_score, self_data, evidence_file, evidence_url, status } = req.body;
    const evaluatee_id = req.user.id;

    const [result] = await db.query(
      `INSERT INTO self_assessments (evaluatee_id, indicator_id, self_score, self_data, evidence_file, evidence_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE self_score=VALUES(self_score), self_data=VALUES(self_data),
       evidence_file=VALUES(evidence_file), evidence_url=VALUES(evidence_url), status=VALUES(status)`,
      [evaluatee_id, indicator_id, self_score, self_data, evidence_file, evidence_url, status || 'draft']
    );
    res.json({
      status: 'success',
      message: 'บันทึกสำเร็จ',
      data: { id: result.insertId || result.affectedRows }
    });
  } catch (error) {
    console.error('SelfAssessment upsert error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/self-assessments/progress/:evaluateeId — ดูความคืบหน้า
exports.getProgress = async (req, res) => {
  try {
    const [totalIndicators] = await db.query(
      `SELECT COUNT(*) as total FROM indicators i
       JOIN evaluation_topics t ON i.topic_id = t.id
       JOIN evaluation_periods ep ON t.period_id = ep.id
       WHERE ep.is_active = 1`
    );
    const [completed] = await db.query(
      `SELECT COUNT(*) as done FROM self_assessments
       WHERE evaluatee_id = ? AND status = 'submitted'`,
      [req.params.evaluateeId]
    );
    const [drafted] = await db.query(
      `SELECT COUNT(*) as draft FROM self_assessments
       WHERE evaluatee_id = ? AND status = 'draft'`,
      [req.params.evaluateeId]
    );

    const total = totalIndicators[0]?.total || 0;
    const done = completed[0]?.done || 0;
    const draft = drafted[0]?.draft || 0;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    res.json({
      status: 'success',
      message: 'ดึงข้อมูลสำเร็จ',
      data: { total, completed: done, draft, remaining: total - done - draft, progress }
    });
  } catch (error) {
    console.error('SelfAssessment progress error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// ============ Committee Scores ============

// GET /api/scores/assignment/:assignmentId — ดึงคะแนนของ assignment
exports.getByAssignment = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id as indicator_id, cs.score, cs.comment,
        i.name as indicator_name, i.description as indicator_desc,
        i.weight, i.score_type, i.evidence_type,
        t.title as topic_title,
        sa.self_score, sa.self_data, sa.evidence_file, sa.evidence_url
       FROM committee_assignments ca
       JOIN evaluation_periods ep ON ca.period_id = ep.id
       JOIN evaluation_topics t ON t.period_id = ep.id
       JOIN indicators i ON i.topic_id = t.id
       LEFT JOIN committee_scores cs ON cs.assignment_id = ca.id AND cs.indicator_id = i.id
       LEFT JOIN self_assessments sa ON sa.evaluatee_id = ca.evaluatee_id AND sa.indicator_id = i.id
       WHERE ca.id = ?
       ORDER BY t.sort_order ASC, i.sort_order ASC`,
      [req.params.assignmentId]
    );
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Score getByAssignment error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// POST /api/scores — บันทึกคะแนน (upsert)
exports.upsertScore = async (req, res) => {
  try {
    const { assignment_id, indicator_id, score, comment } = req.body;
    const [result] = await db.query(
      `INSERT INTO committee_scores (assignment_id, indicator_id, score, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score=VALUES(score), comment=VALUES(comment)`,
      [assignment_id, indicator_id, score, comment]
    );

    // อัพเดทสถานะ assignment เป็น in_progress
    await db.query(
      `UPDATE committee_assignments SET status='in_progress' WHERE id=? AND status='pending'`,
      [assignment_id]
    );

    res.json({ status: 'success', message: 'บันทึกคะแนนสำเร็จ', data: { id: result.insertId } });
  } catch (error) {
    console.error('Score upsert error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// POST /api/scores/submit/:assignmentId — ยืนยันส่งผลการประเมิน + ลายเซ็น
exports.submitEvaluation = async (req, res) => {
  try {
    const { overall_comment, signature_image } = req.body;
    const assignmentId = req.params.assignmentId;

    // คำนวณคะแนนรวม
    const [scores] = await db.query(
      `SELECT cs.score, i.weight FROM committee_scores cs
       JOIN indicators i ON cs.indicator_id = i.id
       WHERE cs.assignment_id = ?`,
      [assignmentId]
    );

    let totalScore = 0;
    let totalWeight = 0;
    scores.forEach(s => {
      if (s.score !== null) {
        totalScore += s.score * s.weight;
        totalWeight += s.weight;
      }
    });
    const avgScore = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0;

    // บันทึกผลลัพธ์
    await db.query(
      `INSERT INTO evaluation_results (assignment_id, overall_comment, signature_image, total_score, is_submitted, submitted_at)
       VALUES (?, ?, ?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE overall_comment=VALUES(overall_comment), signature_image=VALUES(signature_image),
       total_score=VALUES(total_score), is_submitted=TRUE, submitted_at=NOW()`,
      [assignmentId, overall_comment, signature_image, avgScore]
    );

    // อัพเดทสถานะ assignment
    await db.query('UPDATE committee_assignments SET status=? WHERE id=?', ['completed', assignmentId]);

    res.json({
      status: 'success',
      message: 'ส่งผลการประเมินสำเร็จ',
      data: { assignment_id: assignmentId, total_score: avgScore }
    });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/scores/feedback/:evaluateeId — ดึงผลการประเมินจากกรรมการ (สำหรับผู้รับการประเมินดู)
exports.getFeedback = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT er.*, ca.committee_role,
        u.full_name as committee_name, u.position as committee_position
       FROM evaluation_results er
       JOIN committee_assignments ca ON er.assignment_id = ca.id
       JOIN users u ON ca.committee_id = u.id
       WHERE ca.evaluatee_id = ? AND er.is_submitted = TRUE
       ORDER BY ca.committee_role ASC`,
      [req.params.evaluateeId]
    );
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows });
  } catch (error) {
    console.error('Score getFeedback error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};

// GET /api/scores/result/:assignmentId — ดึงผลการประเมินที่ submit แล้ว
exports.getResult = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT overall_comment, signature_image, total_score, is_submitted, submitted_at
       FROM evaluation_results
       WHERE assignment_id = ? AND is_submitted = TRUE
       ORDER BY submitted_at DESC LIMIT 1`,
      [req.params.assignmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผลการประเมิน', data: null });
    }
    res.json({ status: 'success', message: 'ดึงข้อมูลสำเร็จ', data: rows[0] });
  } catch (error) {
    console.error('Score getResult error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', data: null });
  }
};
