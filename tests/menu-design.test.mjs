import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MENUS } from '../scripts/menu-design/menus.mjs';
import { PAGE_COPY } from '../public/page-locales.mjs';

const byId = id => MENUS.find(menu => menu.id === id);
const items = menu => menu.columns.flat().flatMap(category => category.items);

test('the nine menu offers retain their hall, price and source conditions', () => {
  assert.deepEqual(MENUS.map(({ id, hall, price }) => [id, hall, price]), [
    ['main-30000', 'main', 30000], ['main-35000', 'main', 35000], ['main-40000', 'main', 40000],
    ['middle-27000', 'middle', 27000], ['middle-32000', 'middle', 32000],
    ['small-27000', 'small', 27000], ['small-32000', 'small', 32000], ['small-38000', 'small', 38000],
    ['as-beru-16000', 'memorial', 16000],
  ]);
  for (const menu of MENUS) {
    assert.equal(items(menu).find(item => item.name === 'Бешбармак').ingredients, 'Мясо предоставляет заказчик');
    if (menu.hall === 'small') assert.deepEqual(menu.extras.map(extra => extra.price), [200000]);
  }
  assert.equal(byId('main-30000').days, 'Понедельник–четверг');
  assert.equal(byId('main-35000').days, 'Пятница–воскресенье');
  assert.equal(byId('main-40000').days, '');
  assert.equal(byId('as-beru-16000').days, '11:00–14:00');
  assert.deepEqual(byId('as-beru-16000').extras, []);
  assert.ok(!JSON.stringify(byId('as-beru-16000')).includes('Без ограничений'));
});

test('similar packages keep their actual ingredient and quantity differences', () => {
  const find = (id, name) => items(byId(id)).find(item => item.name === name);
  assert.equal(find('main-30000', 'Клюквенный морс').ingredients, '6 л');
  for (const menu of MENUS.filter(menu => !['main-30000', 'as-beru-16000'].includes(menu.id))) {
    assert.equal(items(menu).find(item => item.name === 'Клюквенный морс').ingredients, '6 л на стол');
  }
  assert.equal(find('main-40000', 'Капрезе').ingredients, 'Мусс из страчателлы с томатами черри');
  assert.equal(find('small-38000', 'Капрезе').ingredients, 'Помидоры, моцарелла, соус песто');
  assert.ok(find('small-38000', 'Самса с мясом и с грибами'));
  assert.ok(find('main-40000', 'Самса с мясом и грибами'));
  assert.ok(find('main-35000', 'Салат с ягодным соусом').ingredients.startsWith('Филе утки'));
});

test('concise dish labels keep meaningful ingredients, portions and source differences', () => {
  const visible = item => `${item.label ?? item.name} ${item.detail ?? item.ingredients}`;
  for (const menu of MENUS) {
    const dishes = items(menu);
    assert.match(visible(dishes.find(item => item.name === 'Бешбармак')), /Мясо заказчика/);
    const tea = dishes.find(item => item.name.startsWith('Чай'));
    assert.match(visible(tea), /С молоком или без|с молоком или без/);
    assert.equal(visible(tea).includes('без ограничений'), menu.hall !== 'memorial');
    for (const item of dishes.filter(item => item.ingredients === '1 шт. на гостя')) assert.match(visible(item), /1 шт\. на гостя/);
    const fish = dishes.find(item => /^(Палтус|Лосось на|Запечённый судак)/.test(item.name));
    if (fish) assert.ok(fish.detail && fish.label.length < fish.name.length, menu.id);
  }
  const salmon = items(byId('main-35000'));
  assert.match(visible(salmon.find(item => item.name.startsWith('Буррата'))), /Буррата.*креветками.*Руккола.*песто/);
  assert.match(visible(salmon.find(item => item.name.startsWith('Салат с курицей'))), /черносливом.*Шампиньоны.*трюфельной/);
  assert.match(visible(salmon.find(item => item.name === 'Салат с ягодным соусом')), /Филе утки/);
});

test('menu cards show their own complete source sheet instead of generated food or extra copy', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const cards = [...html.matchAll(/<a class="menu-card" href="\/assets\/menus\/([^"/]+)\.webp"([^>]*)>([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, MENUS.length);
  assert.doesNotMatch(html, /\/assets\/food\/|menu-photo-note|menu-card-terms|menu-card-course|menu-viewer-terms/);
  for (const [, id, attributes, content] of cards) {
    assert.ok(byId(id));
    assert.equal(content.match(/src="([^"]+)"/)[1], `/assets/menus/${id}-preview.webp`);
    const documentKey = attributes.match(/data-menu-image-key="([^"]+)"/)[1];
    const photoKey = content.match(/data-i18n-alt="([^"]+)"/)[1];
    assert.equal(documentKey, photoKey);
    for (const language of ['ru', 'kk', 'en']) {
      assert.ok(PAGE_COPY[language][documentKey] && PAGE_COPY[language][photoKey], `${language}/${id}`);
    }
  }
});
