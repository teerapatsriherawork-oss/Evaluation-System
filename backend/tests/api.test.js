/**
 * Integration Test — ทดสอบ Service API ผ่าน HTTP (เกณฑ์ 7.1 Login, 7.2 Insert, 7.3 Update, 7.6 อย่างน้อย 3 รายการ)
 * ต้องมี backend (yarn dev) + MySQL + seed ข้อมูล (node database/seed.js) ทำงานอยู่ก่อน
 * ถ้าเซิร์ฟเวอร์ไม่พร้อม จะข้าม (skip) อัตโนมัติ ไม่ทำให้ทั้งชุดล้มเหลว
 *
 * รัน: yarn test   หรือ   node --test tests/api.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.TEST_API || 'http://localhost:3000/api';

// เช็คว่า server + DB พร้อมจริง (login dummy → 401 = DB query ได้; 500/error = DB ไม่พร้อม → skip)
const ping = async () => {
  try {
    const r = await jsonPost('/auth/login', { username: '__healthcheck__', password: 'x' });
    return r.status === 401;
  } catch { return false; }
};

const jsonPost = (path, body, cookie) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body)
  });

// เข้าสู่ระบบแล้วคืน cookie (JWT อยู่ใน httpOnly cookie)
const loginAs = async (username, password) => {
  const res = await jsonPost('/auth/login', { username, password });
  return { res, cookie: res.headers.get('set-cookie') || '' };
};

test('GET /health — เซิร์ฟเวอร์ตอบสถานะ success', async (t) => {
  if (!(await ping())) return t.skip('เซิร์ฟเวอร์ไม่พร้อม — ข้ามการทดสอบ API');
  const j = await (await fetch(`${BASE}/health`)).json();
  assert.strictEqual(j.status, 'success');
});

test('POST /auth/login — เข้าสู่ระบบด้วย admin ถูกต้อง', async (t) => {
  if (!(await ping())) return t.skip('เซิร์ฟเวอร์ไม่พร้อม');
  const { res, cookie } = await loginAs('admin', 'admin123');
  const j = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(j.data.role, 'hr');
  assert.ok(cookie.includes('token='), 'ควรตั้ง cookie token');
});

test('POST /auth/login — รหัสผ่านผิด ต้องได้ 401', async (t) => {
  if (!(await ping())) return t.skip('เซิร์ฟเวอร์ไม่พร้อม');
  const { res } = await loginAs('admin', 'wrong-password');
  assert.strictEqual(res.status, 401);
});

test('Insert + Update + Delete รอบประเมิน (CRUD ครบวงจร)', async (t) => {
  if (!(await ping())) return t.skip('เซิร์ฟเวอร์ไม่พร้อม');
  const { cookie } = await loginAs('admin', 'admin123');

  // 7.2 Insert
  const createRes = await jsonPost('/evaluations', { title: 'รอบทดสอบอัตโนมัติ', start_date: '2025-01-01', end_date: '2025-12-31' }, cookie);
  const created = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  assert.ok(created.data.id, 'ต้องคืน id ของรอบที่สร้าง');
  const id = created.data.id;

  // 7.3 Update
  const updateRes = await fetch(`${BASE}/evaluations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ title: 'แก้ไขแล้ว', description: 'x', start_date: '2025-01-01', end_date: '2025-12-31', is_active: false })
  });
  assert.strictEqual(updateRes.status, 200);

  // cleanup — ลบรอบทดสอบ
  const delRes = await fetch(`${BASE}/evaluations/${id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.strictEqual(delRes.status, 200);
});

test('GET /evaluations โดยไม่ล็อกอิน ต้องได้ 401', async (t) => {
  if (!(await ping())) return t.skip('เซิร์ฟเวอร์ไม่พร้อม');
  const res = await fetch(`${BASE}/evaluations`);
  assert.strictEqual(res.status, 401);
});
