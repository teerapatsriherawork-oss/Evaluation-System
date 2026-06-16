/**
 * Format & mapping utilities — รวมศูนย์ของที่เคยก๊อปซ้ำหลาย view
 * (statusColor/statusLabel เคยซ้ำ 7 ที่, roleLabel ซ้ำ 4 ที่, formatDate ซ้ำหลายที่)
 */

// ===== สถานะการประเมิน =====
export const STATUS = {
  pending: { label: 'รอดำเนินการ', color: 'grey' },
  in_progress: { label: 'กำลังประเมิน', color: 'warning' },
  completed: { label: 'เสร็จสิ้น', color: 'success' }
}
export const statusLabel = (s) => STATUS[s]?.label || s
export const statusColor = (s) => STATUS[s]?.color || 'grey'

// ===== บทบาทผู้ใช้ =====
export const ROLE = {
  hr: { label: 'ฝ่ายบุคลากร', color: 'primary', icon: 'mdi-shield-account' },
  evaluatee: { label: 'ผู้รับการประเมิน', color: 'secondary', icon: 'mdi-account' },
  committee: { label: 'กรรมการ', color: 'accent', icon: 'mdi-gavel' }
}
export const roleLabel = (r) => ROLE[r]?.label || ''
export const roleColor = (r) => ROLE[r]?.color || 'grey'
export const roleIcon = (r) => ROLE[r]?.icon || 'mdi-account'

// ===== ระดับคะแนนเฉลี่ย (0-4) =====
export const gradeOf = (score) => {
  const n = Number(score)
  if (n >= 3.5) return { label: 'ดีเยี่ยม', color: 'success' }
  if (n >= 2.5) return { label: 'ดี', color: 'info' }
  if (n >= 1.5) return { label: 'พอใช้', color: 'warning' }
  return { label: 'ปรับปรุง', color: 'error' }
}

// ===== คำอธิบายระดับคะแนน 1-4 (เกณฑ์ 5.1.4) =====
export const DEFAULT_SCORE_LEVELS = [
  'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก',
  'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง',
  'ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง',
  'ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง'
]
// แปลง score_levels (JSON string จาก DB หรือ null) → array 4 ตัว
export const parseScoreLevels = (raw) => {
  if (!raw) return DEFAULT_SCORE_LEVELS
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(arr) && arr.length === 4 ? arr : DEFAULT_SCORE_LEVELS
  } catch { return DEFAULT_SCORE_LEVELS }
}

// ===== วันที่ =====
export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('th-TH') : '-')
