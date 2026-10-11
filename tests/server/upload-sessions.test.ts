import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { MediaRepository } from '../../apps/server/src/media-repository.js';
import { today } from '@love/calendar';
import request from 'supertest';
import sharp from 'sharp';
import { setup } from './support.js';
import { UploadSessions, UPLOAD_CHUNK_BYTES } from '../../apps/server/src/upload-sessions.js';
import { HttpError } from '../../apps/server/src/errors.js';
const digest = (b: Buffer) => createHash('sha256').update(b).digest('hex');
async function fixture(t: Parameters<typeof setup>[0]) {
  const s = await setup(t),
    a = await s.register('queue_a'),
    b = await s.register('queue_b');
  await s.pair(a.token, b.token);
  const image = await sharp({
    create: { width: 800, height: 600, channels: 3, background: '#526c5a' },
  })
    .withExif({ IFD2: { DateTimeOriginal: '2024:02:29 12:00:00' } })
    .jpeg()
    .toBuffer();
  const spec = {
    id: randomUUID(),
    files: [{ name: 'photo.jpg', type: 'image/jpeg', size: image.length }],
    target: 'album',
    title: '背景回忆',
  };
  const chunk = (
    id = spec.id,
    part = 0,
    index = 0,
    bytes = image,
    hash = digest(bytes),
    token = a.token,
  ) =>
    request(s.app)
      .put(`/api/uploads/${id}/${part}/${index}`)
      .auth(token, { type: 'bearer' })
      .set('Content-Type', 'application/octet-stream')
      .set('X-Chunk-Sha256', hash)
      .send(bytes);
  return { ...s, a, b, image, spec, chunk };
}
test('staged chunks survive a restart and commit media, memory and quota exactly once', async (t) => {
  const s = await fixture(t);
  const profile = (await s.api(s.a.token).get('/api/me')).body;
  await s.api(s.a.token).post('/api/uploads', s.spec).expect(201);
  await s.chunk().expect(200);
  await s.chunk().expect(200);
  const restarted = new UploadSessions(join(s.dir, 'media', 'tmp', 'sessions'));
  assert.deepEqual(
    (await restarted.status(await restarted.get(s.a.user.id, profile.couple.id, s.spec.id)))
      .offsets,
    [s.image.length],
  );
  assert.equal(await s.control.usage(profile.couple.id), 0);
  const response = await s
    .api(s.a.token)
    .post(`/api/uploads/${s.spec.id}/complete`, {})
    .expect(201);
  assert.equal(response.body.id, s.spec.id);
  assert.equal(response.body.capturedDate, '2024-02-29');
  assert.equal(response.body.fallbackDate, undefined);
  await s.api(s.a.token).post(`/api/uploads/${s.spec.id}/complete`, {}).expect(200);
  const retry = await s.api(s.a.token).post('/api/uploads', s.spec).expect(200);
  assert.equal(retry.body.result.id, s.spec.id);
  assert.equal(retry.body.result.capturedDate, '2024-02-29');
  const album = (await s.api(s.b.token).get('/api/moments')).body.items;
  assert.equal(album.length, 1);
  assert.equal(album[0].date, '2024-02-29');
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media').get())!.n, 1);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media_sizes').get())!.n, 1);
  await s.api(s.a.token).delete(`/api/uploads/${s.spec.id}`).expect(409);
});
test('failed publication rolls back every billable row and retained chunks allow retry', async (t) => {
  const s = await fixture(t),
    pair = (await s.api(s.a.token).get('/api/me')).body.couple.id;
  await s.api(s.a.token).post('/api/uploads', s.spec).expect(201);
  await s.chunk().expect(200);
  const prepare = s.db.prepare.bind(s.db),
    fault = t.mock.method(s.db, 'prepare', (sql: string) => {
      const statement = prepare(sql);
      return sql.startsWith('INSERT INTO moments')
        ? {
            ...statement,
            run: async () => {
              throw new HttpError(503, '数据库暂时不可用');
            },
          }
        : statement;
    });
  await s.api(s.a.token).post(`/api/uploads/${s.spec.id}/complete`, {}).expect(503);
  fault.mock.restore();
  for (const table of ['media', 'media_sizes', 'media_uploads', 'moments'])
    assert.equal((await s.db.prepare(`SELECT COUNT(*) n FROM ${table}`).get())!.n, 0);
  assert.equal(await s.control.usage(pair), 0);
  const pending = (await s.api(s.a.token).get(`/api/uploads/${s.spec.id}`)).body;
  assert.deepEqual(pending.offsets, [s.image.length]);
  assert.equal(pending.result, undefined);
  await s.api(s.a.token).post(`/api/uploads/${s.spec.id}/complete`, {}).expect(201);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM moments').get())!.n, 1);
});
test('missing capture date uses today and its notice survives cleanup and a lost completion response', async (t) => {
  const s = await fixture(t);
  const image = await sharp({
    create: { width: 80, height: 60, channels: 3, background: '#53765b' },
  })
    .png()
    .toBuffer();
  const spec = {
    ...s.spec,
    date: '2000-01-01',
    files: [{ name: 'no-date.png', type: 'image/png', size: image.length }],
  };
  const date = today();
  await s.api(s.a.token).post('/api/uploads', spec).expect(201);
  await s.chunk(spec.id, 0, 0, image).expect(200);
  const result = await s.api(s.a.token).post(`/api/uploads/${spec.id}/complete`, {}).expect(201);
  assert.equal(result.body.capturedDate, null);
  assert.equal(result.body.fallbackDate, date);
  assert.equal((await s.api(s.b.token).get('/api/moments')).body.items[0].date, date);
  // Reconciliation waits for commit cleanup under the same task lock.
  await s.api(s.a.token).post('/api/uploads', spec).expect(200);
  const sessions = new UploadSessions(join(s.dir, 'media', 'tmp', 'sessions'));
  assert.deepEqual(await readdir(sessions.directory(s.a.user.id, spec.id)), ['result.json']);
  assert.deepEqual(await sessions.outcome(s.a.user.id, spec.id), {
    capturedDate: null,
    fallbackDate: date,
  });
  const retried = await s.api(s.a.token).post('/api/uploads', spec).expect(200);
  assert.equal(retried.body.result.fallbackDate, date);
  assert.equal(
    (await s.api(s.a.token).get(`/api/uploads/${spec.id}`)).body.result.fallbackDate,
    date,
  );
  assert.equal(
    (await s.api(s.a.token).post(`/api/uploads/${spec.id}/complete`, {}).expect(200)).body
      .fallbackDate,
    date,
  );
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM moments').get())!.n, 1);
});
test('chunk corruption, incomplete files, changed identity and partner access are rejected', async (t) => {
  const s = await fixture(t);
  await s.api(s.a.token).post('/api/uploads', s.spec).expect(201);
  await s.chunk(s.spec.id, 0, 0, s.image, '0'.repeat(64)).expect(422);
  await s.api(s.a.token).post(`/api/uploads/${s.spec.id}/complete`, {}).expect(409);
  await s
    .api(s.a.token)
    .post('/api/uploads', { ...s.spec, title: 'changed' })
    .expect(409);
  await s.chunk(s.spec.id, 0, 0, s.image, digest(s.image), s.b.token).expect(404);
  await s.chunk().expect(200);
  const changed = Buffer.from(s.image);
  changed[12] ^= 1;
  await s.chunk(s.spec.id, 0, 0, changed).expect(409);
  await s.api(s.a.token).delete(`/api/uploads/${s.spec.id}`).expect(204);
  await s.api(s.a.token).post('/api/uploads', s.spec).expect(410);
  await s.chunk().expect(410);
});
test('personal avatar supports the queue before pairing and stays personal', async (t) => {
  const s = await setup(t),
    a = await s.register('avatar_queue');
  const bytes = await sharp({
      create: { width: 80, height: 60, channels: 3, background: '#426547' },
    })
      .png()
      .toBuffer(),
    id = randomUUID();
  await s
    .api(a.token)
    .post('/api/uploads', {
      id,
      target: 'avatar',
      files: [{ name: 'avatar.png', type: 'image/png', size: bytes.length }],
    })
    .expect(201);
  await request(s.app)
    .put(`/api/uploads/${id}/0/0`)
    .auth(a.token, { type: 'bearer' })
    .set('Content-Type', 'application/octet-stream')
    .set('X-Chunk-Sha256', digest(bytes))
    .send(bytes)
    .expect(200);
  await s.api(a.token).post(`/api/uploads/${id}/complete`, {}).expect(201);
  await s.api(a.token).post(`/api/uploads/${id}/complete`, {}).expect(200);
  assert.equal((await s.api(a.token).get('/api/me')).body.user.avatar.id, id);
  assert.equal(
    (await s.db.prepare('SELECT coupleId FROM media WHERE id=?').get(id))!.coupleId,
    null,
  );
});
test('a multi-chunk upload resumes at the first missing chunk, including a partial last chunk', async (t) => {
  const s = await fixture(t),
    bytes = Buffer.alloc(UPLOAD_CHUNK_BYTES + 37, 123),
    id = randomUUID();
  const spec = {
    ...s.spec,
    id,
    files: [{ name: 'big.jpg', type: 'image/jpeg', size: bytes.length }],
  };
  await s.api(s.a.token).post('/api/uploads', spec).expect(201);
  await s.chunk(id, 0, 1, bytes.subarray(UPLOAD_CHUNK_BYTES)).expect(200);
  assert.deepEqual((await s.api(s.a.token).get(`/api/uploads/${id}`)).body.offsets, [0]);
  await s.chunk(id, 0, 0, bytes.subarray(0, UPLOAD_CHUNK_BYTES)).expect(200);
  assert.deepEqual((await s.api(s.a.token).get(`/api/uploads/${id}`)).body.offsets, [bytes.length]);
});

test('cancelling before creation blocks late init and remains idempotent', async (t) => {
  const s = await fixture(t),
    id = randomUUID();
  await s.api(s.a.token).delete(`/api/uploads/${id}`).expect(204);
  await s.api(s.a.token).delete(`/api/uploads/${id}`).expect(204);
  await s
    .api(s.a.token)
    .post('/api/uploads', { ...s.spec, id })
    .expect(410);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media').get())!.n, 0);
});

test('database phase is observable; cancellation retains cleanup proof until files and database chunks are removed', async (t) => {
  const s = await fixture(t);
  let reached!: () => void;
  const staged = new Promise<void>((resolve) => {
    reached = resolve;
  });
  const originalStage = MediaRepository.prototype.stage;
  const originalDiscard = MediaRepository.prototype.discard;
  let names: string[] = [],
    failCleanup = true;
  t.mock.method(
    MediaRepository.prototype,
    'stage',
    async function (
      this: MediaRepository,
      files: string[],
      sizes: number[],
      transactional: boolean,
      signal: AbortSignal,
      progress: (bytes: number, total: number) => void,
    ) {
      names = files.filter(Boolean);
      await originalStage.call(this, files, sizes, transactional, signal, progress);
      reached();
      await new Promise<void>((_resolve, reject) => {
        if (signal.aborted) reject(signal.reason);
        else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    },
  );
  t.mock.method(
    MediaRepository.prototype,
    'discard',
    async function (this: MediaRepository, files: string[], strict = false) {
      if (!strict) return; // Simulate a failed best-effort cleanup while the external DB is unavailable.
      if (files.length && failCleanup) throw new HttpError(503, '数据库暂时不可用，取消未确认');
      return originalDiscard.call(this, files, strict);
    },
  );
  await s.api(s.a.token).post('/api/uploads', s.spec).expect(201);
  await s.chunk().expect(200);
  const completion = s
    .api(s.a.token)
    .post(`/api/uploads/${s.spec.id}/complete`, {})
    .then((r) => r);
  await staged;
  const state = (await s.api(s.a.token).get(`/api/uploads/${s.spec.id}`).expect(200)).body;
  assert.equal(state.phase, 'database');
  assert.equal(state.storage, s.db.provider);
  assert.equal(state.databaseBytes, state.databaseTotal);
  assert.equal(state.result, undefined);
  await s.api(s.b.token).get(`/api/uploads/${s.spec.id}`).expect(404);
  if (s.db.provider === 'postgres') {
    assert.ok(state.databaseTotal > 0);
    assert.ok(Number((await s.db.prepare('SELECT COUNT(*) n FROM media_chunks').get())!.n) > 0);
  } else assert.equal(state.databaseTotal, 0); // SQLite writes metadata, no second binary transfer.
  await s.api(s.a.token).delete(`/api/uploads/${s.spec.id}`).expect(503);
  assert.equal((await completion).status, 410);
  const sessions = new UploadSessions(join(s.dir, 'media', 'tmp', 'sessions'));
  assert.deepEqual(await sessions.cleanupNames(s.a.user.id, s.spec.id), names);
  assert.ok((await readdir(sessions.directory(s.a.user.id, s.spec.id))).includes('0-0'));
  failCleanup = false;
  await s.api(s.a.token).delete(`/api/uploads/${s.spec.id}`).expect(204);
  await s.api(s.a.token).delete(`/api/uploads/${s.spec.id}`).expect(204);
  assert.deepEqual(await readdir(sessions.directory(s.a.user.id, s.spec.id)), ['session.json']);
  for (const name of names)
    await assert.rejects(stat(join(s.dir, 'media', name)), { code: 'ENOENT' });
  for (const table of [
    'media',
    'media_uploads',
    'media_sizes',
    'moments',
    ...(s.db.provider === 'postgres' ? ['media_files', 'media_chunks'] : []),
  ])
    assert.equal(Number((await s.db.prepare(`SELECT COUNT(*) n FROM ${table}`).get())!.n), 0);
  await s.api(s.a.token).post('/api/uploads', s.spec).expect(410);
});
