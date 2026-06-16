/**
 * Database Setup Script — สร้าง Database และ Tables ผ่าน Node.js
 * รัน: node database/setup.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setup() {
  // 1. เชื่อมต่อ MySQL โดยยังไม่เลือก database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL');

  try {
    // 2. อ่าน schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // 3. รัน SQL statements
    console.log('📦 Creating database and tables...');
    await connection.query(schema);
    console.log('✅ Database "personnel_eval" created with all 10 tables!');

    // 4. แสดงรายการ tables
    await connection.query('USE personnel_eval');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📋 Tables created (${tables.length}):`);
    tables.forEach(t => {
      const name = Object.values(t)[0];
      console.log(`   ✓ ${name}`);
    });

  } catch (error) {
    console.error('❌ Setup error:', error.message);
  } finally {
    await connection.end();
  }
}

setup();
