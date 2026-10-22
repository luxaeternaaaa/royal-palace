import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
for (const asset of ['styles.css', 'app.js', 'planner.mjs', 'cost.mjs', 'i18n.mjs', 'page-locales.mjs', 'ui-locales.mjs', 'menu-data.mjs', 'menu-locales.mjs', 'assets/venue-hero-restored-2k.webp', 'assets/venue-hero-restored-1280.webp', 'assets/venue-hero.jpg', 'assets/venue-hall.jpg']) {
  await stat(resolve(root, 'public', asset));
}
if (!html.includes('lang="ru"') || !html.includes('id="enquiry-form"')) throw new Error('Missing core page content.');
for (const [, asset] of html.matchAll(/(?:href|src)="(\/assets\/menus\/[^"]+\.webp)"/g)) {
  await stat(resolve(root, 'public', asset.slice(1)));
  if (asset.startsWith('/assets/menus/') && !asset.endsWith('-preview.webp')) await stat(resolve(root, 'public', asset.slice(1).replace('.webp', '-mobile.webp')));
}
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
console.log('Built static website → dist/ (no runtime dependencies).');
