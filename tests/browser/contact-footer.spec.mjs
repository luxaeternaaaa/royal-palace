import { test, expect } from '@playwright/test';
import { PAGE_COPY } from '../../public/page-locales.mjs';

async function chooseDesign(page, design) {
  await page.locator('#theme-toggle').click();
  await page.locator(`[data-theme-choice="${design}"]`).click();
}

test.beforeEach(async ({ page, baseURL }) => {
  const localOrigin = new URL(baseURL).origin;
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin === localOrigin) return route.continue();
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Map fixture</title>' });
  });
});

test('the new contacts and map are opt-in and the original designs restore their photograph', async ({ page }) => {
  await page.goto('/?lang=ru');
  const navigation = page.locator('#contact-navigation');
  const map = page.locator('#contact-map');
  const frame = page.locator('#venue-map');
  await expect(navigation).toHaveCount(1);
  await expect(navigation).toBeHidden();
  await expect(map).toBeHidden();
  await expect(frame).not.toHaveAttribute('src');
  await expect(page.locator('#contact-address-label')).toBeHidden();
  await expect(page.locator('#contact-phone-label')).toBeHidden();
  await expect(page.locator('.contact-photo')).toBeVisible();
  await chooseDesign(page, 'emerald');
  await expect(navigation).toBeHidden();
  await expect(map).toBeHidden();
  await expect(frame).not.toHaveAttribute('src');
  await chooseDesign(page, 'emerald-halls');
  await expect(navigation).toBeVisible();
  await expect(map).toBeVisible();
  await expect(page.locator('.contact-photo')).toBeHidden();
  await expect(page.locator('#contact-address-label')).toBeVisible();
  await expect(page.locator('#contact-phone-label')).toBeVisible();
  const mapURL = await frame.getAttribute('data-src');
  expect(mapURL).toBe('https://yandex.ru/map-widget/v1/?mode=search&oid=103994893557&ol=biz&z=16');
  await expect(frame).toHaveAttribute('src', mapURL);
  await expect(frame).toHaveAttribute('loading', 'lazy');
  await expect(frame).toHaveAttribute('title', /\S/);
  await expect(page.locator('#contact-map-route a')).toHaveAttribute('href', 'https://2gis.kz/astana/firm/70000001081186323');
  await page.reload();
  await expect(navigation).toBeVisible();
  await expect(frame).toHaveAttribute('src', mapURL);
  await chooseDesign(page, 'classic');
  await expect(navigation).toBeHidden();
  await expect(map).toBeHidden();
  await expect(frame).not.toHaveAttribute('src');
  await expect(page.locator('.contact-photo')).toBeVisible();
  await expect(page.locator('#contact-address-label')).toBeHidden();
  await expect(page.locator('#contact-phone-label')).toBeHidden();
  await expect(page.locator('.contact-copy > a[href="https://2gis.kz/astana/firm/70000001081186323"]')).toBeVisible();
  await expect(page.locator('.contact-copy .contact-links')).toBeVisible();
});

test('contact navigation and translated labels preserve the enquiry draft', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?lang=ru');
  await page.locator('#guests').fill('137');
  await page.locator('#form-details > summary').click();
  const wishes = 'Сохранить дословно: Қазақша, English, русский';
  await page.locator('#wishes').fill(wishes);
  await chooseDesign(page, 'emerald-halls');
  const navigation = page.locator('#contact-navigation');
  const frame = page.locator('#venue-map');
  const initialMapURL = await frame.getAttribute('src');
  const titles = [];
  for (const locale of ['ru', 'kk', 'en']) {
    await page.locator('#language-select').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const copy = PAGE_COPY[locale];
    await expect(navigation.locator('nav')).toHaveAccessibleName(copy['footer.navAria']);
    await expect(page.locator('.contact-copy .contact-address')).toHaveText(copy['contact.address']);
    await expect(page.locator('.contact-copy .contact-phone')).toHaveAttribute('href', 'tel:+77715790555');
    await expect(page.locator('.contact-copy .contact-phone')).toHaveText(copy['contact.phone']);
    for (const [hash, key] of [['#top', 'nav.home'], ['#halls', 'nav.halls'], ['#menu', 'nav.menu'], ['#services', 'nav.services']]) {
      await expect(navigation.locator(`a[href="${hash}"]`)).toHaveText(copy[key]);
    }
    expect(await navigation.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(['#top', '#halls', '#menu', '#services']);
    await expect(navigation.locator('a[href="https://instagram.com/royal.palace.astana"]')).toHaveAccessibleName(/Instagram/);
    await expect(navigation.locator('a[href="https://wa.me/77715790555"]')).toHaveAccessibleName(/WhatsApp/);
    await expect(page.locator('#contact-address-label')).toHaveText(copy['contact.addressLabel']);
    await expect(page.locator('#contact-phone-label')).toHaveText(copy['contact.phoneLabel']);
    await expect(frame).toHaveAttribute('title', copy['contact.mapTitle']);
    await expect(frame).toHaveAttribute('src', initialMapURL);
    titles.push(await frame.getAttribute('title'));
    await expect(page.locator('#guests')).toHaveValue('137');
    await expect(page.locator('#wishes')).toHaveValue(wishes);
  }
  expect(new Set(titles).size).toBe(3);
  await navigation.locator('a[href="#halls"]').click();
  await expect(page).toHaveURL(/#halls$/);
  await navigation.locator('a[href="#top"]').click();
  await expect(page).toHaveURL(/#top$/);
  await expect(page.locator('#guests')).toHaveValue('137');
  await expect(page.locator('#wishes')).toHaveValue(wishes);
  await chooseDesign(page, 'classic');
  await expect(page.locator('#guests')).toHaveValue('137');
  await expect(page.locator('#wishes')).toHaveValue(wishes);
  expect(errors).toEqual([]);
});

test('contact columns recompose for phones and fit a 320 pixel viewport', async ({ page }, testInfo) => {
  await page.goto('/?lang=ru');
  await chooseDesign(page, 'emerald-halls');
  const geometry = async () => page.locator('#contact-navigation, .contact-copy, #contact-map').evaluateAll(elements => Object.fromEntries(elements.map(element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return [element.id || 'copy', { x, y, width, height }];
  })));
  const boxes = await geometry();
  expect(Object.keys(boxes)).toHaveLength(3);
  const navigation = boxes['contact-navigation'];
  const copy = boxes.copy;
  const map = boxes['contact-map'];
  if (page.viewportSize().width > 760) {
    expect(copy.x).toBeGreaterThanOrEqual(navigation.x + navigation.width);
    expect(map.x).toBeGreaterThanOrEqual(copy.x + copy.width);
  } else {
    const columns = Object.values(boxes);
    expect(Math.max(...columns.map(box => box.x)) - Math.min(...columns.map(box => box.x))).toBeLessThanOrEqual(2);
    expect(map.y).toBeGreaterThanOrEqual(copy.y + copy.height);
    expect(navigation.y).toBeGreaterThanOrEqual(map.y + map.height);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const narrow = Object.values(await geometry());
  expect(Math.max(...narrow.map(box => box.x)) - Math.min(...narrow.map(box => box.x))).toBeLessThanOrEqual(2);
  await page.locator('#contacts').screenshot({ path: testInfo.outputPath('contact-footer-320.png') });
});
