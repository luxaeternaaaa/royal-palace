import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createNetServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { gunzipSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const fixtureName = `server-test-${randomUUID()}.mp4`;
const fixturePath = resolve(root, 'public', fixtureName);
const emptyName = `server-empty-${randomUUID()}.mp4`;
const emptyPath = resolve(root, 'public', emptyName);
const textName = `server-test-${randomUUID()}.html`;
const textPath = resolve(root, 'public', textName);
const textBody = Buffer.from('<!doctype html>' + 'Royal Palace static page. '.repeat(100));
const bytes = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
let child;
let port;

before(async () => {
  await writeFile(fixturePath, bytes, { flag: 'wx' });
  await writeFile(emptyPath, '', { flag: 'wx' });
  await writeFile(textPath, textBody, { flag: 'wx' });
  const probe = createNetServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  child = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Test server did not start')), 5000);
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk;
      if (output.includes(`http://localhost:${port}`)) { clearTimeout(timeout); resolve(); }
    });
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Test server exited: ${code}`)); });
  });
});

after(async () => {
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }
  await Promise.all([fixturePath, emptyPath, textPath].map(path => unlink(path).catch(error => { if (error.code !== 'ENOENT') throw error; })));
});

function request(path = `/${fixtureName}`, { method = 'GET', range, ifRange, acceptEncoding } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (range !== undefined) headers.Range = range;
    if (ifRange !== undefined) headers['If-Range'] = ifRange;
    if (acceptEncoding !== undefined) headers['Accept-Encoding'] = acceptEncoding;
    const req = httpRequest({ hostname: '127.0.0.1', port, path, method, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

test('text assets negotiate gzip and preserve HEAD metadata and q=0', async () => {
  const compressed = await request(`/${textName}`, { acceptEncoding: 'gzip' });
  assert.equal(compressed.status, 200);
  assert.equal(compressed.headers['content-encoding'], 'gzip');
  assert.equal(compressed.headers.vary, 'Accept-Encoding');
  assert.equal(compressed.headers['content-length'], undefined);
  assert.equal(compressed.headers['cache-control'], 'no-cache');
  assert.deepEqual(gunzipSync(compressed.body), textBody);

  const disabled = await request(`/${textName}`, { acceptEncoding: 'br, gzip; q=0' });
  assert.equal(disabled.headers['content-encoding'], undefined);
  assert.equal(disabled.headers['content-length'], String(textBody.length));
  assert.deepEqual(disabled.body, textBody);

  const head = await request(`/${textName}`, { method: 'HEAD' });
  assert.equal(head.headers['content-encoding'], undefined);
  assert.equal(head.headers['content-length'], String(textBody.length));
  assert.equal(head.body.length, 0);

  const compressedHead = await request(`/${textName}`, { method: 'HEAD', acceptEncoding: 'gzip' });
  assert.equal(compressedHead.headers['content-encoding'], 'gzip');
  assert.equal(compressedHead.headers['content-length'], undefined);
  assert.equal(compressedHead.body.length, 0);
});

test('byte ranges remain uncompressed even when gzip is accepted', async () => {
  const response = await request(undefined, { range: 'bytes=0-15', acceptEncoding: 'gzip' });
  assert.equal(response.status, 206);
  assert.equal(response.headers['content-encoding'], undefined);
  assert.equal(response.headers['content-range'], `bytes 0-15/${bytes.length}`);
  assert.deepEqual(response.body, bytes.subarray(0, 16));
});

test('whole MP4 GET streams exact bytes and HEAD sends the same metadata without a body', async () => {
  for (const method of ['GET', 'HEAD']) {
    const response = await request(undefined, { method, acceptEncoding: 'gzip' });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'video/mp4');
    assert.equal(response.headers['accept-ranges'], 'bytes');
    assert.equal(response.headers['content-length'], String(bytes.length));
    assert.equal(response.headers['cache-control'], 'no-cache');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['content-range'], undefined);
    assert.equal(response.headers['content-encoding'], undefined);
    assert.deepEqual(response.body, method === 'HEAD' ? Buffer.alloc(0) : bytes);
  }
});

test('single byte ranges serve exact inclusive bounds, open ends, suffixes and clamped ends', async () => {
  for (const [range, start, end] of [
    ['bytes=0-1', 0, 1], ['bytes=32-63', 32, 63], ['bytes=255-', 255, 255],
    ['bytes=250-', 250, 255], ['bytes=-5', 251, 255], ['bytes=-999', 0, 255],
    ['bytes=250-999', 250, 255], ['bytes=0-0', 0, 0], ['Bytes=2-3', 2, 3],
    ['bytes=0-99999999999999999999999999999999999999999999999999999999999', 0, 255],
    ['bytes=-99999999999999999999999999999999999999999999999999999999999', 0, 255],
  ]) {
    const response = await request(undefined, { range });
    assert.equal(response.status, 206, range);
    assert.equal(response.headers['content-type'], 'video/mp4');
    assert.equal(response.headers['accept-ranges'], 'bytes');
    assert.equal(response.headers['content-range'], `bytes ${start}-${end}/${bytes.length}`);
    assert.equal(response.headers['content-length'], String(end - start + 1));
    assert.deepEqual(response.body, bytes.subarray(start, end + 1));
  }
});

test('HEAD ignores Range and reports full metadata without transmitting file data', async () => {
  for (const range of ['bytes=4-15', 'bytes=999-', 'bytes=0-1,4-5', 'bytes=bad']) {
    const response = await request(undefined, { method: 'HEAD', range });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-range'], undefined);
    assert.equal(response.headers['content-length'], String(bytes.length));
    assert.equal(response.body.length, 0);
  }
});

test('malformed, multiple and unsatisfiable ranges return a bounded 416 response', async () => {
  for (const range of ['bytes=256-', 'bytes=999-1000', 'bytes=20-10', 'bytes=-0', 'bytes=-', 'bytes=abc-def', 'bytes=0-1,4-5', 'bytes=0-1,', 'bytes=1.5-2', 'bytes=+1-2', 'bytes=999999999999999999999999999999999999999999-']) {
    const response = await request(undefined, { range });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers['content-range'], `bytes */${bytes.length}`);
    assert.equal(response.headers['accept-ranges'], 'bytes');
    assert.equal(response.headers['content-length'], '0');
    assert.equal(response.body.length, 0);
  }
});

test('unknown range units are ignored instead of being interpreted as byte offsets', async () => {
  const response = await request(undefined, { range: 'items=0-1' });
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-range'], undefined);
  assert.deepEqual(response.body, bytes);
});

test('conditional ranges fall back to the full representation without a matching validator', async () => {
  for (const ifRange of ['"different-revision"', 'Wed, 21 Oct 2026 00:00:00 GMT']) {
    const response = await request(undefined, { range: 'bytes=0-1', ifRange });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-range'], undefined);
    assert.equal(response.headers['content-length'], String(bytes.length));
    assert.deepEqual(response.body, bytes);
  }
});

test('empty files stream without an invalid read range and reject requested bytes', async () => {
  const response = await request(`/${emptyName}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-length'], '0');
  assert.equal(response.body.length, 0);
  const range = await request(`/${emptyName}`, { range: 'bytes=0-' });
  assert.equal(range.status, 416);
  assert.equal(range.headers['content-range'], 'bytes */0');
});

test('normal pages, missing files and encoded path traversal keep their existing behaviour', async () => {
  const page = await request('/');
  assert.equal(page.status, 200);
  assert.equal(page.headers['content-type'], 'text/html; charset=utf-8');
  assert.match(page.body.toString(), /Royal Palace/);
  assert.equal((await request(`/missing-${fixtureName}`)).status, 404);
  assert.equal((await request('/assets/')).status, 404);
  assert.equal((await request('/%2e%2e%2fpackage.json')).status, 403);
  assert.equal((await request('/%invalid')).status, 404);
});
