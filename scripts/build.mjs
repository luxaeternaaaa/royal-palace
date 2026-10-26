import { cp, lstat, readFile, realpath, rm, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MENUS } from '../public/menu-data.mjs';
import { VIDEOS } from '../public/media-data.mjs';
import { getMenuAsset } from '../public/menu-locales.mjs';

export async function copyPublicToDist(projectRoot) {
  const root = await realpath(projectRoot);
  const dist = resolve(root, 'dist');
  try {
    const info = await lstat(dist);
    if (info.isSymbolicLink() || await realpath(dist) !== dist) throw new Error('Refusing to clear dist outside the project.');
    const rel = relative(root, dist);
    if (!rel || rel === '..' || rel.startsWith(`..${sep}`)) throw new Error('Refusing to clear dist outside the project.');
    await rm(dist, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await cp(resolve(root, 'public'), dist, { recursive: true });
}

async function build() {
  const root = resolve(import.meta.dirname, '..');
  const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
  for (const asset of ['styles.css', 'themes.css', 'theme-init.js', 'app.js', 'planner.mjs', 'cost.mjs', 'i18n.mjs', 'page-locales.mjs', 'ui-locales.mjs', 'menu-data.mjs', 'occasion-menu-data.mjs', 'occasion-menu-locales.mjs', 'menu-locales.mjs', 'assets/venue-hero-restored-2k.webp', 'assets/venue-hero-restored-1280.webp', 'assets/venue-hero.jpg', 'assets/venue-hall.jpg']) {
    await stat(resolve(root, 'public', asset));
  }
  for (const asset of ['hero-mobile-800.avif', 'hero-mobile-1600.avif', 'hero-mobile-800.webp', 'hero-mobile-1600.webp', 'menu-crest.webp']) {
    await stat(resolve(root, 'public/assets', asset));
  }
  if (!html.includes('lang="ru"') || !html.includes('id="enquiry-form"')) throw new Error('Missing core page content.');
  for (const [, asset] of html.matchAll(/(?:href|src)="(\/assets\/menus\/[^\"]+\.webp)"/g)) {
    await stat(resolve(root, 'public', asset.slice(1)));
    if (asset.startsWith('/assets/menus/') && !asset.endsWith('-preview.webp')) await stat(resolve(root, 'public', asset.slice(1).replace('.webp', '-mobile.webp')));
  }
  for (const menu of MENUS) for (const locale of ['ru', 'kk', 'en']) for (const variant of ['full', 'preview']) {
    await stat(resolve(root, 'public', getMenuAsset(menu, locale, variant).slice(1)));
  }
  await stat(resolve(root, 'public/media-data.mjs'));
  for (const video of Object.values(VIDEOS)) for (const asset of [video.src, video.poster, video.mobileSrc].filter(Boolean)) {
    await stat(resolve(root, 'public', asset.slice(1)));
  }
  await copyPublicToDist(root);
  console.log('Built static website → dist/ (no runtime dependencies).');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
