-- ============================================================
-- Personnel Evaluation System — Database Schema
-- ระบบประเมินบุคลากรด้วยเทคโนโลยีสารสนเทศสมัยใหม่
-- ============================================================

CREATE DATABASE IF NOT EXISTS personnel_eval
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE personnel_eval;

-- 1. users — ผู้ใช้ทุก role
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  role ENUM('hr','evaluatee','committee') NOT NULL DEFAULT 'evaluatee',
  phone VARCHAR(20),
  department VARCHAR(255),
  position VARCHAR(255),
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. evaluation_periods — รอบการประเมิน
CREATE TABLE IF NOT EXISTS evaluation_periods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. evaluation_topics — หัวข้อการประเมิน
CREATE TABLE IF NOT EXISTS evaluation_topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. indicators — ตัวชี้วัด
CREATE TABLE IF NOT EXISTS indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  evidence_type ENUM('file','url','both') DEFAULT 'both',
  score_type ENUM('boolean','scale') NOT NULL DEFAULT 'scale',
  score_levels TEXT,  -- JSON: คำอธิบายระดับคะแนน 1-4 (เกณฑ์ 5.1.4) เช่น ["ต่ำกว่ามาก","ต่ำกว่า","ตามคาดหวัง","สูงกว่า"]
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. committee_assignments — มอบหมายกรรมการ
CREATE TABLE IF NOT EXISTS committee_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_id INT NOT NULL,
  committee_id INT NOT NULL,
  evaluatee_id INT NOT NULL,
  committee_role ENUM('chairman','member') DEFAULT 'member',
  status ENUM('pending','in_progress','completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (committee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (period_id, committee_id, evaluatee_id)
) ENGINE=InnoDB;

-- 6. self_assessments — ผู้รับการประเมินกรอกข้อมูล
CREATE TABLE IF NOT EXISTS self_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluatee_id INT NOT NULL,
  indicator_id INT NOT NULL,
  self_score INT,
  self_data TEXT,
  evidence_file VARCHAR(500),
  evidence_url VARCHAR(500),
  status ENUM('draft','submitted') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE,
  UNIQUE KEY unique_self (evaluatee_id, indicator_id)
) ENGINE=InnoDB;

-- 7. committee_scores — คะแนนจากกรรมการ
CREATE TABLE IF NOT EXISTS committee_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  indicator_id INT NOT NULL,
  score INT,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES committee_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE,
  UNIQUE KEY unique_score (assignment_id, indicator_id)
) ENGINE=InnoDB;

-- 8. evaluation_results — ผลสรุปการประเมิน
CREATE TABLE IF NOT EXISTS evaluation_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  overall_comment TEXT,
  signature_image LONGTEXT,
  total_score DECIMAL(8,2),
  is_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES committee_assignments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. uploaded_files — ไฟล์ที่อัปโหลด
CREATE TABLE IF NOT EXISTS uploaded_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. system_backups — สำรองข้อมูล
CREATE TABLE IF NOT EXISTS system_backups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  backup_name VARCHAR(255),
  backup_path VARCHAR(500),
  backup_data LONGTEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- To seed initial data, run: node database/seed.js
-- ============================================================

