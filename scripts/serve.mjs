import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..', process.argv.includes('--production') ? 'dist' : 'public');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp4': 'video/mp4' };
const compressible = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);
const acceptsGzip = (header = '') => header.split(',').some(coding => {
  const [name, ...parameters] = coding.trim().split(';');
  const quality = parameters.find(parameter => /^\s*q\s*=/i.test(parameter))?.split('=')[1].trim();
  return name.toLowerCase() === 'gzip' && (quality === undefined || Number(quality) > 0);
});
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, `.${path === '/' ? '/index.html' : path}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404).end('Not found'); return; }
    const headers = { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
    const compressibleFile = compressible.has(extname(file));
    if (compressibleFile) headers.Vary = 'Accept-Encoding';
    // Without validators, conditional ranges fall back to the full representation.
    let range = req.method === 'GET' && !req.headers['if-range'] ? req.headers.range : undefined;
    if (range && /^[^=\s]+=/.test(range) && !/^bytes=/i.test(range)) range = undefined;
    let start = 0;
    let end = info.size - 1;
    if (range !== undefined) {
      const match = /^bytes=(\d*)-(\d*)$/i.exec(range);
      if (match) {
        if (match[1]) {
          start = Number(match[1]);
          if (match[2]) end = Math.min(Number(match[2]), end);
        } else start = Math.max(0, info.size - Number(match[2]));
      }
      if (!match || (!match[1] && !match[2]) || start >= info.size || start > end) {
        res.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}`, 'Content-Length': 0 }).end();
        return;
      }
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    const gzip = range === undefined && compressibleFile && acceptsGzip(req.headers['accept-encoding']);
    if (gzip) headers['Content-Encoding'] = 'gzip';
    else headers['Content-Length'] = end - start + 1;
    res.writeHead(range === undefined ? 200 : 206, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = createReadStream(file, range === undefined ? undefined : { start, end });
    stream.on('error', () => res.destroy());
    const gzipStream = gzip ? createGzip() : undefined;
    gzipStream?.on('error', () => res.destroy());
    res.on('close', () => { stream.destroy(); gzipStream?.destroy(); });
    stream.pipe(gzipStream || res);
    gzipStream?.pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Royal Palace preview: http://localhost:${port}`));
