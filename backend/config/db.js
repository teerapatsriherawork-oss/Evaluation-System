const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personnel_eval',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

// ===== Query helpers (ใช้ทั่วทั้ง backend แทนการ destructure [rows] ทุกครั้ง) =====
// one    → คืนแถวแรก หรือ null            ใช้กับ SELECT ... WHERE id=?
// many   → คืน array ของแถว               ใช้กับ SELECT รายการ
// run    → คืน result (insertId, affectedRows)  ใช้กับ INSERT/UPDATE/DELETE
// update → partial update เฉพาะ key ที่ไม่ undefined; result.noFields=true ถ้าไม่มีฟิลด์
pool.one = async (sql, params) => (await pool.query(sql, params))[0][0] || null;
pool.many = async (sql, params) => (await pool.query(sql, params))[0];
pool.run = async (sql, params) => (await pool.query(sql, params))[0];
pool.update = async (table, data, where, whereParams = []) => {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (keys.length === 0) return { affectedRows: 0, noFields: true };
  const clause = keys.map((k) => `${k}=?`).join(', ');
  const params = [...keys.map((k) => data[k]), ...whereParams];
  return (await pool.query(`UPDATE ${table} SET ${clause} WHERE ${where}`, params))[0];
};

module.exports = pool;
