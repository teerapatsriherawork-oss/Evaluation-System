/**
 * Unit Test — ฟังก์ชันคำนวณคะแนน (เกณฑ์ 7.5 ทดสอบฟังก์ชันเฉพาะจุด)
 * รัน: yarn test   (ใช้ node:test ในตัว ไม่ต้องลง dependency)
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { calcWeightedAverage, scoreToGrade } = require('../utils/score');

test('calcWeightedAverage — ถ่วงน้ำหนักต่างกัน', () => {
  // (4*2 + 2*1) / (2+1) = 10/3 = 3.33
  assert.strictEqual(calcWeightedAverage([{ score: 4, weight: 2 }, { score: 2, weight: 1 }]), '3.33');
});

test('calcWeightedAverage — น้ำหนักเท่ากัน', () => {
  assert.strictEqual(calcWeightedAverage([{ score: 4, weight: 1 }, { score: 2, weight: 1 }]), '3.00');
});

test('calcWeightedAverage — ข้ามรายการที่ score เป็น null', () => {
  assert.strictEqual(calcWeightedAverage([{ score: null, weight: 5 }, { score: 3, weight: 1 }]), '3.00');
});

test('calcWeightedAverage — ไม่มีคะแนน คืน 0', () => {
  assert.strictEqual(calcWeightedAverage([]), 0);
  assert.strictEqual(calcWeightedAverage([{ score: null, weight: 1 }]), 0);
});

test('calcWeightedAverage — คะแนนเต็มทุกตัว = 4.00', () => {
  assert.strictEqual(calcWeightedAverage([{ score: 4, weight: 3 }, { score: 4, weight: 2 }]), '4.00');
});

test('scoreToGrade — แปลงคะแนนเป็นระดับตามเกณฑ์', () => {
  assert.strictEqual(scoreToGrade(3.8).label, 'ดีเยี่ยม');
  assert.strictEqual(scoreToGrade(3.0).label, 'ดี');
  assert.strictEqual(scoreToGrade(2.0).label, 'พอใช้');
  assert.strictEqual(scoreToGrade(1.0).label, 'ปรับปรุง');
});

test('scoreToGrade — ขอบเขตระดับ (boundary)', () => {
  assert.strictEqual(scoreToGrade(3.5).label, 'ดีเยี่ยม');
  assert.strictEqual(scoreToGrade(2.5).label, 'ดี');
  assert.strictEqual(scoreToGrade(1.5).label, 'พอใช้');
  assert.strictEqual(scoreToGrade(1.49).label, 'ปรับปรุง');
});
