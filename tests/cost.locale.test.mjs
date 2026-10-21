import test from 'node:test';
import assert from 'node:assert/strict';
import { COST_HELP, COST_PRIORITIES, getCostCopy, validateCostStep, estimateBudget, composeCostMessage } from '../public/cost.mjs';

const today = '2026-10-21';
const draft = { event: 'Свадьба', date: '', guests: '100', budget: '50000', help: 'own', priorities: ['menu', 'seating'] };

test('cost labels keep stable stored keys and share the safe locale allowlist', () => {
  for (const locale of ['kk', 'en']) {
    assert.deepEqual(Object.keys(getCostCopy(locale).help), Object.keys(COST_HELP));
    assert.deepEqual(Object.keys(getCostCopy(locale).priorities), Object.keys(COST_PRIORITIES));
  }
  assert.equal(getCostCopy('kk').help.own, 'Өзіміз ұйымдастырамыз');
  assert.equal(getCostCopy('en').priorities.equipment, 'Sound and lighting');
  for (const locale of ['__proto__', 'constructor', 'toString', 'kk-KZ', {}, null]) assert.deepEqual(getCostCopy(locale), getCostCopy('ru'));
});

test('every cost validation field and thrown guard is localized', () => {
  const invalid = { event: 'unknown', date: '2026-10-20', guests: 0, budget: 0, help: 'constructor', priorities: ['constructor'] };
  for (const locale of ['kk', 'en']) {
    const errors = validateCostStep(6, invalid, today, locale);
    assert.deepEqual(Object.keys(errors), ['event', 'date', 'guests', 'budget', 'help', 'priorities']);
    const joined = Object.values(errors).join(' ');
    assert.doesNotMatch(joined, /Выберите|Укажите|Проверьте|гостей|пожелания/);
    assert.match(errors.budget, locale === 'kk' ? /бюджетті/ : /budget per guest/);
    assert.match(errors.priorities, locale === 'kk' ? /қалауларыңызды/ : /preferences/);
    assert.throws(() => validateCostStep(7, draft, today, locale), locale === 'kk' ? /қадамы белгісіз/ : /Unknown estimate/);
    assert.throws(() => estimateBudget(0, 50000, locale), locale === 'kk' ? /бюджетті тексеріңіз/ : /Check the guest count/);
    assert.throws(() => composeCostMessage(invalid, locale), locale === 'kk' ? /жауаптарыңызды тексеріңіз/ : /Check your answers/);
  }
});

test('English estimate uses locale grouping, visitor budget wording and translated wishes', () => {
  const message = composeCostMessage(draft, 'en');
  assert.match(message, /Event: Wedding/);
  assert.match(message, /Our budget per guest: 50,000 ₸/);
  assert.match(message, /Estimated total based on our budget: 5,000,000 ₸ \(100 × 50,000 ₸\)/);
  assert.match(message, /venue price still needs confirmation/);
  assert.match(message, /Planning preference: We will organise it ourselves/);
  assert.match(message, /What matters to us: Menu and food presentation; Seating and guest comfort/);
  assert.doesNotMatch(message, /Событие:|Бюджет|Гостей:|service charge|deposit|includes equipment/);
});

test('Kazakh estimate retains amount, cultural event name and optional date semantics', () => {
  const message = composeCostMessage({ ...draft, event: 'Қыз ұзату', help: '', priorities: ['equipment'] }, 'kk').replaceAll('\u00a0', ' ');
  assert.match(message, /Іс-шара: Қыз ұзату/);
  assert.match(message, /Күні: әзірге таңдап жатырмыз/);
  assert.match(message, /Бір қонаққа арналған бюджетіміз: 50 000 ₸/);
  assert.match(message, /Бюджетіміз бойынша есептелген жалпы сома: 5 000 000 ₸/);
  assert.match(message, /Мейрамхана бағасын нақтылау қажет/);
  assert.match(message, /Біз үшін маңызды: Дыбыс пен жарық/);
  assert.doesNotMatch(message, /Ұйымдастыру бойынша қалауымыз|Осы күн бос па|Наш бюджет|Пожелание/);
});
