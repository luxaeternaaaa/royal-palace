import test from 'node:test';
import assert from 'node:assert/strict';
import * as cost from '../public/cost.mjs';

const draft = { guests: '100', budget: '50000' };

test('budget validation and guards use the selected language', () => {
  for (const locale of ['ru', 'kk', 'en']) {
    const errors = cost.validateBudget({ guests: 0, budget: 0 }, locale);
    assert.deepEqual(Object.keys(errors), ['guests', 'budget']);
    assert.match(errors.guests, { ru: /число гостей/, kk: /Қонақтар санын/, en: /number of guests/ }[locale]);
    assert.match(errors.budget, { ru: /бюджет на гостя/, kk: /бюджетті/, en: /budget per guest/ }[locale]);
    assert.throws(() => cost.estimateBudget(0, 50000, locale), { ru: /Проверьте число/, kk: /бюджетті тексеріңіз/, en: /Check the guest count/ }[locale]);
    assert.throws(() => cost.composeCostMessage({ ...draft, budget: 0 }, locale), { ru: /Проверьте ответы/, kk: /жауаптарыңызды тексеріңіз/, en: /Check your answers/ }[locale]);
  }
});

test('invalid and prototype locale names safely fall back to Russian', () => {
  for (const locale of ['__proto__', 'constructor', 'toString', 'kk-KZ', {}, null]) {
    assert.deepEqual(cost.validateBudget({ guests: 0, budget: 0 }, locale), cost.validateBudget({ guests: 0, budget: 0 }, 'ru'));
    assert.equal(cost.composeCostMessage(draft, locale), cost.composeCostMessage(draft, 'ru'));
  }
});

test('English request formats visitor budget and states that the venue price needs confirmation', () => {
  assert.equal(cost.composeCostMessage(draft, 'en'), [
    'Hello, Royal Palace!',
    '',
    'Guests: 100.',
    'Our budget per guest: 50,000 ₸.',
    'Estimated total based on our budget: 5,000,000 ₸ (100 × 50,000 ₸).',
    'This amount is based on our budget. The venue price still needs confirmation.',
    '',
    'Please confirm the current menu, final price and what it includes.',
  ].join('\n'));
});

test('Kazakh request keeps exact amounts without inventing event or date choices', () => {
  assert.equal(cost.composeCostMessage(draft, 'kk').replaceAll('\u00a0', ' '), [
    'Сәлеметсіз бе, Royal Palace!',
    '',
    'Қонақтар саны: 100.',
    'Бір қонаққа арналған бюджетіміз: 50 000 ₸.',
    'Бюджетіміз бойынша есептелген жалпы сома: 5 000 000 ₸ (100 × 50 000 ₸).',
    'Сома өз бюджетіміз бойынша есептелді. Мейрамхана бағасын нақтылау қажет.',
    '',
    'Қазіргі мәзірді, нақты жалпы құнын және оған не кіретінін айтып беріңізші.',
  ].join('\n'));
});
