import { test, expect } from '@playwright/test';
import { PAGE_COPY } from '../../public/page-locales.mjs';

async function chooseDesign(page, choice) {
  await page.locator('#theme-toggle').click();
  await page.locator(`[data-theme-choice="${choice}"]`).click();
}

async function closeHall(page) {
  await page.locator('#gallery-dialog [data-close-dialog]').click();
  await expect(page.locator('#gallery-dialog')).toBeHidden();
}

test('the third design persists with honest photo cards and keeps the existing designs available', async ({ page }, testInfo) => {
  await page.goto('/?lang=ru');
  await expect(page.locator('#theme-toggle')).toBeEnabled();
  await expect(page.locator('#hall-directory')).toBeHidden();
  await chooseDesign(page, 'emerald-halls');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'emerald');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'halls');
  await expect(page.locator('#hall-directory-title')).toHaveText('Залы Royal Palace');
  await expect(page.locator('.hall-directory-card')).toHaveCount(3);
  const mainCard = page.locator('.hall-directory-card').filter({ has: page.locator('[data-hall-view="main"]') });
  await expect(mainCard.locator('img')).toHaveAttribute('src', '/assets/hall-main-centered.webp');
  for (const hall of ['middle', 'small']) {
    const card = page.locator('.hall-directory-card').filter({ has: page.locator(`[data-hall-view="${hall}"]`) });
    await expect(card.locator('img')).toHaveCount(0);
    await expect(card.locator('.hall-photo-placeholder')).toHaveText(PAGE_COPY.ru['halls.noPhoto']);
  }
  const cards = await page.locator('.hall-directory-card').evaluateAll(elements => elements.map(element => {
    const { x, y, width } = element.getBoundingClientRect();
    return { x, y, width };
  }));
  if (page.viewportSize().width > 760) {
    expect(Math.max(...cards.map(card => card.y)) - Math.min(...cards.map(card => card.y))).toBeLessThan(2);
    expect(cards[1].x).toBeGreaterThan(cards[0].x + cards[0].width);
  } else {
    expect(Math.max(...cards.map(card => card.x)) - Math.min(...cards.map(card => card.x))).toBeLessThan(2);
    expect(cards[1].y).toBeGreaterThan(cards[0].y);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#hall-directory').screenshot({ path: testInfo.outputPath('hall-cards-320.png') });
  for (const card of await page.locator('.hall-directory-card').all()) {
    const button = card.locator('[data-hall-view]');
    await expect(button).toHaveAccessibleName(/Смотреть зал/);
    await expect(button.locator('.hall-card-arrow')).toBeVisible();
    const geometry = await card.evaluate(element => {
      const card = element.getBoundingClientRect();
      const button = element.querySelector('button').getBoundingClientRect();
      return { width: Math.abs(card.width - button.width), height: Math.abs(card.height - button.height) };
    });
    expect(geometry.width).toBeLessThanOrEqual(2);
    expect(geometry.height).toBeLessThanOrEqual(2);
    const cover = await card.locator('.hall-card-photo').boundingBox();
    expect(cover.width / cover.height).toBeCloseTo(4 / 3, 2);
  }
  await page.setViewportSize(viewport);
  await expect(page.locator('#legacy-halls')).toBeHidden();
  await expect(page.locator('#gallery-dialog')).toBeHidden();
  await expect(page.locator('#gallery')).toBeHidden();
  await expect(page.locator('.desktop-nav a[href="#gallery"]')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('royal-palace-theme'))).toBe('emerald-halls');
  await page.reload();
  await expect(page.locator('#hall-directory')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'halls');
  await chooseDesign(page, 'classic');
  await expect(page.locator('html')).not.toHaveAttribute('data-layout');
  await expect(page.locator('#legacy-halls')).toBeVisible();
  await expect(page.locator('#hall-directory')).toBeHidden();
  await expect(page.locator('#gallery')).toBeVisible();
  expect(await page.locator('#gallery').evaluate(e => e.parentElement.tagName)).toBe('MAIN');
  await chooseDesign(page, 'emerald');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'emerald');
  await expect(page.locator('html')).not.toHaveAttribute('data-layout');
  await expect(page.locator('#gallery')).toBeVisible();
});

test('hall cards open a native gallery with hall-specific photos and nested video focus', async ({ page }, testInfo) => {
  const errors = [];
  const videos = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().endsWith('.mp4')) videos.push(request.url()); });
  await page.goto('/?lang=ru');
  await chooseDesign(page, 'emerald-halls');
  expect(videos).toEqual([]);
  const main = page.locator('[data-hall-view="main"]');
  await page.locator('.hall-directory-card').filter({ has: main }).click({ position: { x: 16, y: 16 } });
  const dialog = page.locator('#gallery-dialog');
  const image = page.locator('#lightbox-image');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveJSProperty('open', true);
  await expect(page.locator('#hall-detail-title')).toHaveText('Большой зал');
  await expect(page.locator('#hall-detail-capacity')).toContainText('550');
  await expect(main).toHaveAttribute('aria-expanded', 'true');
  await expect(image).toBeVisible();
  await expect(page.locator('#gallery-count')).toHaveText('1 / 4');
  const firstSrc = await image.getAttribute('src');
  const photoSources = new Set();
  for (let index = 0; index < 4; index += 1) {
    await expect(image).toBeVisible();
    const currentSrc = await image.getAttribute('src');
    photoSources.add(currentSrc);
    await page.locator('#gallery-next').click();
    await expect(image).not.toHaveAttribute('src', currentSrc);
  }
  expect(photoSources.size).toBe(4);
  await expect(image).toHaveAttribute('src', firstSrc);
  await page.locator('#gallery-prev').click();
  await page.keyboard.press('ArrowRight');
  await expect(image).toHaveAttribute('src', firstSrc);
  await expect(page.locator('#hall-gallery-videos a[data-video]')).toHaveCount(2);
  await dialog.screenshot({ path: testInfo.outputPath('main-hall-gallery.png') });
  const opener = page.locator('#hall-gallery-videos [data-video="hall-light"]');
  await opener.click();
  await expect(page.locator('#video-dialog')).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(page.locator('#venue-video')).toHaveAttribute('src', /hall-light(?:-mobile)?\.mp4$/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#video-dialog')).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(page.locator('#venue-video')).not.toHaveAttribute('src');
  await expect(opener).toBeFocused();
  await closeHall(page);
  await expect(main).toBeFocused();
  for (const [hall, title] of [['middle', 'Средний зал'], ['small', 'Малый зал']]) {
    const card = page.locator(`[data-hall-view="${hall}"]`);
    await card.click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('#hall-detail-title')).toHaveText(title);
    await expect(image).toBeHidden();
    await expect(image).not.toHaveAttribute('src');
    await expect(page.locator('#gallery-image-message')).toHaveText(PAGE_COPY.ru['halls.noPhoto']);
    await expect(page.locator('#hall-gallery-videos')).toBeHidden();
    await expect(page.locator('#hall-detail-visit')).toBeVisible();
    for (const id of ['gallery-prev', 'gallery-next', 'gallery-zoom']) {
      await expect(page.locator(`#${id}`)).toBeHidden();
      await expect(page.locator(`#${id}`)).toBeDisabled();
    }
    await expect(page.locator('#gallery-original')).toBeHidden();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await expect(image).toBeHidden();
    await expect(page.locator('#gallery-image-message')).toHaveText(PAGE_COPY.ru['halls.noPhoto']);
    await closeHall(page);
    await expect(card).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test('the previous gallery anchor opens the main hall modal in the third design', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('royal-palace-theme', 'emerald-halls'));
  await page.goto('/?lang=ru#gallery');
  await expect(page.locator('#gallery-dialog')).toBeVisible();
  await expect(page.locator('#hall-detail-title')).toHaveText('Большой зал');
  await expect(page.locator('#lightbox-image')).toBeVisible();
  await closeHall(page);
  await expect(page).toHaveURL(/#halls$/);
  await page.evaluate(() => { location.hash = 'gallery'; });
  await expect(page.locator('#gallery-dialog')).toBeVisible();
  await expect(page.locator('#hall-detail-title')).toHaveText('Большой зал');
});

test('hall gallery actions and translated empty states preserve the enquiry draft', async ({ page }) => {
  await page.goto('/?lang=ru');
  await page.locator('#guests').fill('137');
  await page.locator('#form-details > summary').click();
  const wishes = 'Наш текст: Қазақша, English, русский';
  await page.locator('#wishes').fill(wishes);
  await chooseDesign(page, 'emerald-halls');
  for (const locale of ['ru', 'kk', 'en']) {
    await page.locator('#language-select').selectOption(locale);
    await page.locator('[data-hall-view="middle"]').click();
    await expect(page.locator('#hall-detail-title')).toHaveText(PAGE_COPY[locale]['halls.middle']);
    await expect(page.locator('#gallery-image-message')).toHaveText(PAGE_COPY[locale]['halls.noPhoto']);
    await closeHall(page);
  }
  await page.locator('[data-hall-view="middle"]').click();
  await page.locator('#hall-menu').click();
  await expect(page.locator('#gallery-dialog')).toBeHidden();
  await expect(page.locator('[data-menu-filter="middle"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#menu-set-middle')).toBeVisible();
  expect(await page.locator('#menu').evaluate(element => element.contains(document.activeElement))).toBe(true);
  await expect(page.locator('#guests')).toHaveValue('137');
  await expect(page.locator('#wishes')).toHaveValue(wishes);
  await page.locator('[data-hall-view="middle"]').click();
  await page.locator('#hall-enquire').click();
  await expect(page.locator('#gallery-dialog')).toBeHidden();
  await expect(page.locator('#hall')).toHaveValue('middle');
  expect(await page.locator('#enquiry-form').evaluate(element => element.contains(document.activeElement))).toBe(true);
  await expect(page.locator('#wishes')).toHaveValue(wishes);
  await chooseDesign(page, 'classic');
  await expect(page.locator('#guests')).toHaveValue('137');
  await expect(page.locator('#wishes')).toHaveValue(wishes);
});

test('a failed hall cover keeps the card usable and does not break the original gallery', async ({ page }, testInfo) => {
  await page.route('**/assets/hall-main-centered.webp', route => route.abort());
  await page.goto('/?lang=ru');
  await chooseDesign(page, 'emerald-halls');
  const main = page.locator('[data-hall-view="main"]');
  const card = page.locator('.hall-directory-card').filter({ has: main });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('img')).toBeHidden();
  await expect(card.locator('.hall-card-fallback')).toBeVisible();
  await expect(card.locator('.hall-card-fallback')).toHaveText(PAGE_COPY.ru['halls.noPhoto']);
  const cover = await card.locator('.hall-card-photo').boundingBox();
  expect(cover.width / cover.height).toBeCloseTo(4 / 3, 2);
  await card.screenshot({ path: testInfo.outputPath('hall-cover-fallback.png') });
  await page.unroute('**/assets/hall-main-centered.webp');
  await page.locator('[data-hall-view="small"]').click();
  await closeHall(page);
  await main.click();
  await expect(page.locator('#lightbox-image')).toBeVisible();
  await expect(page.locator('#lightbox-image')).toHaveAttribute('src', '/assets/hall-main-centered.webp');
  await expect(page.locator('#gallery-next')).toBeEnabled();
  await expect(page.locator('#gallery-prev')).toBeEnabled();
  await closeHall(page);
  await chooseDesign(page, 'classic');
  await page.locator('#gallery [data-gallery="0"]').click();
  await expect(page.locator('#lightbox-image')).toBeVisible();
  await expect(page.locator('#gallery-zoom')).toBeEnabled();
  await expect(page.locator('#gallery-original')).toBeVisible();
  await expect(page.locator('#gallery-original')).toHaveAttribute('href', '/assets/venue-celebration.jpg');
});
