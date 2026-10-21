import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
for (const asset of ['styles.css', 'app.js', 'planner.mjs', 'assets/venue-hero-2k.webp', 'assets/venue-hero-1280.webp', 'assets/venue-hero.jpg', 'assets/venue-hall.jpg']) {
  await stat(resolve(root, 'public', asset));
}
if (!html.includes('lang="ru"') || !html.includes('id="enquiry-form"')) throw new Error('Missing core page content.');
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
console.log('Built static website → dist/ (no runtime dependencies).');
