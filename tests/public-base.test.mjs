import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { copyPublicToDist } from '../scripts/build.mjs';

const html = `<!doctype html><html lang="ru"><head>
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href='/themes.css'>
<link rel="preload" as="image" href="/assets/hall.webp" imagesrcset="/assets/hall-800.webp 800w, /assets/hall-1600.webp 1600w">
<script src="/theme-init.js" defer></script><script type="module" src="/app.mjs"></script>
</head><body><h1>Royal Palace — обсудим ваш праздник</h1>
<picture><source type="image/avif" srcset="/assets/hall.avif 1x, /assets/hall-2x.avif 2x"><img src="/assets/hall.webp" srcset="/assets/hall-800.webp 800w, /assets/hall-1600.webp 1600w"></picture>
<a href='/assets/menus/ru/main.webp'>Открыть меню</a><a href="#menu">Меню</a>
<a href="https://2gis.kz/astana/firm/70000001081186323">Построить маршрут</a>
<img src="https://example.test/assets/remote.webp"><img src="//cdn.example.test/assets/remote.webp">
<img src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E">
<a href="geo:51.1694,71.4491">Карта</a><a href="./relative.html">Другой раздел</a>
</body></html>`;

const css = `@import url('/layout.css');
@font-face { font-family: Forum; src: url("/assets/forum.woff2") format("woff2"); }
.hero { background-image: url(/assets/hall.webp); }
.remote { background-image: url("https://example.test/assets/remote.webp"); }
.network { background-image: url('//cdn.example.test/assets/remote.webp'); }
.inline { background-image: url('data:image/svg+xml,%3Csvg/%3E'); }
.relative { background-image: url('./assets/local.webp'); }
`;

const moduleSource = [
  "import { relativeValue } from './relative.mjs';",
  "export { relativeValue };",
  "export const hall = '/assets/hall.webp';",
  'export const stylesheet = "/styles.css";',
  "export const script = '/theme-init.js';",
  'export const menu = locale => `/assets/menus/${locale}/main.webp`;',
  'export const append = filename => "/assets/" + filename;',
  "export const remote = 'https://example.test/assets/remote.webp';",
  "export const network = '//cdn.example.test/assets/remote.webp';",
  "export const inline = 'data:image/svg+xml,%3Csvg/%3E';",
  "export const anchor = '#menu';",
  "export const copy = 'Свадьба / семейный праздник — обсудим детали.';",
].join('\n');

const fixtureFiles = new Map([
  ['index.html', Buffer.from(html)],
  ['styles.css', Buffer.from(css)],
  ['layout.css', Buffer.from('.page { color: #064734; }\n')],
  ['themes.css', Buffer.from('.theme { color: white; }\n')],
  ['theme-init.js', Buffer.from("window.initialAsset = '/assets/hall.webp';\n")],
  ['app.mjs', Buffer.from(moduleSource)],
  ['relative.mjs', Buffer.from("export const relativeValue = 'relative import still works';\n")],
  ['readme.txt', Buffer.from('Business note: /assets/ is a folder name, not a URL to rewrite.\n')],
  ['assets/hall.webp', Buffer.concat([Buffer.from([0, 255, 1, 128]), Buffer.from('/assets/binary-payload')])],
  ['assets/videos/example.mp4', Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftyp /assets/not-text\0\xff', 'latin1')])],
]);

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), 'royal-palace-public-base-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, bytes] of fixtureFiles) {
    const path = resolve(root, 'public', name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  return root;
}

test('default and root-base builds copy all public bytes unchanged', async t => {
  const root = await fixture(t);
  for (const options of [undefined, { basePath: '' }, { basePath: '/' }]) {
    await copyPublicToDist(root, options);
    for (const [name, bytes] of fixtureFiles) {
      assert.deepEqual(await readFile(resolve(root, 'dist', name)), bytes, `${name}: default build must be exact`);
    }
  }
});

test('a repository base rewrites every HTML asset candidate and root entry point', async t => {
  const root = await fixture(t);
  await copyPublicToDist(root, { basePath: '/royal-palace/' });
  const built = await readFile(resolve(root, 'dist/index.html'), 'utf8');
  for (const attribute of [
    'href="/royal-palace/styles.css"', "href='/royal-palace/themes.css'",
    'src="/royal-palace/theme-init.js"', 'src="/royal-palace/app.mjs"',
    'href="/royal-palace/assets/hall.webp"', 'src="/royal-palace/assets/hall.webp"',
    'imagesrcset="/royal-palace/assets/hall-800.webp 800w, /royal-palace/assets/hall-1600.webp 1600w"',
    'srcset="/royal-palace/assets/hall-800.webp 800w, /royal-palace/assets/hall-1600.webp 1600w"',
    'srcset="/royal-palace/assets/hall.avif 1x, /royal-palace/assets/hall-2x.avif 2x"',
    "href='/royal-palace/assets/menus/ru/main.webp'",
  ]) assert.ok(built.includes(attribute), attribute);
  for (const unchanged of [
    '<h1>Royal Palace — обсудим ваш праздник</h1>', 'href="#menu"',
    'href="https://2gis.kz/astana/firm/70000001081186323"',
    'src="https://example.test/assets/remote.webp"', 'src="//cdn.example.test/assets/remote.webp"',
    'src="data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%3E%3C/svg%3E"',
    'href="geo:51.1694,71.4491"', 'href="./relative.html"',
  ]) assert.ok(built.includes(unchanged), unchanged);
  assert.equal(await readFile(resolve(root, 'public/index.html'), 'utf8'), html, 'source public must remain untouched');
});

test('built CSS and executed modules resolve local assets under the base without altering external URLs or imports', async t => {
  const root = await fixture(t);
  await copyPublicToDist(root, { basePath: '/royal-palace' });
  const builtCss = await readFile(resolve(root, 'dist/styles.css'), 'utf8');
  for (const url of ["url('/royal-palace/layout.css')", 'url("/royal-palace/assets/forum.woff2")', 'url(/royal-palace/assets/hall.webp)']) {
    assert.ok(builtCss.includes(url), url);
  }
  for (const unchanged of [
    'url("https://example.test/assets/remote.webp")', "url('//cdn.example.test/assets/remote.webp')",
    "url('data:image/svg+xml,%3Csvg/%3E')", "url('./assets/local.webp')",
  ]) assert.ok(builtCss.includes(unchanged), unchanged);
  const builtModule = await import(pathToFileURL(resolve(root, 'dist/app.mjs')).href);
  assert.equal(builtModule.hall, '/royal-palace/assets/hall.webp');
  assert.equal(builtModule.stylesheet, '/royal-palace/styles.css');
  assert.equal(builtModule.script, '/royal-palace/theme-init.js');
  for (const locale of ['ru', 'kk', 'en']) assert.equal(builtModule.menu(locale), `/royal-palace/assets/menus/${locale}/main.webp`);
  assert.equal(builtModule.append('hall.webp'), '/royal-palace/assets/hall.webp');
  assert.equal(builtModule.relativeValue, 'relative import still works');
  assert.equal(builtModule.remote, 'https://example.test/assets/remote.webp');
  assert.equal(builtModule.network, '//cdn.example.test/assets/remote.webp');
  assert.equal(builtModule.inline, 'data:image/svg+xml,%3Csvg/%3E');
  assert.equal(builtModule.anchor, '#menu');
  assert.equal(builtModule.copy, 'Свадьба / семейный праздник — обсудим детали.');
  assert.equal(await readFile(resolve(root, 'dist/theme-init.js'), 'utf8'), "window.initialAsset = '/royal-palace/assets/hall.webp';\n");
  for (const name of ['assets/hall.webp', 'assets/videos/example.mp4', 'readme.txt']) {
    assert.deepEqual(await readFile(resolve(root, 'dist', name)), fixtureFiles.get(name), `${name}: non-code bytes changed`);
  }
});

test('invalid base paths reject before clearing the previous dist output', async t => {
  const root = await fixture(t);
  await mkdir(resolve(root, 'dist'));
  const marker = resolve(root, 'dist/last-valid-build.txt');
  await writeFile(marker, 'Keep the previous working build.');
  for (const basePath of [
    'royal-palace', 'https://example.test/royal-palace', '//example.test/royal-palace',
    '/royal-palace/../other', '/royal-palace/./other', '/royal%2Dpalace', '/%2e%2e/other',
    '/royal-palace//other', '/royal-palace?lang=ru', '/royal-palace#menu', '/royal\\palace',
  ]) {
    await assert.rejects(copyPublicToDist(root, { basePath }), `Invalid base accepted: ${basePath}`);
    assert.equal(await readFile(marker, 'utf8'), 'Keep the previous working build.', `${basePath}: rejection deleted dist`);
  }
});
