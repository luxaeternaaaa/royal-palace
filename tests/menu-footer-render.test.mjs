import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MENUS } from '../public/menu-data.mjs';
import { getMenuFooterNotes, getMenuNotes, getMenuTerms } from '../public/menu-locales.mjs';

test('each menu footer preserves localized notes and conditions without repeating service terms', () => {
  for (const locale of ['ru', 'kk', 'en']) for (const menu of MENUS) {
    const notes = getMenuNotes(menu, locale);
    const terms = getMenuTerms(menu, locale).split(' · ').filter(Boolean);
    const footer = getMenuFooterNotes(menu, locale);
    const text = footer.join(' ');
    assert.ok(footer.every(Boolean), `${locale}/${menu.id}: no empty lines`);
    for (const note of notes) assert.equal(footer.filter(line => line === note).length, 1, `${locale}/${menu.id}: ${note}`);
    for (const term of terms) {
      assert.ok(text.includes(term), `${locale}/${menu.id}: ${term}`);
      assert.equal(text.split(term).length - 1, 1, `${locale}/${menu.id}: condition occurs once`);
    }
    assert.equal(footer.at(-1), terms.filter(term => !notes.includes(term)).join(' · '), `${locale}/${menu.id}: compact final line`);
  }
});

test('unknown footer language uses the same Russian fallback as menu content', () => {
  for (const menu of MENUS) assert.deepEqual(getMenuFooterNotes(menu, 'unknown'), getMenuFooterNotes(menu, 'ru'));
});
