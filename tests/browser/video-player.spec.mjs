import {test,expect} from '@playwright/test';
import {PAGE_COPY} from '../../public/page-locales.mjs';
import {readFile} from 'node:fs/promises';

async function openVideo(page) {
  await page.goto('/?lang=ru');
  const opener=page.locator('a[data-video="hall-light"]').first();
  await opener.click();
  await expect(page.locator('#video-dialog')).toBeVisible();
  return opener;
}

async function landscapeFixture(page) {
  const fixture=await readFile(new URL('../fixtures/landscape.mp4',import.meta.url));
  const dataUrl=`data:video/mp4;base64,${fixture.toString('base64')}`;
  await page.route('**/media-data.mjs',async route=>{
    const response=await route.fetch();
    const body=(await response.text()).replaceAll('/assets/videos/hall-light.mp4',dataUrl).replaceAll('/assets/videos/hall-light-mobile.mp4',dataUrl);
    await route.fulfill({response,body});
  });
}

test('video frame adapts without cropping and volume supports keyboard, mute and reopen',async({page})=>{
  const opener=await openVideo(page);
  const ratio=await page.locator('.video-stage').evaluate(e=>e.clientWidth/e.clientHeight);
  expect(ratio).toBeCloseTo(page.viewportSize().width>1000?16/9:9/16,2);
  await expect(page.locator('#venue-video')).toHaveCSS('object-fit','contain');
  await expect.poll(()=>page.locator('#venue-video').evaluate(e=>!e.paused&&e.currentTime>0)).toBe(true);
  const volume=page.locator('#video-volume');
  await expect(volume).toBeVisible();
  await volume.focus();
  await volume.press('Home');
  for(let i=0;i<7;i++)await volume.press('ArrowRight');
  await expect.poll(()=>page.locator('#venue-video').evaluate(e=>Math.round(e.volume*100))).toBe(35);
  await page.locator('#video-mute').click();
  await expect(volume).toHaveValue('0');
  await page.locator('#video-mute').click();
  await expect(volume).toHaveValue('0.35');
  await volume.press('Home');
  await page.locator('#video-mute').click();
  await expect(volume).toHaveValue('0.35');
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect(page.locator('#venue-video')).not.toHaveAttribute('src');
  await opener.click();
  await expect(volume).toHaveValue('0.35');
  await volume.focus();await volume.press('End');
  await expect.poll(()=>page.locator('#venue-video').evaluate(e=>e.volume)).toBe(1);
  for(const lang of ['kk','en','ru']) {
    await page.keyboard.press('Escape');
    await page.locator('#language-select').selectOption(lang);
    await opener.click();
    await expect(volume).toHaveAttribute('aria-label',PAGE_COPY[lang]['media.volume']);
    await expect(volume).toHaveValue('1');
  }
});

test('read-only device volume uses an honest fallback while mute still works',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(HTMLMediaElement.prototype,'volume',{configurable:true,get(){return 1;},set(){}}));
  await openVideo(page);
  await expect(page.locator('#video-volume')).toBeHidden();
  await expect(page.locator('#video-device-volume')).toBeVisible();
  await expect(page.locator('#video-device-volume')).toHaveText(PAGE_COPY.ru['media.deviceVolume']);
  await page.locator('#video-mute').click();
  expect(await page.locator('#venue-video').evaluate(e=>e.muted)).toBe(true);
  await page.locator('#video-mute').click();
  expect(await page.locator('#venue-video').evaluate(e=>e.muted)).toBe(false);
});

test('blocked playback leaves manual play available without a false loading error',async({page})=>{
  await page.addInitScript(()=>{
    window.nativeVideoPlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('User gesture required','NotAllowedError'));};
  });
  await openVideo(page);
  await expect(page.locator('#video-error')).toBeHidden();
  await expect(page.locator('#video-toggle')).toHaveAttribute('aria-label',PAGE_COPY.ru['media.play']);
  await page.evaluate(()=>HTMLMediaElement.prototype.play=window.nativeVideoPlay);
  await page.locator('#video-toggle').click();
  await expect.poll(()=>page.locator('#venue-video').evaluate(e=>!e.paused&&e.currentTime>0)).toBe(true);
});

test('native landscape video fills its own frame on desktop and phone without cropping',async({page})=>{
  await landscapeFixture(page);
  await openVideo(page);
  await expect(page.locator('#video-dialog')).toHaveClass(/is-landscape/);
  await expect.poll(()=>page.locator('#venue-video').evaluate(e=>e.currentTime>0)).toBe(true);
  const geometry=await page.locator('.video-stage').evaluate(e=>{
    const video=e.querySelector('video');
    return {ratio:e.clientWidth/e.clientHeight,width:video.clientWidth,height:video.clientHeight,stageWidth:e.clientWidth,stageHeight:e.clientHeight,sourceRatio:video.videoWidth/video.videoHeight};
  });
  expect(geometry.ratio).toBeCloseTo(16/9,2);
  expect(geometry.sourceRatio).toBeCloseTo(16/9,2);
  expect(geometry.width).toBe(geometry.stageWidth);
  expect(geometry.height).toBe(geometry.stageHeight);
  await expect(page.locator('#venue-video')).toHaveCSS('object-fit','contain');
  await expect(page.locator('.video-stage')).toHaveCSS('overflow','hidden');
  await page.keyboard.press('Escape');
  await expect(page.locator('#video-dialog')).not.toHaveClass(/is-landscape/);
  await page.unroute('**/media-data.mjs');
  await page.reload();
  await page.locator('a[data-video="hall-light"]').first().click();
  await expect.poll(()=>page.locator('#venue-video').evaluate(e=>e.currentTime>0)).toBe(true);
  await expect(page.locator('#video-dialog')).not.toHaveClass(/is-landscape/);
});

test('compact landscape overlays leave close and seek reachable with device volume',async({page})=>{
  await page.setViewportSize({width:320,height:568});
  await page.addInitScript(()=>Object.defineProperty(HTMLMediaElement.prototype,'volume',{configurable:true,get(){return 1;},set(){}}));
  await landscapeFixture(page);
  await openVideo(page);
  await expect(page.locator('#video-dialog')).toHaveClass(/is-landscape/);
  await expect(page.locator('#video-seek')).toBeEnabled();
  const seek=await page.locator('#video-seek').boundingBox();
  await page.mouse.click(seek.x+seek.width*.65,seek.y+seek.height/2);
  await expect.poll(()=>page.locator('#venue-video').evaluate(e=>e.currentTime)).toBeGreaterThan(2);
  const close=page.locator('#video-dialog [data-close-dialog]');
  expect(await close.evaluate(e=>{
    const r=e.getBoundingClientRect();
    return [4,22,40].every(y=>e.contains(document.elementFromPoint(r.x+r.width/2,r.y+y)));
  })).toBe(true);
  await close.click();
  await expect(page.locator('#video-dialog')).not.toBeVisible();
});
