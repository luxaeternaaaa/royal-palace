import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { MENUS } from '../public/menu-data.mjs';
import { VIDEOS, MENU_VIDEOS } from '../public/media-data.mjs';
import { composeMenuMessage } from '../public/planner.mjs';
import { getMenuSections, getMenuTerms, getMenuNotes } from '../public/menu-locales.mjs';

test('brother’s four food videos map to the confirmed hall prices', () => {
  const tiers = {
    'food-classic': ['main-30000', 'middle-27000', 'small-27000'],
    'food-mid': ['main-35000', 'middle-32000', 'small-32000'],
    'food-high': ['main-40000', 'small-38000'],
    'food-memorial': ['as-beru-16000'],
  };
  assert.equal(Object.keys(MENU_VIDEOS).length, 9);
  for (const [video, ids] of Object.entries(tiers)) for (const id of ids) assert.equal(MENU_VIDEOS[id], video);
  for (const menu of MENUS.filter(menu => Object.hasOwn(MENU_VIDEOS, menu.id))) assert.ok(VIDEOS[MENU_VIDEOS[menu.id]]);
  assert.equal(Object.keys(VIDEOS).length, 6);
  for (const [id, video] of Object.entries(VIDEOS)) {
    assert.equal(video.src, `/assets/videos/${id}.mp4`);
    assert.equal(video.mobileSrc, `/assets/videos/${id}-mobile.mp4`);
    assert.equal(video.poster, `/assets/videos/${id}.webp`);
  }
});

test('all six complete mobile derivatives remain less than half the original transfer size', async () => {
  for (const [id, video] of Object.entries(VIDEOS)) {
    const source = await stat(new URL(`../public${video.src}`, import.meta.url));
    const mobile = await stat(new URL(`../public${video.mobileSrc}`, import.meta.url));
    assert.ok(mobile.size > 100_000 && mobile.size < source.size / 2, id);
  }
});

test('owner-confirmed middle 38k shares dishes with small 38k without inheriting its guest limits or equipment', () => {
  const middle = MENUS.find(menu => menu.id === 'middle-38000');
  const small = MENUS.find(menu => menu.id === 'small-38000');
  assert.equal(MENUS.filter(menu => !menu.occasion).length, 10);
  assert.equal(MENU_VIDEOS[middle.id], undefined);
  assert.equal(middle.guests, '');
  assert.equal(middle.days, '');
  assert.deepEqual(middle.extras.map(extra => extra.price), [400000, 300000]);
  for (const locale of ['ru', 'kk', 'en']) {
    assert.deepEqual(getMenuSections(middle, locale), getMenuSections(small, locale));
    assert.deepEqual(getMenuNotes(middle, locale), getMenuNotes(small, locale));
    const message = composeMenuMessage('middle-38000', locale);
    assert.match(message, /38[\s,]000/);
    assert.ok(message.includes(getMenuTerms(middle, locale)));
    assert.notEqual(getMenuTerms(middle, locale), getMenuTerms(small, locale));
    assert.doesNotMatch(message, /undefined|null|\b144\b|Понедельник|Thursday|Бешбармак|Beshbarmak/);
  }
});

test('native video links preserve the exact menu mapping and do not preload media', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const links = [...html.matchAll(/<a\b[^>]*data-video="([^"]+)"[^>]*>/g)].map(match => match[0]);
  for (const [id, video] of Object.entries(MENU_VIDEOS)) {
    const link = links.find(tag => tag.includes(`data-video-menu="${id}"`));
    assert.ok(link, id);
    assert.ok(link.includes(`data-video="${video}"`) && link.includes(`href="${VIDEOS[video].src}"`), id);
  }
  const player = html.match(/<video\b[^>]*>/)[0];
  assert.match(player, /\bcontrols\b/);
  assert.match(player, /\bplaysinline\b/);
  assert.match(player, /preload="none"/);
  assert.doesNotMatch(player, /\bsrc=|\bautoplay\b/);
  assert.match(html, /data-menu-id="middle-38000"/);
  assert.doesNotMatch(html, /data-video-menu="middle-38000"|data-i18n="hero.description"/);
});

test('enhanced video keeps native fallback and labelled keyboard controls', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="video-controls"[^>]*hidden/);
  assert.match(html, /<button[^>]*id="video-toggle"[^>]*data-i18n-aria-label="media.play"/);
  assert.match(html, /<button[^>]*id="video-mute"[^>]*data-i18n-aria-label="media.mute"/);
  assert.match(html, /<input[^>]*id="video-seek"[^>]*type="range"[^>]*data-i18n-aria-label="media.seek"/);
  assert.match(html, /id="video-original"[^>]*href="\/assets\/videos\/food-classic.mp4"/);
});
