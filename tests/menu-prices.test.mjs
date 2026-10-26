import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MENUS } from '../public/menu-data.mjs';

test('every HTML menu amount agrees with its offer in the shared model', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const cards = [...html.matchAll(/<a\b[^>]*data-menu-id="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(cards.map(([, id]) => id).sort(), MENUS.map(menu => menu.id).sort());
  for (const [, id, content] of cards) {
    const amounts = [...content.matchAll(/data-menu-amount="(\d+)"/g)].map(match => Number(match[1]));
    assert.deepEqual(amounts, [MENUS.find(menu => menu.id === id).price], id);
  }
});

test('every HTML service amount agrees with the banquet extras for its hall', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const groups = [...html.matchAll(/data-service-group="([^"]+)"([\s\S]*?)(?=<div class="service-set"|<a id="services-discuss")/g)];
  const banquet = MENUS.filter(menu => !menu.occasion && menu.extras.length);
  assert.deepEqual(groups.map(([, hall]) => hall).sort(), [...new Set(banquet.map(menu => menu.hall))].sort());
  let serviceCount = 0;
  for (const [, hall, content] of groups) {
    const amounts = [...content.matchAll(/data-menu-amount="(\d+)"/g)].map(match => Number(match[1]));
    serviceCount += amounts.length;
    for (const menu of banquet.filter(menu => menu.hall === hall)) {
      assert.deepEqual(amounts, menu.extras.map(extra => extra.price), `${hall}/${menu.id}`);
    }
  }
  assert.equal([...html.matchAll(/data-menu-amount="/g)].length, MENUS.length + serviceCount);
});
