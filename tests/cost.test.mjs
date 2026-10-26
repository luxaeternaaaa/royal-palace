import test from 'node:test';
import assert from 'node:assert/strict';
import * as cost from '../public/cost.mjs';

const valid = { guests: '100', budget: '50000' };
const spaces = text => text.replaceAll('\u00a0', ' ');

test('two numbers compose a complete budget request without event or date', () => {
  assert.equal(spaces(cost.composeCostMessage(valid)), [
    'Здравствуйте, Royal Palace!',
    '',
    'Гостей: 100.',
    'Наш бюджет на гостя: 50 000 ₸.',
    'Ориентир по нашему бюджету: 5 000 000 ₸ (100 × 50 000 ₸).',
    'Сумма рассчитана по нашему бюджету. Стоимость ресторана нужно уточнить.',
    '',
    'Уточните, пожалуйста, актуальное меню, итоговую стоимость и что в неё входит.',
  ].join('\n'));
});

test('visitor budget multiplies exactly and accepts inclusive limits', () => {
  for (const [guests, budget, total] of [['100', '50000', 5000000], [1, 1000, 1000], [550, 100000, 55000000], [144, 12345, 1777680]]) {
    assert.deepEqual(cost.validateBudget({ guests, budget }), {});
    assert.equal(cost.estimateBudget(guests, budget), total);
  }
});

test('blank, fractional, exponent and out-of-range values never produce an estimate or message', () => {
  const invalid = {
    guests: ['', ' ', '0', '-1', '551', '1.5', '1e2', '0x64', '+100', 'abc', 'constructor', null, undefined, NaN, Infinity, {}, [100], true],
    budget: ['', ' ', '999', '-1000', '100001', '1234.5', '1e4', '0x2710', '+10000', 'abc', '__proto__', null, undefined, NaN, Infinity, {}, [50000], true],
  };
  for (const [field, values] of Object.entries(invalid)) {
    for (const value of values) {
      const draft = { ...valid, [field]: value };
      assert.deepEqual(Object.keys(cost.validateBudget(draft)), [field], `${field}: ${String(value)}`);
      assert.throws(() => cost.estimateBudget(draft.guests, draft.budget), RangeError);
      assert.throws(() => cost.composeCostMessage(draft), RangeError);
    }
  }
  assert.deepEqual(Object.keys(cost.validateBudget({})), ['guests', 'budget']);
});

test('budget drafts do not read, mutate or include unrelated enquiry answers', () => {
  const draft = Object.freeze({ ...valid, event: 'Свадьба', date: '2026-10-30', help: 'own', priorities: ['menu'], wishes: 'private draft' });
  assert.deepEqual(cost.validateBudget(draft), {});
  assert.equal(cost.composeCostMessage(draft), cost.composeCostMessage(valid));
  assert.doesNotMatch(cost.composeCostMessage(draft), /Свадьба|2026-10-30|private draft|Пожелание|Для нас важно|свободна ли дата|депозит|сервисный сбор/);
});
