import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { copyPublicToDist } from '../scripts/build.mjs';

test('a fresh build removes files left over from an earlier public folder', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'royal-palace-build-'));
  try {
    await mkdir(resolve(root, 'public'));
    await mkdir(resolve(root, 'dist'));
    await writeFile(resolve(root, 'public', 'current.txt'), 'current');
    await writeFile(resolve(root, 'dist', 'removed.txt'), 'stale');

    await copyPublicToDist(root);

    assert.equal(await readFile(resolve(root, 'dist', 'current.txt'), 'utf8'), 'current');
    await assert.rejects(readFile(resolve(root, 'dist', 'removed.txt')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a dist junction or symlink cannot make a build delete outside the project', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'royal-palace-build-'));
  const outside = await mkdtemp(resolve(tmpdir(), 'royal-palace-outside-'));
  try {
    await mkdir(resolve(root, 'public'));
    await writeFile(resolve(root, 'public', 'current.txt'), 'current');
    await writeFile(resolve(outside, 'keep.txt'), 'keep');
    await symlink(outside, resolve(root, 'dist'), process.platform === 'win32' ? 'junction' : 'dir');

    await assert.rejects(copyPublicToDist(root), /Refusing to clear dist outside the project/);
    assert.equal(await readFile(resolve(outside, 'keep.txt'), 'utf8'), 'keep');
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
