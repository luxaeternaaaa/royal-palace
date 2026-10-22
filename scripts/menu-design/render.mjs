import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { MENUS } from './menus.mjs';
import { getMenuSections, getMenuNotes } from '../../public/menu-locales.mjs';

const modules = process.argv[2];
if (!modules) throw new Error('Pass the bundled Node node_modules directory. The local preview must be running on port 4173.');
const { chromium } = await import(pathToFileURL(resolve(modules, 'playwright/index.mjs')));
const { default: sharp } = await import(pathToFileURL(resolve(modules, 'sharp/dist/index.mjs')));
const root = resolve(import.meta.dirname, '../..');
const out = resolve(root, 'output/menu-premium/rendered');
await mkdir(out, { recursive: true });
const css = await readFile(resolve(import.meta.dirname, 'sheet.css'), 'utf8');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const money = number => `${new Intl.NumberFormat('ru-RU').format(number)} ₸`;

function sheet(menu, mobile = false) {
  const sourceSections = menu.columns.flat();
  const sourceItems = sourceSections.flatMap(category => category.items);
  const sections = getMenuSections(menu, 'ru');
  const columns = [sections.slice(0, 3), sections.slice(3)];
  assert.equal(columns.flat().flatMap(category => category.items).length, sourceItems.length, `${menu.id}: every dish must remain`);
  const categories = columns.map(column => `<div>${column.map(category => `<section class="category"><h2>${esc(category.title)}</h2><ul>${category.items.map(item => `<li class="dish">${esc(item.name)}</li>`).join('')}</ul></section>`).join('')}</div>`).join('');
  const notes = getMenuNotes(menu, 'ru');
  if (menu.hall === 'memorial') assert.ok(!notes.join(' ').includes('без ограничений'));
  assert.ok(!categories.includes('ingredients'));
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/fonts/fonts.css"><style>${css}</style></head><body>
  <svg width="0" height="0" style="position:absolute"><defs><filter id="brand-gold" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.478431 0 0 0 0 0.325490 0 0 0 0 0.117647 0 0 0 1 0"/></filter></defs></svg>
  <article class="sheet ${menu.hall === 'memorial' ? 'memorial' : ''} ${mobile ? 'mobile' : ''}"><header class="heading"><img src="/assets/royal-palace-menu-logo-original.png" alt="Royal Palace"><h1>${esc(menu.title)}</h1><p class="price">${money(menu.price)}<small>на гостя</small></p></header>
  <div class="columns">${categories}</div><footer class="source-notes"><p>${notes.map(esc).join(' ')}</p></footer></article></body></html>`;
}

assert.equal(MENUS.length, 9);
assert.equal(new Set(MENUS.map(menu => menu.id)).size, 9);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const manifest = [];
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:4173/assets/fonts/fonts.css');
  for (const menu of MENUS) {
    const html = sheet(menu);
    await writeFile(resolve(out, `${menu.id}.html`), html);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.locator('.sheet').evaluate(element => {
      const r = element.getBoundingClientRect();
      return { width: r.width, height: r.height, overflow: element.scrollWidth > element.clientWidth,
        footerBottom: element.querySelector('footer').getBoundingClientRect().bottom - r.top,
        dishes: element.querySelectorAll('.dish').length };
    });
    assert.equal(geometry.dishes, menu.columns.flat().flatMap(category => category.items).length);
    assert.ok(!geometry.overflow && geometry.footerBottom <= geometry.height, `${menu.id}: content must fit`);
    assert.ok(geometry.height / geometry.width <= 1.85, `${menu.id}: avoid a long narrow strip`);
    assert.ok(!html.includes('class="ingredients"') && !html.includes('class="conditions"'));
    const png = await page.locator('.sheet').screenshot();
    await writeFile(resolve(out, `${menu.id}.png`), png);
    const full = await sharp(png).webp({ lossless: true }).toBuffer();
    const preview = await sharp(png).resize({ width: 800 }).webp({ quality: 94, effort: 6 }).toBuffer();
    await writeFile(resolve(out, `${menu.id}.webp`), full);
    await writeFile(resolve(out, `${menu.id}-preview.webp`), preview);
    manifest.push({ id: menu.id, width: Math.round(geometry.width * 2), height: Math.round(geometry.height * 2),
      previewWidth: 800, previewHeight: Math.round(geometry.height * 2 / 3), fullBytes: full.length,
      previewBytes: preview.length, dishes: geometry.dishes });
    const mobileHtml = sheet(menu, true);
    await writeFile(resolve(out, `${menu.id}-mobile.html`), mobileHtml);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.setContent(mobileHtml, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const mobileGeometry = await page.locator('.sheet').evaluate(element => ({
      width: element.clientWidth, height: element.clientHeight, scrollWidth: element.scrollWidth,
      dishSize: parseFloat(getComputedStyle(element.querySelector('.dish')).fontSize),
    }));
    assert.equal(mobileGeometry.width, mobileGeometry.scrollWidth, `${menu.id}: mobile content must fit`);
    assert.ok(mobileGeometry.dishSize >= 18, `${menu.id}: mobile dishes must be readable`);
    const mobilePng = await page.locator('.sheet').screenshot();
    await writeFile(resolve(out, `${menu.id}-mobile.png`), mobilePng);
    const mobileImage = await sharp(mobilePng).webp({ lossless: true }).toBuffer();
    await writeFile(resolve(out, `${menu.id}-mobile.webp`), mobileImage);
    Object.assign(manifest.at(-1), { mobileWidth: 640, mobileHeight: mobileGeometry.height * 2, mobileBytes: mobileImage.length });
    await page.setViewportSize({ width: 1200, height: 2000 });
    console.log(`${menu.id}: ${manifest.at(-1).width}×${manifest.at(-1).height}, ${full.length}B / ${preview.length}B`);
  }
} finally { await browser.close(); }
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
