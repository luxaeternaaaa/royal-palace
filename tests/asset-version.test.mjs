import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import * as build from '../scripts/build.mjs';

const sources = new Map([
  ['index.html', `<!doctype html><html><head>
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="./relative.css">
<script src="/theme-init.js"></script><script type="module" src="/app.mjs"></script>
</head><body><h1>Royal Palace</h1>
<a href="#halls">Залы</a><img src="/assets/hall.webp">
<script src="https://cdn.example.test/remote.mjs"></script>
<link rel="stylesheet" href="//cdn.example.test/remote.css">
<script src="data:text/javascript,import%20%22./embedded.mjs%22"></script>
</body></html>\n`],
  ['styles.css', `@import "./nested/tokens.css";
@import url('/layout.css');
@font-face { font-family: Forum; src: url('/assets/forum.woff2'); }
.hero { background-image: url('/assets/hall.webp'); }
@import url('https://cdn.example.test/remote.css');
@import "//cdn.example.test/remote.css";
.data { background: url('data:image/svg+xml,%3Csvg%20href=%22./embedded.css%22/%3E'); }
.anchor { filter: url('#paint.css'); }\n`],
  ['layout.css', '.layout { color: #064734; }\n'],
  ['relative.css', '.relative { padding: 1rem; }\n'],
  ['nested/tokens.css', ':root { --ink: #282521; }\n'],
  ['theme-init.js', 'globalThis.themeReady = true;\n'],
  ['app.mjs', `import './startup.mjs';
import { copy } from './copy.mjs';
export { title } from './nested/copy.mjs';
export { copy };
export const load = () => import('./nested/lazy.mjs');\n`],
  ['startup.mjs', 'export const ready = true;\n'],
  ['copy.mjs', "import { title } from './nested/copy.mjs';\nexport const copy = title;\n"],
  ['nested/copy.mjs', "export const title = 'Royal Palace';\n"],
  ['nested/lazy.mjs', "export const action = 'Посмотреть залы';\n"],
  ['external.mjs', `export { remote } from 'https://cdn.example.test/remote.mjs';
export const network = () => import('//cdn.example.test/remote.mjs');
export const inline = () => import('data:text/javascript,export%20default%20%22./embedded.mjs%22');
export const hash = '#section.mjs';
export const image = '/assets/hall.webp';\n`],
]);

const binarySources = new Map([
  ['assets/hall.webp', Buffer.from([0, 255, 128, 24, 0, 1])],
  ['assets/forum.woff2', Buffer.from("\0font payload '/app.mjs' /styles.css", 'utf8')],
  ['notes.txt', Buffer.from("Non-code note: '/app.mjs' and '/styles.css'.\n")],
]);

async function fixture(t, { newline = '\n' } = {}) {
  const root = await mkdtemp(resolve(tmpdir(), 'royal-palace-asset-version-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of [...sources, ...binarySources]) {
    const path = resolve(root, 'public', name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, typeof content === 'string' ? content.replaceAll('\n', newline) : content);
  }
  return root;
}

async function versionFreshCopy(root) {
  await build.copyPublicToDist(root, { basePath: '/royal-palace' });
  const version = await build.versionCodeAssets(resolve(root, 'dist'));
  assert.equal(typeof version, 'string');
  assert.match(version, /^[A-Za-z0-9_-]+$/, 'version must be usable as one URL query value');
  return version;
}

async function assertGraphVersion(root, version) {
  const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
  for (const url of ['/royal-palace/styles.css', './relative.css', '/royal-palace/theme-init.js', '/royal-palace/app.mjs']) {
    assert.ok(html.includes(`"${url}?v=${version}"`), `HTML must request ${url} at the shared version`);
  }
  const css = await readFile(resolve(root, 'dist/styles.css'), 'utf8');
  assert.ok(css.includes(`"./nested/tokens.css?v=${version}"`), 'quoted CSS import must share the version');
  assert.ok(css.includes(`url('/royal-palace/layout.css?v=${version}')`), 'CSS url import must share the version');
  const entry = await readFile(resolve(root, 'dist/app.mjs'), 'utf8');
  for (const url of ['./startup.mjs', './copy.mjs', './nested/copy.mjs', './nested/lazy.mjs']) {
    assert.ok(entry.includes(`'${url}?v=${version}'`), `module edge ${url} must share the version`);
  }
  const transitive = await readFile(resolve(root, 'dist/copy.mjs'), 'utf8');
  assert.ok(transitive.includes(`'./nested/copy.mjs?v=${version}'`), 'transitive module imports must be versioned');
}

test('HTML, CSS and the entire executable module graph use one asset version', async t => {
  const root = await fixture(t);
  const version = await versionFreshCopy(root);
  await assertGraphVersion(root, version);
  const entry = await import(`${pathToFileURL(resolve(root, 'dist/app.mjs')).href}?v=${version}`);
  assert.equal(entry.title, 'Royal Palace');
  assert.equal(entry.copy, 'Royal Palace');
  assert.equal((await entry.load()).action, 'Посмотреть залы');
  for (const [name, original] of sources) {
    assert.equal(await readFile(resolve(root, 'public', name), 'utf8'), original, `${name}: source changed while versioning dist`);
  }
});

test('a transitive copy change invalidates every code URL after a fresh build', async t => {
  const root = await fixture(t);
  const firstVersion = await versionFreshCopy(root);
  await assertGraphVersion(root, firstVersion);
  assert.equal(await versionFreshCopy(root), firstVersion, 'unchanged fresh builds must have a deterministic version');

  await writeFile(resolve(root, 'public/nested/copy.mjs'), "export const title = 'Updated Royal Palace';\n");
  const nextVersion = await versionFreshCopy(root);
  assert.notEqual(nextVersion, firstVersion, 'changing only a transitive module must invalidate the entire graph');
  await assertGraphVersion(root, nextVersion);
  for (const name of ['index.html', 'styles.css', 'app.mjs', 'copy.mjs']) {
    assert.ok(!(await readFile(resolve(root, 'dist', name), 'utf8')).includes(`?v=${firstVersion}`), `${name}: stale version survived a fresh build`);
  }
  const entry = await import(`${pathToFileURL(resolve(root, 'dist/app.mjs')).href}?v=${nextVersion}`);
  assert.equal(entry.title, 'Updated Royal Palace');
  assert.equal(entry.copy, 'Updated Royal Palace');
});

test('CRLF and LF source trees produce the same deterministic asset version', async t => {
  const lfRoot = await fixture(t);
  const crlfRoot = await fixture(t, { newline: '\r\n' });
  const lfVersion = await versionFreshCopy(lfRoot);
  const crlfVersion = await versionFreshCopy(crlfRoot);
  assert.equal(crlfVersion, lfVersion, 'Git checkout newline conversion must not change the deployment version');
  await assertGraphVersion(lfRoot, lfVersion);
  await assertGraphVersion(crlfRoot, crlfVersion);
});

test('versioning preserves external, data, fragment and binary URLs and bytes', async t => {
  const root = await fixture(t);
  await versionFreshCopy(root);
  const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
  for (const unchanged of [
    'href="#halls"', 'src="/royal-palace/assets/hall.webp"',
    'src="https://cdn.example.test/remote.mjs"', 'href="//cdn.example.test/remote.css"',
    'src="data:text/javascript,import%20%22./embedded.mjs%22"',
  ]) assert.ok(html.includes(unchanged), unchanged);
  const css = await readFile(resolve(root, 'dist/styles.css'), 'utf8');
  for (const unchanged of [
    "url('/royal-palace/assets/forum.woff2')", "url('/royal-palace/assets/hall.webp')",
    "url('https://cdn.example.test/remote.css')", '"//cdn.example.test/remote.css"',
    "url('data:image/svg+xml,%3Csvg%20href=%22./embedded.css%22/%3E')", "url('#paint.css')",
  ]) assert.ok(css.includes(unchanged), unchanged);
  const external = await readFile(resolve(root, 'dist/external.mjs'), 'utf8');
  assert.equal(external, sources.get('external.mjs').replace("'/assets/hall.webp'", "'/royal-palace/assets/hall.webp'"));
  for (const [name, original] of binarySources) {
    assert.deepEqual(await readFile(resolve(root, 'dist', name)), original, `${name}: non-code bytes must remain identical`);
  }
});
