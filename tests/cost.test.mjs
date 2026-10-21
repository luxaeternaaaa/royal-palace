import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateBudget, validateCostStep, composeCostMessage } from '../public/cost.mjs';

const today = '2026-10-21';
const valid = { event: 'Қыз ұзату', date: '', guests: '100', budget: '50000', help: 'own', priorities: ['menu', 'seating'] };

test('visitor budget multiplies exactly and accepts inclusive limits', () => {
  assert.equal(estimateBudget('100', '50000'), 5000000);
  assert.equal(estimateBudget(1, 1000), 1000);
  assert.equal(estimateBudget(550, 100000), 55000000);
  assert.equal(estimateBudget(144, 12345), 1777680);
});

test('invalid guest and budget values never produce an estimate', () => {
  for (const guests of ['', '0', '-1', '551', '1.5', '1e2', 'abc', null, Infinity]) {
    assert.ok(validateCostStep(2, { ...valid, guests }, today).guests);
    assert.throws(() => estimateBudget(guests, valid.budget), RangeError);
  }
  for (const budget of ['', '999', '100001', '1234.5', '1e4', 'abc', null, Infinity]) {
    assert.ok(validateCostStep(3, { ...valid, budget }, today).budget);
    assert.throws(() => estimateBudget(valid.guests, budget), RangeError);
  }
});

test('optional date accepts an unknown day and rejects past or impossible dates', () => {
  assert.deepEqual(validateCostStep(1, valid, today), {});
  assert.deepEqual(validateCostStep(1, { ...valid, date: today }, today), {});
  for (const date of ['2026-10-20', '2026-02-30', 'not-a-date']) assert.ok(validateCostStep(1, { ...valid, date }, today).date);
});

test('each step validates its own answer while the result validates the whole draft', () => {
  assert.deepEqual(validateCostStep(1, { date: '' }, today), {});
  assert.deepEqual(validateCostStep(6, valid, today), {});
  const errors = validateCostStep(6, { event: 'Unknown', date: '', guests: '', budget: '' }, today);
  assert.deepEqual(Object.keys(errors), ['event', 'guests', 'budget']);
  assert.throws(() => validateCostStep(7, valid, today), RangeError);
});

test('optional wishes accept only known own keys and arrays', () => {
  assert.deepEqual(validateCostStep(6, { ...valid, help: '', priorities: [] }, today), {});
  assert.deepEqual(validateCostStep(6, { ...valid, help: undefined, priorities: undefined }, today), {});
  for (const help of ['constructor', 'unknown', 0]) assert.ok(validateCostStep(4, { ...valid, help }, today).help);
  for (const priorities of ['menu', null, ['constructor'], ['unknown']]) assert.ok(validateCostStep(5, { ...valid, priorities }, today).priorities);
});

test('message carries exact visitor choices and labels the amount as a budget rather than a tariff', () => {
  const message = composeCostMessage(valid).replaceAll('\u00a0', ' ');
  assert.match(message, /Событие: Қыз ұзату/);
  assert.match(message, /Зал: пока не выбрали/);
  assert.match(message, /Дата: пока выбираем/);
  assert.match(message, /Гостей: 100/);
  assert.match(message, /Наш бюджет на гостя: 50 000 ₸\./);
  assert.match(message, /Ориентир по нашему бюджету: 5 000 000 ₸ \(100 × 50 000 ₸\)\./);
  assert.match(message, /Сумма рассчитана по нашему бюджету\. Стоимость ресторана нужно уточнить\./);
  assert.match(message, /Пожелание по организации: Организуем сами\./);
  assert.match(message, /Для нас важно: Меню и подача; Рассадка и удобство гостей\./);
  assert.match(message, /Уточните, пожалуйста, актуальное меню, итоговую стоимость и что в неё входит\./);
  assert.doesNotMatch(message, /свободна ли дата|сервисный сбор|депозит|аренда|включено/);
});

test('invalid drafts cannot reach message composition and repeated priorities do not repeat prose', () => {
  assert.throws(() => composeCostMessage({ ...valid, budget: 0 }), RangeError);
  const message = composeCostMessage({ ...valid, help: '', priorities: ['menu', 'menu'] });
  assert.equal((message.match(/Меню и подача/g) ?? []).length, 1);
  assert.doesNotMatch(message, /Пожелание по организации/);
});
