import test from 'node:test';
import assert from 'node:assert/strict';
import { MENUS } from '../public/menu-data.mjs';
import { getMenuSections, getMenuTerms, getMenuNotes, getMenuAsset } from '../public/menu-locales.mjs';
import { composeMenuMessage, composeQuickMessage, getPlannerCopy, whatsappUrl } from '../public/planner.mjs';

test('localized sheets keep Russian fallback URLs and select matching full images and previews', () => {
  for (const menu of MENUS) for (const locale of ['ru', 'kk', 'en']) {
    const folder = locale === 'ru' ? '' : `${locale}/`;
    assert.equal(getMenuAsset(menu, locale), `/assets/menus/${folder}${menu.id}.webp`);
    assert.equal(getMenuAsset(menu, locale, 'preview'), `/assets/menus/${folder}${menu.id}-preview.webp`);
  }
  assert.equal(getMenuAsset(MENUS[0], 'unknown'), getMenuAsset(MENUS[0], 'ru'));
  assert.throws(() => getMenuAsset(MENUS[0], 'en', 'unknown'), RangeError);
});

test('every translated menu retains all dishes and six readable sections', () => {
  for (const menu of MENUS) for (const locale of ['ru', 'kk', 'en']) {
    const sections = getMenuSections(menu, locale);
    assert.equal(sections.length, 6, `${menu.id}/${locale}`);
    assert.equal(sections.flatMap(section => section.items).length, menu.columns.flat().flatMap(section => section.items).length);
    for (const section of sections) {
      assert.ok(section.title);
      for (const item of section.items) assert.ok(item.name && typeof item.detail === 'string');
    }
    assert.ok(getMenuTerms(menu, locale));
    if (locale === 'en') assert.doesNotMatch(JSON.stringify(sections), /[А-Яа-яӘәҒғҚқҢңӨөҰұҮүІі]/);
  }
});

test('short menu footnotes retain source quantities without ingredient descriptions', () => {
  for (const locale of ['ru', 'kk', 'en']) {
    const notes = id => getMenuNotes(MENUS.find(menu => menu.id === id), locale);
    for (const menu of MENUS) assert.ok(notes(menu.id)[0].length > 10);
    assert.equal(notes('as-beru-16000').length, 1);
    assert.equal(notes('main-30000').length, 4);
    assert.equal(notes('main-40000').length, 3);
    assert.notEqual(notes('main-30000').at(-1), notes('middle-27000').at(-1));
    if (locale === 'en') {
      assert.match(notes('main-30000').at(-1), /6 L\.$/);
      assert.match(notes('middle-27000').at(-1), /6 L per table\.$/);
      assert.doesNotMatch(notes('as-beru-16000').join(' '), /unlimited/i);
    }
  }
});

test('exact menu enquiries retain the chosen offer without inventing a date or booking', () => {
  for (const menu of MENUS) for (const locale of ['ru', 'kk', 'en']) {
    const message = composeMenuMessage(menu.id, locale);
    assert.ok(message.includes(getMenuTerms(menu, locale)), `${menu.id}/${locale}`);
    assert.ok(message.includes(new Intl.NumberFormat(locale === 'kk' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'ru-RU').format(menu.price)));
    if (menu.hall && menu.hall !== 'memorial') assert.ok(message.includes(getPlannerCopy(locale).halls[menu.hall]));
    assert.doesNotMatch(message, /Дата:|Күні:|Date:|Забронировано|Booked|бронь подтверждена/i);
    assert.equal(new URL(whatsappUrl(message)).searchParams.get('text'), message);
  }
  for (const id of ['unknown', '__proto__', '', null]) assert.throws(() => composeMenuMessage(id), RangeError);
});

test('service enquiries retain an explicitly selected hall and do not add a food offer', () => {
  for (const hall of ['main', 'middle', 'small']) for (const locale of ['ru', 'kk', 'en']) {
    const message = composeQuickMessage('services', hall, locale);
    assert.ok(message.includes(getPlannerCopy(locale).halls[hall]));
    assert.doesNotMatch(message, /Меню:|Мәзір:|Menu:|Дата:|Күні:|Date:/);
  }
  assert.doesNotMatch(composeQuickMessage('services', 'constructor'), /function|undefined/);
});
