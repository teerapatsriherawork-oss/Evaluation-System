-- Migration 003: เพิ่ม UNIQUE key บน evaluation_results.assignment_id
-- เหตุผล: submitEvaluation ใช้ INSERT ... ON DUPLICATE KEY UPDATE แต่ตารางไม่มี unique key
--         → MySQL ไม่เข้า branch UPDATE → resubmit (หลัง unsubmit) สร้าง row ซ้ำ → AVG/COUNT เพี้ยน
-- รันกับ DB เดิม: mysql -u root -p personnel_eval < database/migrations/003_unique_evaluation_result.sql

-- 1) ลบ row ซ้ำที่อาจมีอยู่แล้ว (เก็บ id ล่าสุดของแต่ละ assignment)
DELETE er1 FROM evaluation_results er1
  INNER JOIN evaluation_results er2
  ON er1.assignment_id = er2.assignment_id AND er1.id < er2.id;

-- 2) เพิ่ม unique key
ALTER TABLE evaluation_results ADD UNIQUE KEY unique_result (assignment_id);
