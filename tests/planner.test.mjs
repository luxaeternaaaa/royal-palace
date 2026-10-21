import test from 'node:test';
import assert from 'node:assert/strict';
import * as planner from '../public/planner.mjs';
const { astanaToday, validateEnquiry, composeMessage, whatsappUrl } = planner;

const valid = { event: 'Свадьба', date: '2026-11-21', dateUndecided: false, guests: '120', guestsUndecided: false, wishes: '' };
const today = '2026-10-20';

test('Astana date uses UTC+5 across midnight, independently of host timezone', () => {
  assert.equal(astanaToday(new Date('2026-10-19T20:15:00Z')), '2026-10-20');
});
test('accepts a valid requested date and integer guest count', () => {
  assert.deepEqual(validateEnquiry(valid, today), {});
});
test('rejects a past or impossible calendar date and retains a field-specific error', () => {
  for (const date of ['2026-10-19', '2026-02-30', 'hello']) {
    assert.match(validateEnquiry({ ...valid, date }, today).date, /дат/);
  }
});
test('explicitly undecided date and guests are valid without numeric values', () => {
  assert.deepEqual(validateEnquiry({ ...valid, date: '', guests: '', dateUndecided: true, guestsUndecided: true }, today), {});
});
test('blank optional date and guest fields need no undecided checkboxes', () => {
  for (const value of ['', '   ', undefined, null]) {
    assert.deepEqual(validateEnquiry({ ...valid, date: value, guests: value }, today), {});
  }
});
test('rejects zero, negative, fractional, nonnumeric and unreasonable guest inputs', () => {
  for (const guests of ['0', '-1', '2.5', '1e3', '999999', 'abc']) {
    assert.ok(validateEnquiry({ ...valid, guests }, today).guests);
  }
});
test('accepts today, but rejects unknown occasion and excessively long wishes', () => {
  assert.deepEqual(validateEnquiry({ ...valid, date: today }, today), {});
  assert.ok(validateEnquiry({ ...valid, event: 'invalid' }, today).event);
  assert.ok(validateEnquiry({ ...valid, wishes: 'a'.repeat(501) }, today).wishes);
});
test('message contains exact enquiry details and asks about conditions without claiming booking', () => {
  const message = composeMessage({ ...valid, wishes: 'Нужна встреча & осмотр зала' });
  assert.equal(message.split('\n')[0], 'Здравствуйте, Royal Palace!');
  assert.match(message, /Свадьба/);
  assert.match(message, /21 ноября 2026/);
  assert.match(message, /120/);
  assert.match(message, /Нужна встреча & осмотр зала/);
  assert.match(message, /свободна ли дата/);
  assert.doesNotMatch(message, /забронирован|подтверждено/);
});
test('undecided details are honestly represented', () => {
  const message = composeMessage({ ...valid, dateUndecided: true, guestsUndecided: true });
  assert.match(message, /Дата: пока выбираем/);
  assert.match(message, /Гостей: пока не знаем/);
  assert.doesNotMatch(message, /120|21 ноября/);
});
test('undecided date asks for conditions without asking about an unspecified date', () => {
  const message = composeMessage({ ...valid, dateUndecided: true });
  assert.doesNotMatch(message, /свободна ли дата/);
  assert.match(message, /условия/);
  assert.equal((message.match(/пока выбираем/g) ?? []).length, 1);
  assert.doesNotMatch(message, /просмотр|приехать/);
});
test('past and impossible nonempty dates provide distinct recovery instructions', () => {
  const past = validateEnquiry({ ...valid, date: '2026-10-19' }, today).date;
  const impossible = validateEnquiry({ ...valid, date: '2026-11-31' }, today).date;
  assert.notEqual(past, impossible);
  assert.match(past, /прошла/);
});
test('blank date and guest fields produce honest unknowns instead of a crash or zero', () => {
  for (const value of ['', '   ', undefined, null]) {
    const message = composeMessage({ ...valid, date: value, guests: value });
    assert.match(message, /Дата: пока выбираем/);
    assert.match(message, /Гостей: пока не знаем/);
    assert.doesNotMatch(message, /Гостей: 0|Invalid Date|undefined|null|свободна ли дата/);
  }
});
test('a general enquiry asks about the date and conditions without inventing a visit', () => {
  const message = composeMessage(valid);
  assert.match(message, /свободна ли дата/);
  assert.match(message, /условия/);
  assert.doesNotMatch(message, /просмотр|приехать|посетить/);
});
test('specific FAQ enquiries ask only the selected questions and retain exact event details', () => {
  const wishes = 'Той: без алкоголя & детское меню\nВажны эти детали.';
  for (const topic of ['menu', 'guests', 'visit', 'hall']) {
    const message = composeMessage({ ...valid, hall: 'middle', wishes, topics: [topic, topic] });
    assert.match(message, /Событие: Свадьба/);
    assert.match(message, /Зал: Орта зал \(средний\)/);
    assert.ok(message.includes(`Пожелания: ${wishes}`));
    assert.doesNotMatch(message, /свободна ли дата|какие условия/);
    if (topic !== 'visit') assert.doesNotMatch(message, /просмотр|приехать|посетить/);
    assert.equal(message.split(planner.ENQUIRY_TOPICS[topic]).length - 1, 1);
  }
});
test('WhatsApp URL encodes Cyrillic and punctuation for the verified recipient', () => {
  const message = 'Свадьба & той? + 120 гостей\nПожелания #1';
  const url = new URL(whatsappUrl(message));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/77715790555');
  assert.equal(url.searchParams.get('text'), message);
  assert.equal([...url.searchParams].length, 1);
});
test('FAQ topics add relevant questions without replacing wishes or repeating a topic', () => {
  const message = composeMessage({ ...valid, wishes: 'Хочу сохранить эти пожелания', topics: ['menu', 'visit', 'menu', 'invalid'] });
  assert.match(message, /Пожелания: Хочу сохранить эти пожелания/);
  assert.equal(message.match(/актуальное меню/g).length, 1);
  assert.match(message, /Хотим приехать посмотреть зал/);
  assert.doesNotMatch(message, /undefined|invalid/);
});
test('each confirmed hall is carried into the message with an understandable name', () => {
  for (const [hall, expected] of [['main', 'Основной зал'], ['middle', 'Орта зал (средний)'], ['small', 'Кіші зал (малый)']]) {
    assert.deepEqual(validateEnquiry({ ...valid, hall }, today), {});
    assert.ok(composeMessage({ ...valid, hall }).includes(`Зал: ${expected}`));
  }
});
test('unselected hall describes the decision honestly without copying the UI instruction', () => {
  assert.equal(planner.HALLS.help, 'Помогите выбрать зал');
  for (const hall of [undefined, null, '', 'help']) {
    const message = composeMessage({ ...valid, hall });
    assert.match(message, /Зал: пока не выбрали/);
    assert.doesNotMatch(message, /Помогите выбрать зал/);
  }
  assert.ok(validateEnquiry({ ...valid, hall: 'invented-hall' }, today).hall);
});
test('quick menu request needs no event details and does not add a visit', () => {
  assert.equal(typeof planner.composeQuickMessage, 'function');
  const message = planner.composeQuickMessage('menu');
  assert.match(message, /^Здравствуйте, Royal Palace!/);
  assert.match(message, /актуальное меню с ценами/);
  assert.match(message, /Что входит в стоимость банкета\?/);
  assert.doesNotMatch(message, /Событие:|Дата:|Гостей:|торжества|просмотр|приехать|свободна ли дата/);
});
test('quick visit request contains only the requested viewing question', () => {
  assert.equal(typeof planner.composeQuickMessage, 'function');
  const message = planner.composeQuickMessage('visit');
  assert.match(message, /посмотреть зал/);
  assert.match(message, /когда/);
  assert.doesNotMatch(message, /Событие:|Дата:|Гостей:|меню|стоимость|свободна ли дата/);
});
test('quick photo requests carry the exact selected hall without adding event plans', () => {
  assert.equal(typeof planner.composeQuickMessage, 'function');
  for (const hall of ['main', 'middle', 'small']) {
    const message = planner.composeQuickMessage('hallPhotos', hall);
    assert.ok(message.includes(planner.HALLS[hall]));
    assert.match(message, /фото/);
    assert.match(message, /варианты рассадки/);
    if (hall === 'small') assert.match(message, /сколько гостей он рассчитан/);
    else assert.doesNotMatch(message, /вместимость|сколько гостей/);
    for (const other of ['main', 'middle', 'small'].filter(key => key !== hall)) {
      assert.ok(!message.includes(planner.HALLS[other]));
    }
    assert.doesNotMatch(message, /Событие:|Дата:|Гостей:|меню|стоимость|приехать|посмотреть зал|всех трёх/);
  }
});
test('quick photo request without a hall asks for all three actual halls', () => {
  assert.equal(typeof planner.composeQuickMessage, 'function');
  for (const hall of [undefined, 'help', 'unknown']) {
    const message = planner.composeQuickMessage('hallPhotos', hall);
    assert.match(message, /фото всех трёх залов/);
    assert.match(message, /вместимость и варианты рассадки каждого зала/);
    for (const key of ['main', 'middle', 'small']) assert.ok(message.includes(planner.HALLS[key]));
    assert.doesNotMatch(message, /undefined|unknown|Помогите выбрать зал/);
  }
});
test('unknown quick topics cannot silently introduce an unrelated request', () => {
  assert.equal(typeof planner.composeQuickMessage, 'function');
  assert.throws(() => planner.composeQuickMessage('invalid'), { name: 'RangeError', message: /topic|тем|запрос/i });
});
