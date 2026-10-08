import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { io } from 'socket.io-client';
import { aiWorker } from '../src/ai.js';
import { setup } from './support.js';

test('ordered multi-image messages are isolated, idempotent and supplied in every AI tool round', async (t) => {
  const s = await setup(t),
    a = await s.register('multi_a'),
    b = await s.register('multi_b'),
    stranger = await s.register('multi_stranger'),
    peer = await s.register('multi_peer');
  await s.pair(a.token, b.token);
  await s.pair(stranger.token, peer.token);
  async function upload(token: string, color: string) {
    const image = await sharp({
      create: { width: 320, height: 240, channels: 3, background: color },
    })
      .png()
      .toBuffer();
    return (
      await request(s.app)
        .post('/api/media')
        .auth(token, { type: 'bearer' })
        .attach('file', image, { filename: 'photo.png', contentType: 'image/png' })
        .expect(201)
    ).body;
  }
  const first = await upload(a.token, '#1a604e'),
    second = await upload(a.token, '#bd9c63'),
    other = await upload(b.token, '#336699'),
    foreign = await upload(stranger.token, '#eeeeee');
  for (const mediaIds of [
    [first.id, other.id],
    [first.id, foreign.id],
  ])
    await s.api(a.token).post('/api/messages', { clientId: randomUUID(), mediaIds }).expect(403);
  await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), mediaIds: [first.id, first.id] })
    .expect(400);
  await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), mediaId: first.id })
    .expect(400);
  await s.api(a.token).post('/api/messages', { clientId: randomUUID(), mediaIds: [] }).expect(400);
  assert.equal((await s.api(a.token).get('/api/messages')).body.items.length, 0);

  await s.api(a.token).patch('/api/ai/profile', { name: '松子' }).expect(204);
  await s
    .api(b.token)
    .post('/api/ai/settings', {
      baseUrl: 'https://provider.example/v1',
      model: 'vision',
      apiKey: 'private-key',
      enabled: true,
    })
    .expect(204);
  const socket = io(s.base, {
    auth: { token: b.token },
    transports: ['websocket'],
    reconnection: false,
  });
  t.after(() => socket.disconnect());
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  const received = new Promise<any>((resolve) => socket.once('message:new', resolve));
  const body = {
    clientId: randomUUID(),
    content: '@松子 比较两张照片，并用第二张设为我的头像',
    mediaIds: [first.id, second.id],
  };
  const response = await s.api(a.token).post('/api/messages', body).expect(201);
  assert.deepEqual(
    response.body.attachments.map((media: any) => media.id),
    body.mediaIds,
  );
  assert.deepEqual(
    (await received).attachments.map((media: any) => media.id),
    body.mediaIds,
  );
  const retry = await s.api(a.token).post('/api/messages', body).expect(200);
  assert.equal(retry.body.id, response.body.id);
  assert.equal(
    (await s.db
      .prepare('SELECT COUNT(*) n FROM message_media WHERE messageId=?')
      .get(response.body.id))!.n,
    2,
  );
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM ai_jobs').get())!.n, 1);

  const expected = await Promise.all(
    body.mediaIds.map(async (id) => {
      const row = (await s.db.prepare('SELECT preview FROM media WHERE id=?').get(id))!;
      return `data:image/webp;base64,${(await s.mediaRepository.read(String(row.preview))).toString('base64')}`;
    }),
  );
  let rounds = 0;
  const worker = aiWorker({
    db: s.db,
    uploads: join(s.dir, 'media'),
    secret: 'test-secret-at-least-thirty-two-chars',
    notify: async () => {},
    changed: () => {},
    completion: async (_url, key, input) => {
      assert.equal(key, 'private-key');
      const prompt = input as any,
        user = prompt.messages[1];
      const images = user.content.filter((part: any) => part.type === 'image_url');
      assert.deepEqual(
        images.map((part: any) => part.image_url.url),
        expected,
      );
      const descriptions = user.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('\n');
      assert.ok(descriptions.includes(`附件 1，媒体 ID: ${first.id}`));
      assert.ok(descriptions.includes(`附件 2，媒体 ID: ${second.id}`));
      assert.ok(!descriptions.includes(foreign.id));
      rounds++;
      return rounds === 1
        ? {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'avatar-second',
                      type: 'function',
                      function: {
                        name: 'update_profile',
                        arguments: JSON.stringify({ avatarMediaId: second.id }),
                      },
                    },
                  ],
                },
              },
            ],
          }
        : { choices: [{ message: { role: 'assistant', content: '已用第二张照片更新头像。' } }] };
    },
  });
  await worker();
  assert.equal(rounds, 2);
  const job = (await s.db
    .prepare('SELECT * FROM ai_jobs WHERE messageId=?')
    .get(response.body.id))!;
  assert.equal(job.status, 'done');
  assert.ok(
    !String(job.transcript).includes('data:image/'),
    'image bytes must not be duplicated in the database',
  );
  assert.equal((await s.api(a.token).get('/api/me')).body.user.avatar.id, second.id);
  const messages = (await s.api(b.token).get('/api/messages')).body.items;
  assert.equal(messages.length, 2);
  assert.equal(messages[1].assistant.name, '松子');
  assert.deepEqual(messages[1].attachments, []);
  assert.equal((await s.api(stranger.token).get('/api/messages')).body.items.length, 0);
});
