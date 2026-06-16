-- Migration 001: เพิ่มคอลัมน์ score_levels ในตาราง indicators
-- คำอธิบายระดับคะแนน 1-4 (เกณฑ์ 5.1.4) เก็บเป็น JSON string
-- รันกับฐานข้อมูลเดิมที่มีข้อมูลอยู่แล้ว (DB ใหม่ใช้ schema.sql ได้เลย)
-- วิธีรัน: mysql -u root -p personnel_eval < database/migrations/001_add_score_levels.sql

ALTER TABLE indicators ADD COLUMN score_levels TEXT AFTER score_type;
