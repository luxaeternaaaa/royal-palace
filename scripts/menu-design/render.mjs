import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { MENUS } from './menus.mjs';
import { getMenuSections, getMenuFooterNotes, getMenuTitle, getMenuAsset, getMenuCollection } from '../../public/menu-locales.mjs';
import { PAGE_COPY } from '../../public/page-locales.mjs';

const modules = process.argv[2];
if (!modules) throw new Error('Pass the bundled Node node_modules directory. The local preview must be running on port 4173.');
const { chromium } = await import(pathToFileURL(resolve(modules, 'playwright/index.mjs')));
const { default: sharp } = await import(pathToFileURL(resolve(modules, 'sharp/dist/index.mjs')));
const root = resolve(import.meta.dirname, '../..');
const out = resolve(root, 'output/menu-premium/rendered');
await mkdir(out, { recursive: true });
const css = await readFile(resolve(import.meta.dirname, 'sheet.css'), 'utf8');
const papers = [...new Set(MENUS.map(menu => menu.paper ?? menu.hall))];
const textures = Object.fromEntries(await Promise.all(papers.map(async paper =>
  [paper, (await readFile(resolve(import.meta.dirname, 'textures', `${paper}.webp`))).toString('base64')])));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const locales = ['ru', 'kk', 'en'];
const money = (number, locale) => `${new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'ru-RU').format(number)} ₸`;

function sheet(menu, locale, mobile = false, minHeight = 0) {
  const paper = menu.paper ?? menu.hall;
  const sourceSections = menu.columns.flat();
  const sourceItems = sourceSections.flatMap(category => category.items);
  const sections = getMenuSections(menu, locale);
  const columns = [sections.slice(0, 3), sections.slice(3)];
  assert.equal(columns.flat().flatMap(category => category.items).length, sourceItems.length, `${menu.id}: every dish must remain`);
  const categories = columns.map(column => `<div>${column.map(category => `<section class="category"><h2>${esc(category.title)}</h2><ul>${category.items.map(item => `<li class="dish">${esc(item.name)}</li>`).join('')}</ul></section>`).join('')}</div>`).join('');
  const notes = getMenuFooterNotes(menu, locale);
  assert.ok(!categories.includes('ingredients'));
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/fonts/fonts.css"><style>${css}\n.sheet { ${minHeight ? `min-height: ${minHeight}px;` : ''} background-image: ${paper === 'graduation' ? 'linear-gradient(#00000047, #00000047), ' : ''}url("data:image/webp;base64,${textures[paper]}"); background-size: cover; background-position: center; }</style></head><body>
  <svg width="0" height="0" style="position:absolute"><defs><filter id="brand-gold" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.541176 0 0 0 0 0.415686 0 0 0 0 0.219608 0 0 0 1 0"/></filter></defs></svg>
  <article data-hall="${menu.hall ?? ''}" data-paper="${paper}" class="sheet ${menu.hall === 'memorial' ? 'memorial' : ''} ${mobile ? 'mobile' : ''}"><header class="heading"><img src="/assets/royal-palace-menu-logo-original.png" alt="Royal Palace"><h1>${esc(getMenuTitle(menu, locale))}</h1><p class="price">${money(menu.price, locale)}<small>${esc(PAGE_COPY[locale]['menu.perGuest'])}</small></p></header>
  <div class="columns">${categories}</div><footer class="source-notes"><p>${notes.map(esc).join(' ')}</p></footer></article></body></html>`;
}

assert.ok(MENUS.length);
assert.equal(new Set(MENUS.map(menu => menu.id)).size, MENUS.length);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const manifest = [];
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:4173/assets/fonts/fonts.css');
  for (const locale of locales) {
    // Translations must fit without shrinking type or staggering adjacent offers.
    const heights = new Map();
    for (const menu of MENUS) {
      await page.setContent(sheet(menu, locale), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const height = await page.locator('.sheet').evaluate(element => Math.ceil(element.getBoundingClientRect().height));
      const collection = getMenuCollection(menu);
      heights.set(collection, Math.max(heights.get(collection) ?? 0, height));
    }
    for (const menu of MENUS) {
    const localizedOut = locale === 'ru' ? out : resolve(out, locale);
    await mkdir(localizedOut, { recursive: true });
    const html = sheet(menu, locale, false, heights.get(getMenuCollection(menu)));
    await writeFile(resolve(localizedOut, `${menu.id}.html`), html);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.locator('.sheet').evaluate(element => {
      const r = element.getBoundingClientRect();
      return { width: r.width, height: r.height, overflow: element.scrollWidth > element.clientWidth,
        dishOverflow: [...element.querySelectorAll('.dish')].some(dish => dish.scrollWidth > dish.clientWidth),
        footerBottom: element.querySelector('footer').getBoundingClientRect().bottom - r.top,
        dishes: element.querySelectorAll('.dish').length };
    });
    assert.equal(geometry.dishes, menu.columns.flat().flatMap(category => category.items).length);
    assert.ok(!geometry.overflow && !geometry.dishOverflow && geometry.footerBottom <= geometry.height, `${locale}/${menu.id}: content must fit`);
    assert.ok(geometry.height / geometry.width <= 1.85, `${locale}/${menu.id}: avoid a long narrow strip`);
    assert.ok(!html.includes('class="ingredients"') && !html.includes('class="conditions"'));
    const png = await page.locator('.sheet').screenshot();
    await writeFile(resolve(localizedOut, `${menu.id}.png`), png);
    const full = await sharp(png).webp({ quality: 95, effort: 6 }).toBuffer();
    const preview = await sharp(png).resize({ width: 800 }).webp({ quality: 94, effort: 6 }).toBuffer();
    await writeFile(resolve(localizedOut, `${menu.id}.webp`), full);
    await writeFile(resolve(localizedOut, `${menu.id}-preview.webp`), preview);
    manifest.push({ id: menu.id, locale, width: Math.round(geometry.width * 2), height: Math.round(geometry.height * 2),
      previewWidth: 800, previewHeight: Math.round(geometry.height * 2 / 3), fullBytes: full.length,
      previewBytes: preview.length, dishes: geometry.dishes });
    const mobileHtml = sheet(menu, locale, true);
    await writeFile(resolve(localizedOut, `${menu.id}-mobile.html`), mobileHtml);
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
    await writeFile(resolve(localizedOut, `${menu.id}-mobile.png`), mobilePng);
    if (locale === 'ru') {
      const mobileImage = await sharp(mobilePng).webp({ lossless: true }).toBuffer();
      await writeFile(resolve(localizedOut, `${menu.id}-mobile.webp`), mobileImage);
      Object.assign(manifest.at(-1), { mobileWidth: 640, mobileHeight: mobileGeometry.height * 2, mobileBytes: mobileImage.length });
    }
    await page.setViewportSize({ width: 1200, height: 2000 });
    console.log(`${locale}/${menu.id}: ${manifest.at(-1).width}×${manifest.at(-1).height}, ${full.length}B / ${preview.length}B`);
    }
  }
} finally { await browser.close(); }
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
assert.equal(manifest.length, MENUS.length * locales.length);
for (const locale of locales) {
  const localizedOut = locale === 'ru' ? out : resolve(out, locale);
  const thumbnails = await Promise.all(MENUS.map(async (menu, index) => ({
    input: await sharp(resolve(localizedOut, `${menu.id}.png`)).resize({ width: 380, height: 550, fit: 'contain', background: '#fbf9f4' }).png().toBuffer(),
    left: index % 3 * 400 + 10, top: Math.floor(index / 3) * 570 + 10,
  })));
  await sharp({ create: { width: 1200, height: Math.ceil(MENUS.length / 3) * 570, channels: 3, background: '#e0dbd1' } }).composite(thumbnails).png().toFile(resolve(out, `proof-${locale}.png`));
}
// Publish only after every localized sheet has passed the same geometry checks.
for (const entry of manifest) {
  const menu = MENUS.find(menu => menu.id === entry.id);
  const localizedOut = entry.locale === 'ru' ? out : resolve(out, entry.locale);
  for (const variant of ['full', 'preview']) {
    const filename = `${entry.id}${variant === 'preview' ? '-preview' : ''}.webp`;
    const destination = resolve(root, 'public', getMenuAsset(menu, entry.locale, variant).slice(1));
    await mkdir(resolve(destination, '..'), { recursive: true });
    await writeFile(destination, await readFile(resolve(localizedOut, filename)));
  }
  if (entry.locale === 'ru') await writeFile(resolve(root, `public/assets/menus/${entry.id}-mobile.webp`), await readFile(resolve(localizedOut, `${entry.id}-mobile.webp`)));
}
