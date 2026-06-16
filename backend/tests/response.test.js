/**
 * Unit Test — Response helpers (รูปแบบ response มาตรฐานของ API)
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { ok, created, fail, notFound } = require('../utils/response');

// จำลอง res object ของ Express
const mockRes = () => {
  const r = { statusCode: 200, body: null };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

test('ok — ส่ง success 200 พร้อม data', () => {
  const res = mockRes();
  ok(res, { id: 1 }, 'ดึงสำเร็จ');
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body, { status: 'success', message: 'ดึงสำเร็จ', data: { id: 1 } });
});

test('created — ส่ง 201', () => {
  const res = mockRes();
  created(res, { id: 5 });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.status, 'success');
  assert.deepStrictEqual(res.body.data, { id: 5 });
});

test('fail — ส่ง error ตาม status code', () => {
  const res = mockRes();
  fail(res, 400, 'ข้อมูลไม่ถูกต้อง');
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.body, { status: 'error', message: 'ข้อมูลไม่ถูกต้อง', data: null });
});

test('notFound — ส่ง 404', () => {
  const res = mockRes();
  notFound(res, 'ไม่พบข้อมูล');
  assert.strictEqual(res.statusCode, 404);
  assert.strictEqual(res.body.status, 'error');
  assert.strictEqual(res.body.message, 'ไม่พบข้อมูล');
});
