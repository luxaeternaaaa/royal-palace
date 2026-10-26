import test from 'node:test';
import assert from 'node:assert/strict';
import { OCCASION_MENUS } from '../public/occasion-menu-data.mjs';
import { OCCASION_TRANSLATIONS } from '../public/occasion-menu-locales.mjs';

const byId = id => OCCASION_MENUS.find(menu => menu.id === id);
const items = menu => menu.columns.flat().flatMap(section => section.items);
const category = (menu, title) => menu.columns.flat().find(section => section.title === title).items;

test('eleven source offers keep their printed price, occasion, physical hall and guest limits', () => {
  assert.equal(OCCASION_MENUS.length, 11);
  assert.equal(new Set(OCCASION_MENUS.map(menu => menu.id)).size, 11);
  assert.deepEqual(OCCASION_MENUS.map(({ sourceId, price, hall, guests, occasion }) => [sourceId, price, hall, guests, occasion]), [
    ['05', 45000, 'main', '250–500 гостей', 'newyear'], ['09', 55000, 'main', '250–500 гостей', 'newyear'], ['11', 60000, 'main', '250–500 гостей', 'newyear'],
    ['02', 40000, 'middle', '84–144 гостя', 'newyear'], ['07', 50000, 'middle', '84–144 гостя', 'newyear'], ['08', 55000, 'middle', '84–144 гостя', 'newyear'],
    ['03', 40000, 'small', '48–60 гостей', 'newyear'], ['06', 50000, 'small', '48–60 гостей', 'newyear'], ['10', 55000, 'small', '48–60 гостей', 'newyear'],
    ['01', 37000, null, 'До 500 гостей', 'graduation'], ['04', 42000, null, 'До 500 гостей', 'graduation'],
  ]);
  for (const menu of OCCASION_MENUS) {
    assert.equal(menu.days, '');
    assert.equal(menu.paper, menu.occasion === 'graduation' ? 'graduation' : `newyear-${menu.hall}`);
    assert.doesNotMatch(menu.notes.join(' '), /заказчик|мясо.*предостав|per guest.*12/i);
    assert.ok(items(menu).some(item => item.name === 'Мини-пирожные (12 шт.)'));
  }
});

test('New Year menus preserve explicit alternatives and included services without old surcharges', () => {
  for (const menu of OCCASION_MENUS.filter(menu => menu.occasion === 'newyear')) {
    assert.equal(menu.servicesIncluded, true);
    assert.deepEqual(menu.extras, []);
    assert.equal(category(menu, 'Основное блюдо').length, 1);
    assert.match(category(menu, 'Основное блюдо')[0].name, /^Бешбармак \(нарезное мясо\) или /);
    assert.ok(category(menu, 'Холодные закуски').some(item => item.name === 'Разносолы по-домашнему или кавказская закуска'));
    assert.equal(category(menu, 'Напитки').length, 5);
    assert.ok(category(menu, 'Напитки').every(item => item.ingredients === 'Без ограничений'));
    assert.doesNotMatch(menu.notes.join(' '), /6 л|аренда|заказчик/i);
    assert.ok(menu.notes.includes('Напитки — без ограничений.'));
    assert.match(menu.notes[1], menu.hall === 'main' ? /4 LED/ : menu.hall === 'middle' ? /5 LED/ : /LED-экран,/);
  }
});

test('source-specific cold starters and individual serving do not leak to neighbouring offers', () => {
  assert.ok(category(byId('newyear-small-55000'), 'Холодные закуски').some(item => item.name.startsWith('Баллотин')));
  for (const id of ['newyear-main-60000', 'newyear-middle-55000']) {
    assert.ok(category(byId(id), 'Холодные закуски').some(item => item.name === 'Капрезе' && item.ingredients.includes('страчателлы')));
    assert.ok(!items(byId(id)).some(item => item.name.startsWith('Баллотин')));
  }
  assert.deepEqual(OCCASION_MENUS.filter(menu => menu.notes.some(note => /индивидуально/.test(note))).map(menu => menu.id), ['newyear-middle-50000']);
});

test('graduation dishes keep four salads, separate equipment and both first courses at 42k', () => {
  for (const price of [37000, 42000]) {
    const menu = byId(`graduation-${price}`);
    assert.equal(menu.hall, null);
    assert.equal(menu.servicesIncluded, false);
    assert.deepEqual(menu.extras.map(extra => extra.price), [1000000]);
    assert.equal(category(menu, 'Салаты').length, 4);
    assert.ok(!category(menu, 'Салаты').some(item => /Нисуаз/.test(item.name)));
    assert.equal(category(menu, 'Горячая закуска').length, 2);
    assert.ok(category(menu, 'Горячая закуска').every(item => item.ingredients === '1 шт. на гостя'));
    assert.equal(category(menu, 'Напитки').find(item => item.name === 'Клюквенный морс').ingredients, '6 л');
    assert.doesNotMatch(menu.notes.join(' '), /6 л на стол/);
  }
  assert.deepEqual(category(byId('graduation-37000'), 'Основное блюдо').map(item => item.name), ['Мясной микс']);
  assert.deepEqual(category(byId('graduation-42000'), 'Основное блюдо').map(item => item.name), ['Мясной микс', 'Бешбармак']);
  assert.match(category(byId('graduation-37000'), 'Второе горячее')[0].name, /рататуем и рисом в сливочном соусе$/);
  assert.match(category(byId('graduation-42000'), 'Второе горячее')[0].name, /рисом в сливочном соусе$/);
});

test('every visible dish and note has complete Russian, Kazakh and English translations', () => {
  const translations = new Map(OCCASION_TRANSLATIONS.map(([ru, kk, en]) => [ru, { ru, kk, en }]));
  assert.equal(translations.size, OCCASION_TRANSLATIONS.length);
  for (const menu of OCCASION_MENUS) {
    const visible = [...menu.notes, ...menu.columns.flat().flatMap(section => section.items.map(item => section.title === 'Второе горячее' ? item.name : item.label ?? item.name))];
    for (const text of visible) {
      const entry = translations.get(text);
      assert.ok(entry, `${menu.id}: ${text}`);
      for (const locale of ['ru', 'kk', 'en']) assert.ok(typeof entry[locale] === 'string' && entry[locale].length > 0);
      assert.doesNotMatch(entry.en, /[А-Яа-яӘәҒғҚқҢңӨөҰұҮүІі]/);
    }
    assert.ok(items(menu).every(item => item.detail === ''));
  }
});
