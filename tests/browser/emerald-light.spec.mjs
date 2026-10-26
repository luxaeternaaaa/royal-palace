import { test, expect } from '@playwright/test';

async function chooseDesign(page, design) {
  await page.locator('#theme-toggle').click();
  await page.locator(`[data-theme-choice="${design}"]`).click();
  if (design === 'classic') await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  else await expect(page.locator('html')).toHaveAttribute('data-theme', 'emerald');
  if (design === 'emerald-halls') await expect(page.locator('html')).toHaveAttribute('data-layout', 'halls');
  else await expect(page.locator('html')).not.toHaveAttribute('data-layout');
}

async function surfaceStyles(page) {
  return page.evaluate(() => Object.fromEntries(
    ['body', '#halls', '#menu', '#services', '#enquiry', '#faq', '#contacts', '.site-footer'].map(selector => {
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      let background = style.backgroundColor;
      for (let parent = element.parentElement; background === 'rgba(0, 0, 0, 0)' && parent; parent = parent.parentElement) {
        background = getComputedStyle(parent).backgroundColor;
      }
      return [selector, { background, color: style.color, font: style.fontFamily }];
    }),
  ));
}

test('Emerald II has white reading sections and reference typography while legacy designs and input survive switching', async ({ page }) => {
  await page.goto('/?lang=ru');
  await expect(page.locator('#theme-toggle')).toBeEnabled();
  await page.locator('#guests').fill('137');
  await page.locator('#form-details > summary').click();
  const wishes = 'Наши пожелания: Қазақша, English, русский';
  await page.locator('#wishes').fill(wishes);

  const original = {};
  for (const design of ['classic', 'emerald']) {
    await chooseDesign(page, design);
    await expect(page.locator('body')).toHaveCSS('background-color', design === 'classic' ? 'rgb(251, 249, 244)' : 'rgb(6, 71, 52)');
    original[design] = await surfaceStyles(page);
    expect(original[design].body.background).toBe(design === 'classic' ? 'rgb(251, 249, 244)' : 'rgb(6, 71, 52)');
    expect(original[design].body.font).toContain('Golos Text');
  }

  await chooseDesign(page, 'emerald-halls');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'halls');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const light = await surfaceStyles(page);
  for (const selector of ['body', '#menu', '#services', '#enquiry', '#faq']) {
    expect(light[selector].background, `${selector} must be white in Emerald II`).toBe('rgb(255, 255, 255)');
  }
  for (const selector of ['#halls', '#contacts', '.site-footer']) {
    expect(light[selector].background, `${selector} must retain the emerald surface`).toBe('rgb(6, 71, 52)');
  }
  expect(light.body.font).toContain('Inter');
  const mobile = page.viewportSize().width <= 760;
  await expect(page.locator('#hero-title')).toHaveCSS('font-family', /Forum/);
  await expect(page.locator('#hero-title')).toHaveCSS('font-size', mobile ? '60px' : '120px');
  await expect(page.locator('#hero-title')).toHaveCSS('line-height', mobile ? '60px' : '120px');
  for (const selector of ['#hall-directory-title', '#menu-title', '#services-title', '#enquiry-title', '#faq-title']) {
    await expect(page.locator(selector)).toHaveCSS('font-family', /Forum/);
    await expect(page.locator(selector)).toHaveCSS('font-size', mobile ? '32px' : '60px');
    await expect(page.locator(selector)).toHaveCSS('line-height', mobile ? '42px' : '78px');
  }
  await expect(page.locator('#header')).toHaveCSS('height', mobile ? '88px' : '104px');
  await expect(page.locator('#header')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('#guests')).toHaveValue('137');
  await expect(page.locator('#wishes')).toHaveValue(wishes);

  for (const design of ['emerald', 'classic']) {
    await chooseDesign(page, design);
    await expect(page.locator('html')).not.toHaveAttribute('data-layout');
    expect(await surfaceStyles(page)).toEqual(original[design]);
    await expect(page.locator('#guests')).toHaveValue('137');
    await expect(page.locator('#wishes')).toHaveValue(wishes);
  }
});
