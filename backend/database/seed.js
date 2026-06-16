/**
 * Database Seeder — สร้างข้อมูล admin และ seed data เริ่มต้น
 * รัน: node database/seed.js
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // 1. สร้าง admin (HR)
    const adminPass = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (username, password, email, full_name, role, department, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['admin', adminPass, 'admin@eval.com', 'ผู้ดูแลระบบ', 'hr', 'ฝ่ายบุคลากร', 'ผู้ดูแลระบบ']
    );
    console.log('✅ Admin user created (admin / admin123)');

    // 2. สร้างกรรมการตัวอย่าง
    const committeePass = await bcrypt.hash('test1234', 10);
    await db.query(
      `INSERT INTO users (username, password, email, full_name, role, department, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['committee1', committeePass, 'committee1@eval.com', 'อาจารย์สมชาย ใจดี', 'committee', 'สาขาวิชาคอมพิวเตอร์', 'อาจารย์']
    );
    console.log('✅ Committee user created (committee1 / test1234)');

    // 3. สร้างผู้รับการประเมินตัวอย่าง
    const evaluateePass = await bcrypt.hash('test1234', 10);
    await db.query(
      `INSERT INTO users (username, password, email, full_name, role, department, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['evaluatee1', evaluateePass, 'evaluatee1@eval.com', 'นายวิชัย รักเรียน', 'evaluatee', 'สาขาวิชาคอมพิวเตอร์', 'อาจารย์']
    );
    console.log('✅ Evaluatee user created (evaluatee1 / test1234)');

    // 4. สร้างรอบประเมินตัวอย่าง
    const [periodResult] = await db.query(
      `INSERT INTO evaluation_periods (title, description, start_date, end_date, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      ['รอบประเมิน ภาคเรียนที่ 1/2568', 'การประเมินบุคลากรภาคเรียนที่ 1 ปีการศึกษา 2568', '2025-05-01', '2025-09-30', true, 1]
    );
    const periodId = periodResult.insertId || 1;
    console.log('✅ Evaluation period created');

    // 5. สร้างหัวข้อและตัวชี้วัดตัวอย่าง
    const topics = [
      { title: 'ด้านจริยธรรมและจรรยาบรรณ', indicators: ['ความซื่อสัตย์สุจริต', 'ความรับผิดชอบต่อหน้าที่', 'การรักษาวินัย'] },
      { title: 'ด้านการสอนและการจัดการเรียนรู้', indicators: ['การเตรียมการสอน', 'เทคนิคการสอน', 'การวัดและประเมินผล'] },
      { title: 'ด้านการวิจัยและพัฒนา', indicators: ['ผลงานวิจัย', 'การเผยแพร่ผลงาน', 'การนำผลวิจัยไปใช้'] },
      { title: 'ด้านการบริการวิชาการ', indicators: ['การให้บริการวิชาการ', 'การเป็นวิทยากร'] }
    ];

    for (let i = 0; i < topics.length; i++) {
      const [topicResult] = await db.query(
        `INSERT INTO evaluation_topics (period_id, title, sort_order) VALUES (?, ?, ?)`,
        [periodId, topics[i].title, i + 1]
      );
      const topicId = topicResult.insertId;

      for (let j = 0; j < topics[i].indicators.length; j++) {
        await db.query(
          `INSERT INTO indicators (topic_id, name, weight, score_type, sort_order) VALUES (?, ?, ?, ?, ?)`,
          [topicId, topics[i].indicators[j], 1.00, 'scale', j + 1]
        );
      }
    }
    console.log('✅ Topics and indicators created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('📋 Login credentials:');
    console.log('   HR Admin:    admin / admin123');
    console.log('   Committee:   committee1 / test1234');
    console.log('   Evaluatee:   evaluatee1 / test1234');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
