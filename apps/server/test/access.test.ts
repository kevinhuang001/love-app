import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { setup } from './support.js';
import { executeTool } from '../src/ai.js';
test('authenticated request limits isolate accounts on one IP and persist across sessions', async (t) => {
  const s = await setup(t),
    a = await s.register('rate_a'),
    b = await s.register('rate_b');
  for (let i = 0; i < 240; i++) await s.api(a.token).get('/api/me').expect(200);
  await s.api(a.token).get('/api/me').expect(429);
  const renewed = await s.login('rate_a');
  assert.equal(renewed.status, 200);
  await s.api(renewed.body.token).get('/api/me').expect(429);
  await s.api(b.token).get('/api/me').expect(200);
  await s.api(b.token).post('/api/pairing/invite', {}).expect(200);
});
test('unpaired users only edit their own bounded profile and pair; feature APIs remain closed after unpair', async (t) => {
  const s = await setup(t),
    a = await s.register('gate_a'),
    b = await s.register('gate_b');
  for (const path of [
    '/api/messages',
    '/api/moments',
    '/api/anniversaries',
    '/api/todos',
    '/api/ai/settings',
    '/api/ai/tools',
    '/api/notifications/stream',
  ])
    await s.api(a.token).get(path).expect(409);
  for (const path of [
    '/api/messages',
    '/api/moments',
    '/api/anniversaries',
    '/api/todos',
    '/api/ai/settings',
    '/api/ai/tools/update_profile',
    '/api/media',
  ])
    await s.api(a.token).post(path, {}).expect(409);
  await s.api(a.token).patch('/api/ai/profile', { name: 'blocked' }).expect(409);
  await assert.rejects(
    async () => await executeTool(s.db, a.user.id, 'update_ai_profile', { name: 'blocked' }),
    /配对/,
  );
  await s.api(a.token).patch('/api/me', { name: 'My name' }).expect(200);
  const image = await sharp({
    create: { width: 800, height: 600, channels: 3, background: '#678576' },
  })
    .png()
    .toBuffer();
  const upload = () =>
    request(s.app)
      .post('/api/me/avatar')
      .auth(a.token, { type: 'bearer' })
      .attach('file', image, { filename: 'avatar.png', contentType: 'image/png' });
  const first = await upload().expect(201),
    second = await upload().expect(201);
  assert.notEqual(first.body.id, second.body.id);
  assert.equal(
    Number((await s.db.prepare('SELECT COUNT(*) n FROM media WHERE ownerId=?').get(a.user.id))!.n),
    1,
  );
  assert.equal((await s.api(a.token).get('/api/me')).body.user.avatar.id, second.body.id);
  assert.equal(
    (await readdir(join(s.dir, 'media'))).filter((n) => n.endsWith('.webp')).length,
    s.db.provider === 'postgres' ? 0 : 2,
  );
  await request(s.app)
    .post('/api/me/avatar')
    .auth(b.token, { type: 'bearer' })
    .attach('file', Buffer.alloc(2 * 1024 * 1024 + 1), {
      filename: 'large.png',
      contentType: 'image/png',
    })
    .expect(422);
  await s.pair(a.token, b.token);
  const profile = (await s.api(a.token).get('/api/me')).body;
  assert.equal(profile.couple.quotaBytes, 1024 * 1024 * 1024);
  assert.equal(profile.couple.storageBytes, 0);
  await s.api(a.token).get('/api/ai/settings').expect(200);
  await s.api(a.token).delete('/api/pairing').expect(204);
  await s.api(a.token).get('/api/ai/settings').expect(409);
  await s.api(a.token).patch('/api/me', { name: 'Still editable' }).expect(200);
});
test('each pairing receives its own capacity; zero blocks upload, default changes do not alter allocated pairs', async (t) => {
  const s = await setup(t),
    a = await s.register('quota_a'),
    b = await s.register('quota_b'),
    c = await s.register('quota_c'),
    d = await s.register('quota_d'),
    admin = s.api(s.adminToken);
  await admin
    .patch('/api/admin/settings', { ...(await s.control.readSettings()), defaultQuotaMiB: 0 })
    .expect(200);
  await s.pair(a.token, b.token);
  let p = (await s.api(a.token).get('/api/me')).body.couple;
  await s.api(a.token).post('/api/media', {}).expect(413);
  await admin
    .patch('/api/admin/settings', { ...(await s.control.readSettings()), defaultQuotaMiB: 5 })
    .expect(200);
  await s.pair(c.token, d.token);
  assert.equal((await s.api(c.token).get('/api/me')).body.couple.quotaBytes, 5 * 1048576);
  assert.equal((await s.api(a.token).get('/api/me')).body.couple.quotaBytes, 0);
  await admin.patch(`/api/admin/couples/${p.id}/quota`, { quotaMiB: 1 }).expect(204);
  const image = await sharp({
    create: { width: 400, height: 400, channels: 3, background: '#678576' },
  })
    .png()
    .toBuffer();
  const media = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', image, { filename: 'photo.png', contentType: 'image/png' })
    .expect(201);
  const updated = (await s.api(b.token).get('/api/me')).body.couple;
  assert.ok(updated.storageBytes > image.length);
  assert.equal(updated.quotaBytes, 1048576);
  await admin.patch(`/api/admin/couples/${p.id}/quota`, { quotaMiB: 0 }).expect(204);
  await s.api(b.token).post('/api/media', {}).expect(413);
  assert.ok(await s.db.prepare('SELECT id FROM media WHERE id=?').get(media.body.id));
});

test('concurrent uploads cannot overrun a pair quota and rejected files are removed', async (t) => {
  const s = await setup(t),
    a = await s.register('race_a'),
    b = await s.register('race_b');
  await s.pair(a.token, b.token);
  const pair = (await s.api(a.token).get('/api/me')).body.couple;
  await s
    .api(s.adminToken)
    .patch(`/api/admin/couples/${pair.id}/quota`, { quotaMiB: 1 })
    .expect(204);
  const { randomBytes } = await import('node:crypto');
  const image = await sharp(randomBytes(450 * 450 * 3), {
    raw: { width: 450, height: 450, channels: 3 },
  })
    .png()
    .toBuffer();
  const send = (token: string) =>
    request(s.app)
      .post('/api/media')
      .auth(token, { type: 'bearer' })
      .attach('file', image, { filename: 'photo.png', contentType: 'image/png' });
  const responses = await Promise.all([send(a.token), send(b.token)]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 413]);
  assert.ok((await s.control.usage(pair.id)) <= 1048576);
  assert.equal(
    Number((await s.db.prepare('SELECT COUNT(*) n FROM media WHERE coupleId=?').get(pair.id))!.n),
    1,
  );
  assert.equal(
    (await readdir(join(s.dir, 'media'))).filter((n) => n !== 'tmp').length,
    s.db.provider === 'postgres' ? 0 : 3,
  );
});
