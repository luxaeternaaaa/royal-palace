import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeLocale, intlLocale, preferredLocale, formatDate, numberFormatter } from '../public/i18n.mjs';
import { PAGE_COPY } from '../public/page-locales.mjs';
import { UI_COPY } from '../public/ui-locales.mjs';

test('only supported languages can be selected, and explicit links override the saved choice', () => {
  for (const value of [undefined, null, '', 'constructor', '__proto__', 'en-US', {}, ['kk']]) assert.equal(normalizeLocale(value), 'ru');
  assert.equal(normalizeLocale('kk'), 'kk');
  assert.equal(intlLocale('en'), 'en-GB');
  assert.equal(preferredLocale('', 'kk'), 'kk');
  assert.equal(preferredLocale('?lang=en', 'kk'), 'en');
  assert.equal(preferredLocale('?lang=constructor', 'kk'), 'ru');
});

test('Kazakh calendar names and number grouping work without browser Kazakh Intl data', () => {
  assert.equal(formatDate('2099-12-31', 'kk'), '2099 ж. 31 желтоқсан');
  assert.equal(formatDate('2099-01-01', 'kk'), '2099 ж. 1 қаңтар');
  assert.equal(numberFormatter('kk').resolvedOptions().locale, 'ru-RU');
  assert.equal(numberFormatter('kk').format(5000000).replaceAll('\u00a0', ' '), '5 000 000');
  assert.equal(formatDate('2099-12-31', 'en'), '31 December 2099');
  assert.throws(() => formatDate('not-a-date', 'kk'), RangeError);
});

test('all language catalogues have matching complete keys and interpolation parameters', () => {
  for (const catalogue of [PAGE_COPY, UI_COPY]) {
    const keys = Object.keys(catalogue.ru).sort();
    for (const language of ['ru', 'kk', 'en']) {
      assert.deepEqual(Object.keys(catalogue[language]).sort(), keys, language);
      for (const key of keys) {
        assert.equal(typeof catalogue[language][key], 'string', `${language}:${key}`);
        if (!(catalogue === PAGE_COPY && language === 'kk' && key === 'hero.in')) assert.ok(catalogue[language][key].trim(), `${language}:${key}`);
        assert.deepEqual((catalogue[language][key].match(/\{\w+\}/g) || []).sort(), (catalogue.ru[key].match(/\{\w+\}/g) || []).sort(), `${language}:${key}`);
      }
    }
  }
});

test('every static translation binding resolves in all three languages', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-(?:placeholder|aria-label|alt|title|content))?="([^"]+)"/g)].map(match => match[1]);
  assert.ok(keys.length > 100, 'the page, forms and dialogs must all be localized');
  for (const key of keys) for (const language of ['ru', 'kk', 'en']) assert.ok(Object.hasOwn(PAGE_COPY[language], key), `${language}:${key}`);
});

test('form restructuring keeps unique IDs and valid accessible descriptions', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate IDs can submit a different field than the visitor filled');
  for (const [, references] of html.matchAll(/aria-describedby="([^"]+)"/g)) {
    for (const id of references.split(' ')) assert.ok(ids.includes(id), `missing description: ${id}`);
  }
});
