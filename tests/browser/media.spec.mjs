import {test,expect} from '@playwright/test';
import {VIDEOS} from '../../public/media-data.mjs';

test('responsive images and video load the intended asset only when needed',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('/?lang=ru');
 const mobile=page.viewportSize().width<=1000;
 await expect(page.locator('#language-select')).toBeEnabled();
 const hero=await page.locator('.hero-image:visible').evaluate(e=>e.currentSrc);
 expect(hero).toContain(mobile?'/assets/hero-mobile-':'/assets/venue-hero-restored-');
 expect(requests.filter(url=>url.endsWith('.mp4'))).toEqual([]);
 expect(requests.some(url=>url.endsWith('/menu-crest.webp'))).toBe(false);
 const link=page.locator('.menu-set:not([hidden]) [data-video-menu="main-30000"]');
 await link.click();
 await expect(page.locator('#venue-video')).toHaveAttribute('src',mobile?VIDEOS['food-classic'].mobileSrc:VIDEOS['food-classic'].src);
 await expect(page.locator('#video-original')).toHaveAttribute('href',VIDEOS['food-classic'].src);
 await page.keyboard.press('Escape');
 await expect(link).toBeFocused();
 await expect(page.locator('#venue-video')).not.toHaveAttribute('src');
});

test('only Emerald II uses the full-screen hero and design changes preserve the enquiry draft',async({page})=>{
 await page.goto('/?lang=ru');
 await expect(page.locator('#language-select')).toBeEnabled();
 await page.locator('#guests').fill('137');
 const mobile=page.viewportSize().width<=760;
 for(const choice of ['classic','emerald','emerald-halls','classic']) {
  await page.evaluate(()=>scrollTo(0,0));
  await page.locator('#theme-toggle').click();
  await page.locator(`[data-theme-choice="${choice}"]`).click();
  await expect(page.locator('h1:visible')).toHaveCount(1);
  await expect(page.locator('#guests')).toHaveValue('137');
  const hallLayout=choice==='emerald-halls';
  if(hallLayout) await expect(page.locator('html')).toHaveAttribute('data-layout','halls');
  else await expect(page.locator('html')).not.toHaveAttribute('data-layout');
  await expect.poll(()=>page.locator('.hero-image:visible').evaluate(image=>image.currentSrc))
   .toContain(hallLayout?'/assets/hero-centered-':mobile?'/assets/hero-mobile-':'/assets/venue-hero-restored-');
  const framing=await page.locator('.hero-image:visible').evaluate(image=>({
   position:getComputedStyle(image).objectPosition,
   rotate:getComputedStyle(image).rotate,
   scale:getComputedStyle(image).scale,
   top:document.querySelector('#home').getBoundingClientRect().top,
   height:document.querySelector('#home').getBoundingClientRect().height,
   viewport:innerHeight,
   headerHeight:document.querySelector('#header').getBoundingClientRect().height,
  }));
  if(hallLayout) {
   await expect(page.locator('#hero-title')).toHaveText('Royal Palace',{useInnerText:true});
   expect(framing.position).toBe('50% 50%');
   expect(framing.rotate).toBe('none');
   expect(framing.scale).toBe('none');
   expect(framing.top).toBe(0);
   expect(framing.height).toBeGreaterThanOrEqual(framing.viewport);
   if(mobile) expect(framing.headerHeight).toBe(88);
   await expect(page.locator('.hero-address:visible')).toHaveCount(0);
   await expect(page.locator('.brand-type:visible')).toHaveCount(0);
  } else {
   await expect(page.locator('#hero-title')).toHaveText(/Банкетный ресторан\s+в\s+Астане/,{useInnerText:true});
   expect(framing.top).toBe(framing.headerHeight);
   if(mobile) expect(framing.headerHeight).toBe(72);
   await expect(page.locator('.hero-address')).toBeVisible();
   await expect(page.locator('.brand-type')).toBeVisible();
  }
 }
});
