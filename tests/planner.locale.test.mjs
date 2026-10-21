import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, HALLS, ENQUIRY_TOPICS, getPlannerCopy, validateEnquiry, composeMessage, composeQuickMessage, whatsappUrl } from '../public/planner.mjs';

const today = '2026-10-21';
const draft = { event: 'Свадьба', hall: 'main', date: '2099-11-21', guests: '144', wishes: 'Әжемізге ыңғайлы орын. Keep this exact: <&>.' };

test('localized labels preserve stored event/hall/topic keys and safely fall back to Russian', () => {
  for (const locale of ['kk', 'en']) {
    const copy = getPlannerCopy(locale);
    assert.deepEqual(Object.keys(copy.events), EVENTS);
    assert.deepEqual(Object.keys(copy.halls), Object.keys(HALLS));
    assert.deepEqual(Object.keys(copy.topics), Object.keys(ENQUIRY_TOPICS));
  }
  assert.equal(getPlannerCopy('kk').halls.main, 'Негізгі зал');
  assert.equal(getPlannerCopy('en').events['Свадьба'], 'Wedding');
  assert.equal(getPlannerCopy('en').events['Юбилей'], 'Milestone celebration');
  for (const locale of ['constructor', '__proto__', 'toString', 'en-GB', '', null, {}, 1]) assert.deepEqual(getPlannerCopy(locale), getPlannerCopy('ru'));
});

test('validation translates all enquiry fields and distinguishes invalid dates from past dates', () => {
  const invalid = { event: 'unknown', hall: 'constructor', date: '2026-10-20', guests: '0', wishes: 'x'.repeat(501) };
  const kk = validateEnquiry(invalid, today, 'kk');
  const en = validateEnquiry(invalid, today, 'en');
  assert.deepEqual(Object.keys(kk), ['event', 'hall', 'date', 'guests', 'wishes']);
  assert.match(kk.event, /Іс-шара/); assert.match(kk.hall, /Тізімнен/); assert.match(kk.date, /өтіп кетті/); assert.match(kk.guests, /бүтін/); assert.match(kk.wishes, /500 таңба/);
  assert.match(en.event, /Choose/); assert.match(en.hall, /hall/); assert.match(en.date, /passed/); assert.match(en.guests, /whole number/); assert.match(en.wishes, /500 characters/);
  assert.match(validateEnquiry({ ...draft, date: '2099-02-30' }, today, 'kk').date, /күнтізбеден/);
  assert.match(validateEnquiry({ ...draft, date: '2099-02-30' }, today, 'en').date, /calendar/);
});

test('messages localize event, hall and calendar date while retaining arbitrary wishes verbatim', () => {
  const kk = composeMessage(draft, 'kk');
  const en = composeMessage(draft, 'en');
  assert.match(kk, /^Сәлеметсіз бе, Royal Palace!/); assert.match(kk, /Іс-шара: Үйлену тойы/); assert.match(kk, /Зал: Негізгі зал/); assert.match(kk, /Күні: 2099 ж\. 21 қараша/);
  assert.match(en, /^Hello, Royal Palace!/); assert.match(en, /Event: Wedding/); assert.match(en, /Hall: Main hall/); assert.match(en, /Date: 21 November 2099/);
  assert.ok(kk.includes(`Тілектер: ${draft.wishes}`)); assert.ok(en.includes(`Preferences: ${draft.wishes}`));
  assert.equal(new URL(whatsappUrl(kk)).searchParams.get('text'), kk);
});

test('unknown plans and selected questions stay localized without inherited-topic leakage', () => {
  for (const locale of ['kk', 'en']) {
    const message = composeMessage({ event: 'Қыз ұзату', hall: 'help', date: '', guests: '', wishes: '', topics: ['menu', 'menu', 'constructor'] }, locale);
    const copy = getPlannerCopy(locale);
    assert.ok(message.includes(copy.events['Қыз ұзату']));
    assert.equal(message.split(copy.topics.menu).length - 1, 1);
    assert.doesNotMatch(message, /function|Событие:|Гостей:/);
    if (locale === 'kk') { assert.match(message, /Күні: әзірге таңдап жатырмыз/); assert.match(message, /Қонақтар саны: әзірге белгісіз/); }
    else { assert.match(message, /Date: still deciding/); assert.match(message, /Guests: not known yet/); }
  }
});

test('quick enquiries translate menu, viewing and exact hall requests without adding event plans', () => {
  for (const locale of ['kk', 'en']) {
    const copy = getPlannerCopy(locale);
    assert.ok(composeQuickMessage('menu', 'help', locale).includes(copy.topics.menu));
    assert.ok(composeQuickMessage('visit', 'help', locale).includes(copy.topics.visit));
    const small = composeQuickMessage('hallPhotos', 'small', locale);
    assert.ok(small.includes(copy.halls.small));
    assert.match(small, locale === 'kk' ? /Неше қонаққа/ : /How many guests/);
    const all = composeQuickMessage('hallPhotos', 'help', locale);
    for (const hall of ['main', 'middle', 'small']) assert.ok(all.includes(copy.halls[hall]));
    assert.doesNotMatch(all, /Событие:|Date:|Күні:/);
    assert.throws(() => composeQuickMessage('constructor', 'help', locale), locale === 'kk' ? /тақырыбы белгісіз/ : /Unknown quick/);
  }
});
