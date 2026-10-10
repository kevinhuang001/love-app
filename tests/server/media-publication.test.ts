import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import request from 'supertest';
import sharp from 'sharp';
import { setup } from './support.js';
import {
  inspectMediaCleanup,
  applyMediaCleanup,
  cleanupFingerprint,
} from '../../apps/server/src/media-cleanup.js';
import { checkDatabase } from '../../apps/server/src/database-check.js';
import { HttpError } from '../../apps/server/src/errors.js';

async function fixture(t: Parameters<typeof setup>[0]) {
  const s = await setup(t),
    a = await s.register('atomic_a'),
    b = await s.register('atomic_b');
  await s.pair(a.token, b.token);
  const pair = (await s.api(a.token).get('/api/me')).body.couple.id;
  const image = await sharp({
    create: { width: 100, height: 100, channels: 3, background: '#678576' },
  })
    .png()
    .toBuffer();
  const upload = async () =>
    (
      await request(s.app)
        .post('/api/media')
        .auth(a.token, { type: 'bearer' })
        .attach('file', image, { filename: 'a.png', contentType: 'image/png' })
        .expect(201)
    ).body;
  return { ...s, a, b, pair, upload };
}
test('force-exit leaves only unbilled staging; cleanup removes all unpublished uploads regardless of age', async (t) => {
  const s = await fixture(t),
    media = await s.upload(),
    directory = join(s.dir, 'media');
  assert.equal(await s.control.usage(s.pair), 0);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media').get())!.n, 0);
  assert.ok(await s.db.prepare('SELECT id FROM media_uploads WHERE id=?').get(media.id));
  await request(s.app).get(media.previewUrl).expect(200);
  const plan = await inspectMediaCleanup(s.db, directory);
  assert.equal(plan.uploads.length, 1);
  await applyMediaCleanup(s.db, directory, plan, cleanupFingerprint(plan));
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media_uploads').get())!.n, 0);
  assert.equal(await s.control.usage(s.pair), 0);
  await request(s.app).get(media.previewUrl).expect(404);
  assert.deepEqual(await readdir(directory), ['tmp']);
  if (s.db.provider === 'postgres')
    assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media_chunks').get())!.n, 0);
});

test('failed memory publication rolls back media, quota and binding; successful retries are idempotent', async (t) => {
  const s = await fixture(t),
    media = await s.upload();
  const prepare = s.db.prepare.bind(s.db);
  const fail = t.mock.method(s.db, 'prepare', (sql: string) => {
    const statement = prepare(sql);
    return sql.startsWith('INSERT INTO moments')
      ? {
          ...statement,
          run: async () => {
            throw new HttpError(503, 'injected memory failure');
          },
        }
      : statement;
  });
  const memory = { clientId: randomUUID(), mediaId: media.id, title: 'atomic', date: '2026-10-09' };
  await s.api(s.a.token).post('/api/moments', memory).expect(503);
  fail.mock.restore();
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM moments').get())!.n, 0);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media').get())!.n, 0);
  assert.equal(await s.control.usage(s.pair), 0);
  assert.ok(await s.db.prepare('SELECT id FROM media_uploads WHERE id=?').get(media.id));
  if (s.db.provider === 'postgres')
    assert.equal(
      (await s.db.prepare('SELECT COUNT(*) n FROM media_files WHERE mediaId IS NOT NULL').get())!.n,
      0,
    );
  await s.api(s.a.token).post('/api/moments', memory).expect(201);
  await s.api(s.a.token).post('/api/moments', memory).expect(201);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM moments').get())!.n, 1);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media_uploads').get())!.n, 0);
  assert.ok((await s.control.usage(s.pair)) > 0);
  assert.deepEqual((await checkDatabase(s.db, join(s.dir, 'media'), true)).issues, []);
});

test('multi-image chat publication rolls back every attachment when an association write fails', async (t) => {
  const s = await fixture(t),
    first = await s.upload(),
    second = await s.upload();
  const prepare = s.db.prepare.bind(s.db);
  let associations = 0;
  const fail = t.mock.method(s.db, 'prepare', (sql: string) => {
    const statement = prepare(sql);
    return sql.startsWith('INSERT INTO message_media')
      ? {
          ...statement,
          run: async (...values: unknown[]) => {
            if (++associations === 2) throw new HttpError(503, 'injected attachment failure');
            return statement.run(...values);
          },
        }
      : statement;
  });
  const message = { clientId: randomUUID(), content: 'photos', mediaIds: [first.id, second.id] };
  await s.api(s.a.token).post('/api/messages', message).expect(503);
  fail.mock.restore();
  for (const table of ['messages', 'message_media', 'media', 'media_sizes'])
    assert.equal((await s.db.prepare(`SELECT COUNT(*) n FROM ${table}`).get())!.n, 0);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media_uploads').get())!.n, 2);
  assert.equal(await s.control.usage(s.pair), 0);
  await s.api(s.a.token).post('/api/messages', message).expect(201);
  await s.api(s.a.token).post('/api/messages', message).expect(200);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM messages').get())!.n, 1);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM message_media').get())!.n, 2);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media_uploads').get())!.n, 0);
  assert.deepEqual((await checkDatabase(s.db, join(s.dir, 'media'))).issues, []);
});

test('consistency check detects changed stored bytes and never modifies data', async (t) => {
  const s = await fixture(t),
    media = await s.upload();
  await s
    .api(s.a.token)
    .post('/api/moments', { mediaId: media.id, title: 'saved', date: '2026-10-09' })
    .expect(201);
  const row = (await s.db.prepare('SELECT * FROM media WHERE id=?').get(media.id))!;
  if (s.db.provider === 'postgres')
    await s.db
      .prepare('UPDATE media_chunks SET data=? WHERE name=? AND position=0')
      .run(Buffer.from('corrupt'), row.preview);
  else await writeFile(join(s.dir, 'media', String(row.preview)), 'corrupt');
  const report = await checkDatabase(s.db, join(s.dir, 'media'), true);
  assert.ok(report.issues.length > 0);
  assert.ok(await s.db.prepare('SELECT id FROM moments WHERE mediaId=?').get(media.id));
  if (s.db.provider === 'sqlite')
    assert.equal(await readFile(join(s.dir, 'media', String(row.preview)), 'utf8'), 'corrupt');
});
