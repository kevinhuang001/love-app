import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase } from '../src/db.js';
import { cleanUnusedSQLiteMedia } from '../src/unused-media.js';

test('cleanup removes only unreferenced files and upload temps, retains all media variants and ignores links', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-unused-media-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const database = join(dir, 'source.sqlite'),
    media = join(dir, 'media');
  await mkdir(join(media, 'tmp', 'failed-upload'), { recursive: true });
  await mkdir(join(media, 'manual-folder'));
  const db = await openDatabase(database);
  await db
    .prepare('INSERT INTO media(id,kind,original,preview,thumbnail,createdAt) VALUES(?,?,?,?,?,?)')
    .run('still-pending', 'image', 'kept.source', 'kept.webp', 'kept.thumb.webp', 'now');
  await db.close();
  const original = await readFile(database);
  for (const file of [
    'kept.source',
    'kept.webp',
    'kept.thumb.webp',
    'orphan.mp4',
    'tmp/raw-upload',
    'tmp/failed-upload/output',
  ])
    await writeFile(join(media, file), file);
  await writeFile(join(dir, 'outside'), 'outside must survive');
  await symlink(join(dir, 'outside'), join(media, 'unreferenced-link'));
  const scanned = await cleanUnusedSQLiteMedia(database, media);
  assert.equal(scanned.files, 3);
  assert.equal(scanned.applied, false);
  assert.equal(await readFile(join(media, 'orphan.mp4'), 'utf8'), 'orphan.mp4');
  const deleted = await cleanUnusedSQLiteMedia(database, media, true);
  assert.equal(deleted.bytes, scanned.bytes);
  assert.equal(deleted.files, 3);
  for (const file of ['kept.source', 'kept.webp', 'kept.thumb.webp'])
    assert.equal(await readFile(join(media, file), 'utf8'), file);
  assert.equal(await readFile(join(dir, 'outside'), 'utf8'), 'outside must survive');
  assert.deepEqual(await readFile(database), original);
  assert.equal((await cleanUnusedSQLiteMedia(database, media, true)).files, 0);
  assert.ok((await readdir(media)).includes('manual-folder'));
});

test('cleanup fails closed when a referenced path is invalid', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-unused-path-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'source.sqlite'),
    db = await openDatabase(path);
  await db
    .prepare('INSERT INTO media(id,kind,original,preview,thumbnail,createdAt) VALUES(?,?,?,?,?,?)')
    .run('unsafe', 'image', '../outside', 'a', 'b', 'now');
  await db.close();
  await mkdir(join(dir, 'media'));
  await writeFile(join(dir, 'media', 'orphan'), 'keep on error');
  await assert.rejects(cleanUnusedSQLiteMedia(path, join(dir, 'media'), true), /路径无效/);
  assert.equal(await readFile(join(dir, 'media', 'orphan'), 'utf8'), 'keep on error');
});
