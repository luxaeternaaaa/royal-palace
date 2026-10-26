import {test,expect} from '@playwright/test';
import {VIDEOS} from '../../public/media-data.mjs';

test('responsive images and video load the intended asset only when needed',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('/?lang=ru');
 const mobile=page.viewportSize().width<=1000;
 await expect(page.locator('#language-select')).toBeEnabled();
 const hero=await page.locator('.hero-image').evaluate(e=>e.currentSrc);
 expect(hero).toContain('/assets/hero-centered-');
 const framing=await page.locator('.hero-image').evaluate(image=>({position:getComputedStyle(image).objectPosition,rotate:getComputedStyle(image).rotate,scale:getComputedStyle(image).scale,top:document.querySelector('#home').getBoundingClientRect().top,height:document.querySelector('#home').getBoundingClientRect().height,viewport:innerHeight}));
 expect(framing.position).toBe('50% 50%');
 expect(framing.rotate).toBe('none');
 expect(framing.scale).toBe('none');
 expect(framing.top).toBe(0);
 expect(framing.height).toBeGreaterThanOrEqual(framing.viewport);
 expect(requests.filter(url=>/hero-centered-.*\.(avif|webp)$/.test(url))).toHaveLength(1);
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
