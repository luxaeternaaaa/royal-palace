import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('mobile header stays in place and native navigation works while app.js is delayed', async ({ page }, testInfo) => {
  let releaseApp;
  let markRequested;
  const appGate = new Promise(resolve => { releaseApp = resolve; });
  const appRequested = new Promise(resolve => { markRequested = resolve; });
  await page.route('**/app.js', async route => {
    markRequested();
    await appGate;
    await route.continue();
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/?lang=ru', { waitUntil: 'commit' });
    await appRequested;
    await expect(page.locator('#header')).toHaveCSS('height', '88px');
    await page.evaluate(() => document.fonts.ready);
    const before = await page.evaluate(() => ({
      heroTop: document.querySelector('#home').getBoundingClientRect().top + scrollY,
      headerHeight: document.querySelector('#header').getBoundingClientRect().height,
    }));
    await expect(page.locator('#language-select')).toBeDisabled();
    await expect(page.locator('#theme-toggle')).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath('delayed-before-app.png') });
    const toggle = page.locator('.menu-toggle');
    await toggle.click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.locator('#mobile-nav a[href="#menu"]').click();
    await expect(page).toHaveURL(/#menu$/);
    await toggle.click();
    await page.evaluate(() => { history.replaceState(null, '', '/?lang=ru'); scrollTo(0, 0); });
    releaseApp();
    await expect(page.locator('#language-select')).toBeEnabled();
    const after = await page.evaluate(() => ({
      heroTop: document.querySelector('#home').getBoundingClientRect().top + scrollY,
      headerHeight: document.querySelector('#header').getBoundingClientRect().height,
    }));
    expect(Math.abs(after.heroTop - before.heroTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.headerHeight - before.headerHeight)).toBeLessThanOrEqual(1);
    const geometry = testInfo.outputPath('header-geometry.json');
    await writeFile(geometry, JSON.stringify({ before, after }, null, 2));
    await testInfo.attach('header-geometry', { path: geometry, contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath('delayed-after-app.png') });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('aria-label', 'Закрыть меню');
    await page.locator('#mobile-nav a').first().focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).not.toBeVisible();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(errors).toEqual([]);
  } finally {
    releaseApp();
  }
});

test('mobile native menu and section links work with JavaScript disabled', async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#language-select')).toBeDisabled();
    await expect(page.locator('#theme-toggle')).toBeDisabled();
    await expect(page.locator('#mobile-nav')).not.toBeVisible();
    await page.locator('.menu-toggle').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('nojs-open-menu.png') });
    await page.locator('#mobile-nav a[href="#menu"]').click();
    await expect(page).toHaveURL(/#menu$/);
    await expect(page.locator('#menu')).toBeInViewport();
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#mobile-nav')).not.toBeVisible();
  } finally {
    await context.close();
  }
});
