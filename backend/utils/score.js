/**
 * Score utilities — ฟังก์ชันคำนวณคะแนน (แยกออกมาเพื่อให้เขียน Unit Test ได้)
 */

/**
 * คำนวณคะแนนถ่วงน้ำหนัก (weighted average)
 *   scores: [{ score, weight }] — ข้ามรายการที่ score เป็น null/undefined
 *   คืนค่าเป็น string ทศนิยม 2 ตำแหน่ง (เช่น "3.25") หรือ 0 ถ้าไม่มีคะแนน
 */
const calcWeightedAverage = (scores = []) => {
  let totalScore = 0;
  let totalWeight = 0;
  for (const s of scores) {
    if (s.score !== null && s.score !== undefined) {
      totalScore += Number(s.score) * Number(s.weight);
      totalWeight += Number(s.weight);
    }
  }
  return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0;
};

/**
 * แปลงคะแนนเฉลี่ย (0-4) เป็นระดับผลการประเมินตามเกณฑ์
 */
const scoreToGrade = (avg) => {
  const n = Number(avg);
  if (n >= 3.5) return { label: 'ดีเยี่ยม', level: 4 };
  if (n >= 2.5) return { label: 'ดี', level: 3 };
  if (n >= 1.5) return { label: 'พอใช้', level: 2 };
  return { label: 'ปรับปรุง', level: 1 };
};

module.exports = { calcWeightedAverage, scoreToGrade };
