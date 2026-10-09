import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, readdir, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { setup } from './support.js';
import {
  inspectMediaCleanup,
  applyMediaCleanup,
  cleanupFingerprint,
} from '../src/media-cleanup.js';

const before = '2026-10-09T00:00:00.000Z';
test('cleanup deletes cancelled uploads and releases quota while protecting every business reference', async (t) => {
  const s = await setup(t),
    a = await s.register('cleanup_a'),
    b = await s.register('cleanup_b');
  await s.pair(a.token, b.token);
  const profile = (await s.api(a.token).get('/api/me')).body;
  const owner = profile.user.id,
    pair = profile.couple.id;
  const directory = join(s.dir, 'media');
  const names = [
    'orphan',
    'album',
    'chat',
    'avatar',
    'ai-avatar',
    'historical-avatar',
    'pending-tool',
    'recent',
  ];
  for (const id of names) {
    const file = id + '.webp';
    await writeFile(join(directory, file), 'media:' + id);
    await s.db
      .prepare(
        'INSERT INTO media(id,coupleId,ownerId,kind,original,preview,thumbnail,createdAt) VALUES(?,?,?,?,?,?,?,?)',
      )
      .run(
        id,
        pair,
        owner,
        'image',
        file,
        file,
        file,
        id === 'recent' ? '2026-10-09T00:30:00Z' : '2026-10-01T00:00:00Z',
      );
    await s.db.prepare('INSERT INTO media_sizes VALUES(?,?,?,?,?)').run(id, 10, 0, 0, 10);
    await s.mediaRepository.stage([file], [Buffer.byteLength('media:' + id)]);
    await s.db.transaction(() => s.mediaRepository.bind(id, [file]));
  }
  await s.db
    .prepare('INSERT INTO moments(id,coupleId,ownerId,title,mediaId,date) VALUES(?,?,?,?,?,?)')
    .run('moment', pair, owner, 'photo', 'album', '2026-10-01');
  const msg = await s.db
    .prepare(
      'INSERT INTO messages(coupleId,senderId,clientId,content,createdAt,assistantAvatarMediaId) VALUES(?,?,?,?,?,?)',
    )
    .run(pair, owner, 'message', 'hello', before, 'historical-avatar');
  await s.db.prepare('INSERT INTO message_media VALUES(?,?,?)').run(msg.lastInsertRowid, 'chat', 0);
  await s.db.prepare('UPDATE users SET avatarMediaId=? WHERE id=?').run('avatar', owner);
  await s.db
    .prepare(
      'INSERT INTO couple_ai_settings(coupleId,baseUrl,model,secret,enabled,name,avatarMediaId) VALUES(?,?,?,?,?,?,?)',
    )
    .run(pair, 'http://example.test', 'model', '', 0, 'helper', 'ai-avatar');
  await s.db
    .prepare('INSERT INTO ai_jobs(messageId,userId,transcript) VALUES(?,?,?)')
    .run(
      msg.lastInsertRowid,
      owner,
      JSON.stringify([
        { tool_calls: [{ function: { arguments: JSON.stringify({ mediaId: 'pending-tool' }) } }] },
      ]),
    );
  await writeFile(join(directory, 'loose.mp4'), 'unused bytes');
  await mkdir(join(directory, 'tmp'), { recursive: true });
  await writeFile(join(directory, 'tmp', 'cancelled'), 'partial upload');
  await writeFile(join(s.dir, 'outside'), 'protected');
  await symlink(join(s.dir, 'outside'), join(directory, 'link'));
  if (s.db.provider === 'postgres') {
    await s.db
      .prepare('INSERT INTO media_files(name,bytes,sha256,complete,updatedAt) VALUES(?,?,?,?,?)')
      .run('abandoned.mp4', 3, '', 0, '2026-10-01T00:00:00Z');
    await s.db
      .prepare('INSERT INTO media_chunks VALUES(?,?,?)')
      .run('abandoned.mp4', 0, Buffer.from('old'));
    await s.db
      .prepare('INSERT INTO media_files(name,bytes,sha256,complete,updatedAt) VALUES(?,?,?,?,?)')
      .run('active.mp4', 3, '', 0, '2026-10-09T00:30:00Z');
    await writeFile(join(directory, 'active.mp4'), 'active');
  }
  const plan = await inspectMediaCleanup(s.db, directory);
  assert.deepEqual(
    plan.media.map((r) => r.id),
    ['orphan', 'pending-tool', 'recent'],
  );
  assert.equal(await s.control.usage(pair), 80);
  assert.equal(await readFile(join(directory, 'orphan.webp'), 'utf8'), 'media:orphan');
  const result = await applyMediaCleanup(s.db, directory, plan, cleanupFingerprint(plan));
  assert.equal(result.media, 3);
  assert.equal(await s.control.usage(pair), 50);
  assert.equal(await s.db.prepare('SELECT id FROM media WHERE id=?').get('orphan'), undefined);
  assert.equal(
    await s.db.prepare('SELECT mediaId FROM media_sizes WHERE mediaId=?').get('orphan'),
    undefined,
  );
  for (const id of names.filter((id) => !['orphan', 'pending-tool', 'recent'].includes(id)))
    assert.ok(await s.db.prepare('SELECT id FROM media WHERE id=?').get(id));
  assert.equal(await readFile(join(s.dir, 'outside'), 'utf8'), 'protected');
  assert.deepEqual((await inspectMediaCleanup(s.db, directory)).media, []);
  assert.ok(!(await readdir(directory)).includes('loose.mp4'));
  if (s.db.provider === 'postgres') {
    assert.equal(
      await s.db.prepare('SELECT name FROM media_files WHERE mediaId=?').get('orphan'),
      undefined,
    );
    assert.equal(
      await s.db.prepare('SELECT name FROM media_chunks WHERE name=?').get('orphan.webp'),
      undefined,
    );
    assert.equal(
      await s.db.prepare('SELECT name FROM media_chunks WHERE name=?').get('abandoned.mp4'),
      undefined,
    );
    assert.equal(
      await s.db.prepare('SELECT name FROM media_files WHERE name=?').get('active.mp4'),
      undefined,
    );
  }
});

test('cleanup refuses a changed preview before deleting records or files', async (t) => {
  const s = await setup(t),
    directory = join(s.dir, 'media');
  await s.db
    .prepare('INSERT INTO media(id,kind,original,preview,thumbnail,createdAt) VALUES(?,?,?,?,?,?)')
    .run('orphan', 'image', '', 'a.webp', 'a.webp', '2026-10-01');
  await writeFile(join(directory, 'a.webp'), 'original');
  const plan = await inspectMediaCleanup(s.db, directory);
  await writeFile(join(directory, 'a.webp'), 'changed since preview');
  await assert.rejects(
    applyMediaCleanup(s.db, directory, plan, cleanupFingerprint(plan)),
    /清单发生变化/,
  );
  assert.ok(await s.db.prepare('SELECT id FROM media WHERE id=?').get('orphan'));
  assert.equal(await readFile(join(directory, 'a.webp'), 'utf8'), 'changed since preview');
});

test('draft deletion cannot remove another user media or a published memory, and frees cancelled upload bytes', async (t) => {
  const s = await setup(t),
    a = await s.register('draft_a'),
    b = await s.register('draft_b');
  await s.pair(a.token, b.token);
  const image = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#345' } })
    .png()
    .toBuffer();
  const media = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', image, { filename: 'a.png', contentType: 'image/png' })
    .expect(201);
  const id = media.body.id,
    pair = (await s.api(a.token).get('/api/me')).body.couple.id;
  assert.equal(await s.control.usage(pair), 0);
  await s
    .api(b.token)
    .delete('/api/media/' + id)
    .expect(204);
  assert.ok(await s.db.prepare('SELECT id FROM media_uploads WHERE id=?').get(id));
  await s
    .api(a.token)
    .delete('/api/media/' + id)
    .expect(204);
  assert.equal(await s.control.usage(pair), 0);
  assert.equal(await s.db.prepare('SELECT id FROM media WHERE id=?').get(id), undefined);
  const published = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', image, { filename: 'b.png', contentType: 'image/png' })
    .expect(201);
  await s
    .api(a.token)
    .post('/api/moments')
    .send({ mediaId: published.body.id, title: 'saved', date: '2026-10-01' })
    .expect(201);
  await s
    .api(a.token)
    .delete('/api/media/' + published.body.id)
    .expect(409);
  assert.ok(await s.db.prepare('SELECT id FROM media WHERE id=?').get(published.body.id));
});

test('disconnect during media staging cancels the write, removes generated files and bills nothing', async (t) => {
  const s = await setup(t),
    a = await s.register('cancel_a'),
    b = await s.register('cancel_b');
  await s.pair(a.token, b.token);
  const pair = (await s.api(a.token).get('/api/me')).body.couple.id;
  const image = await sharp({
    create: { width: 100, height: 100, channels: 3, background: '#345' },
  })
    .png()
    .toBuffer();
  let started!: () => void;
  const staging = new Promise<void>((resolve) => {
    started = resolve;
  });
  t.mock.method(
    s.mediaRepository,
    'stage',
    async (_names: string[], _sizes: number[], _transactional: boolean, signal: AbortSignal) => {
      started();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true }),
      );
      signal.throwIfAborted();
    },
  );
  const form = new FormData();
  form.append('file', new Blob([image], { type: 'image/png' }), 'cancel.png');
  const controller = new AbortController();
  const uploading = fetch(s.base + '/api/media', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + a.token },
    body: form,
    signal: controller.signal,
  });
  const aborted = assert.rejects(uploading, { name: 'AbortError' });
  await staging;
  controller.abort();
  await aborted;
  const directory = join(s.dir, 'media');
  for (let i = 0; i < 100 && (await readdir(directory)).some((n) => n !== 'tmp'); i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(await readdir(directory), ['tmp']);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media').get())!.n, 0);
  assert.equal(await s.control.usage(pair), 0);
});
