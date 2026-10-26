import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

test('the saved emerald theme is applied before paint; unavailable or unknown storage keeps the default', async () => {
  const source = await readFile(new URL('../public/theme-init.js', import.meta.url), 'utf8');
  for (const saved of ['emerald', 'emerald-halls', 'classic', 'unknown', '__proto__', null, new Error('Storage denied')]) {
    const root = { dataset: {} };
    const meta = { content: '#fbf9f4' };
    runInNewContext(source, {
      document: { documentElement: root, querySelector: () => meta },
      localStorage: { getItem: () => { if (saved instanceof Error) throw saved; return saved; } }
    });
    const emerald = saved === 'emerald' || saved === 'emerald-halls';
    assert.equal(root.dataset.theme, emerald ? 'emerald' : undefined);
    assert.equal(root.dataset.layout, saved === 'emerald-halls' ? 'halls' : undefined);
    assert.equal(meta.content, emerald ? '#064734' : '#fbf9f4');
  }
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('src="/theme-init.js"') < html.indexOf('href="/styles.css"'));
  assert.match(html, /href="\/themes\.css"/);
});
