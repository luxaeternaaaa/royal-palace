import { cp, lstat, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { extname, resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { MENUS } from '../public/menu-data.mjs';
import { VIDEOS } from '../public/media-data.mjs';
import { getMenuAsset } from '../public/menu-locales.mjs';

export function normalizePublicBasePath(value = '') {
  if (value === '' || value === '/') return '';
  if (typeof value !== 'string' || !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?$/.test(value)) {
    throw new Error('PUBLIC_BASE_PATH must be a local path with plain URL segments.');
  }
  return value.replace(/\/$/, '');
}

async function applyPublicBase(directory, basePath) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) { await applyPublicBase(path, basePath); continue; }
    if (!['.html', '.css', '.js', '.mjs'].includes(extname(path))) continue;
    const source = await readFile(path, 'utf8');
    // Protect complete external/data URLs; rewrite local asset URLs and root entry files only.
    const built = source.replace(/(?:https?:)?\/\/[^\s"'`)]+|data:[^\s"'`)]+|([\s("'`,])\/(assets\/|[\w.-]+\.(?:css|m?js|html)(?=[\s"'`),?#]))/g,
      (match, before, asset) => asset ? `${before}${basePath}/${asset}` : match);
    if (built !== source) await writeFile(path, built);
  }
}

export async function copyPublicToDist(projectRoot, { basePath = '' } = {}) {
  const publicBase = normalizePublicBasePath(basePath);
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
  if (publicBase) await applyPublicBase(dist, publicBase);
}

export async function versionCodeAssets(directory) {
  const files = [];
  async function collect(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = resolve(folder, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (['.html', '.css', '.js', '.mjs'].includes(extname(path))) {
        files.push({ path, name: relative(directory, path).split(sep).join('/'), source: await readFile(path, 'utf8') });
      }
    }
  }
  await collect(directory);
  files.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const digest = createHash('sha256');
  for (const file of files) digest.update(`${file.name}\0${file.source.replaceAll('\r\n', '\n')}\0`);
  const version = digest.digest('hex').slice(0, 12);
  for (const file of files) {
    // Version imports too: a cached child module can overwrite new HTML with old copy.
    const built = file.source.replace(/(?:https?:)?\/\/[^\s"'`)]+|data:[^\s"'`)]+|(["'(`])((?:\.{1,2}\/|\/(?!\/))[^"'`()<>\s]*?\.(?:css|m?js))(\?[^#"'`()<>\s]*)?(#[^"'`()<>\s]*)?(?=["'`)\s>])/g,
      (match, before, path, query = '', fragment = '') => {
        if (!before) return match;
        return `${before}${path}${query ? `${query}&` : '?'}v=${version}${fragment}`;
      });
    if (built !== file.source) await writeFile(file.path, built);
  }
  return version;
}

async function build() {
  const root = resolve(import.meta.dirname, '..');
  const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
  for (const asset of ['styles.css', 'themes.css', 'theme-init.js', 'app.js', 'planner.mjs', 'cost.mjs', 'i18n.mjs', 'page-locales.mjs', 'ui-locales.mjs', 'menu-data.mjs', 'occasion-menu-data.mjs', 'occasion-menu-locales.mjs', 'menu-locales.mjs', 'assets/venue-hero-restored-2k.webp', 'assets/venue-hero-restored-1280.webp', 'assets/venue-hero.jpg', 'assets/venue-hall.jpg']) {
    await stat(resolve(root, 'public', asset));
  }
  for (const asset of ['hero-centered-960.avif', 'hero-centered-1536.avif', 'hero-centered-960.webp', 'hero-centered-1536.webp', 'menu-crest.webp']) {
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
  await copyPublicToDist(root, { basePath: process.env.PUBLIC_BASE_PATH });
  await versionCodeAssets(resolve(root, 'dist'));
  console.log('Built static website → dist/ (no runtime dependencies).');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
