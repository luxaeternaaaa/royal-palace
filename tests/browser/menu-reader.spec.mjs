import { test, expect } from '@playwright/test';
import { composeMenuMessage } from '../../public/planner.mjs';
import { PAGE_COPY } from '../../public/page-locales.mjs';
import {MENUS} from '../../public/menu-data.mjs';
import {getMenuFooterNotes} from '../../public/menu-locales.mjs';

for (const locale of ['ru', 'kk', 'en']) {
  test(`New Year reader keeps its collection and selected offer in the message (${locale})`, async ({ page, baseURL }) => {
    const externalRequests = [];
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin === new URL(baseURL).origin) return route.continue();
      externalRequests.push(route.request().url());
      return route.abort();
    });
    await page.goto('/?lang=ru');
    await page.locator('#guests').fill('123');
    await page.locator('#form-details > summary').click();
    const wishes = 'Не переводить: Қазақша, English, русский <b>текст</b>';
    await page.locator('#wishes').fill(wishes);
    await page.locator('#language-select').selectOption(locale);
    await page.locator('#menu-kind').selectOption('newyear');
    await page.locator('[data-menu-filter="main"]').click();
    const opener = page.locator('[data-menu-id="newyear-main-45000"]');
    await opener.click();
    await expect(page.locator('#menu-viewer')).toBeVisible();
    await expect(page.locator('.menu-conditions')).toHaveCount(0);
    await expect(opener).toHaveAccessibleDescription(getMenuFooterNotes(MENUS.find(menu=>menu.id==='newyear-main-45000'),locale).join(' '));
    await expect(page.locator('#menu-reader-notes')).toHaveText(getMenuFooterNotes(MENUS.find(menu=>menu.id==='newyear-main-45000'),locale).join(' '));
    await expect(page.locator('#menu-viewer-title')).toContainText(PAGE_COPY[locale]['menu.newyear']);
    const prices = page.locator('#menu-viewer-prices button');
    await expect(prices).toHaveCount(3);
    expect(await prices.evaluateAll(buttons => buttons.map(button => button.dataset.menuOffer))).toEqual([
      'newyear-main-45000', 'newyear-main-55000', 'newyear-main-60000',
    ]);
    await expect(prices).toHaveText(locale === 'en'
      ? ['45,000 ₸', '55,000 ₸', '60,000 ₸']
      : ['45 000 ₸', '55 000 ₸', '60 000 ₸']);
    await page.locator('[data-menu-offer="newyear-main-55000"]').click();
    await expect(page.locator('[data-menu-offer="newyear-main-55000"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#menu-reader-notes')).toHaveText(getMenuFooterNotes(MENUS.find(menu=>menu.id==='newyear-main-55000'),locale).join(' '));
    expect(await page.locator('#menu-reader-notes').evaluate(e=>e.previousElementSibling.id)).toBe('menu-reader-sections');
    await page.locator('#menu-reader-discuss').click();
    const expectedMessage = composeMenuMessage('newyear-main-55000', locale);
    await expect(page.locator('#message-preview')).toHaveText(expectedMessage);
    const whatsapp = new URL(await page.locator('#whatsapp-send').getAttribute('href'));
    expect(whatsapp.searchParams.get('text')).toBe(expectedMessage);
    await page.keyboard.press('Escape');
    await expect(page.locator('#message-dialog')).not.toBeVisible();
    await expect(page.locator('#menu-reader-discuss')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu-viewer')).not.toBeVisible();
    await expect(opener).toBeFocused();
    await expect(page.locator('#guests')).toHaveValue('123');
    await expect(page.locator('#wishes')).toHaveValue(wishes);
    expect(externalRequests).toEqual([]);
  });
}
