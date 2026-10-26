import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { MENUS } from '../public/menu-data.mjs';
import { getMenuFooterNotes } from '../public/menu-locales.mjs';
import { syncMenuFootnotesHtml, escapeHtml } from '../scripts/menu-design/sync-footnotes.mjs';

const fixture = () => MENUS.map(menu => `<article class="menu-offer"><a class="menu-card" data-menu-id="${menu.id}">card</a><details class="content-disclosure menu-conditions">old</details></article>`).join('\n');

test('replaces disclosures with 21 accessible canonical footnotes and is idempotent', () => {
  const html = syncMenuFootnotesHtml(fixture());
  assert.equal((html.match(/data-menu-footnotes=/g) ?? []).length, MENUS.length);
  for (const menu of MENUS) {
    assert.ok(html.includes(`aria-describedby="menu-notes-${menu.id}"`), menu.id);
    assert.ok(html.includes(`data-menu-footnotes="${menu.id}">${getMenuFooterNotes(menu, 'ru').join(' ')}</p>`), menu.id);
  }
  assert.equal(syncMenuFootnotesHtml(html), html);
  assert.doesNotMatch(html, /menu-conditions|<details/);
});

test('the static page keeps source footnotes accessible without visible conditions disclosures', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/data-menu-footnotes=/g) ?? []).length, MENUS.length);
  assert.doesNotMatch(html, /menu-conditions|data-menu-terms/);
  for (const menu of MENUS) assert.ok(html.includes(`data-menu-footnotes="${menu.id}">${getMenuFooterNotes(menu, 'ru').join(' ')}</p>`), menu.id);
});

test('escapes source footnotes before inserting them into static HTML', () => {
  assert.equal(escapeHtml('<menu & "terms">'), '&lt;menu &amp; &quot;terms&quot;&gt;');
});
