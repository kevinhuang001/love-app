import { createServer } from 'node:http';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { io as clientSocket } from 'socket.io-client';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import {
  complete,
  aiWorker,
  encryptKey,
  executeTool,
  publicAddress,
  validateAIUrl,
} from '../src/ai.js';

async function setup(t: Parameters<Parameters<typeof test>[1]>[0]) {
  const dir = await mkdtemp(join(tmpdir(), 'love-test-'));
  const delivered: { tokens: string[]; messageId: number }[] = [];
  const server = createApp({
    database: join(dir, 'test.sqlite'),
    uploads: join(dir, 'media'),
    mediaSecret: 'test-secret-at-least-thirty-two-chars',
    pushSender: async (tokens, messageId) => {
      delivered.push({ tokens, messageId });
      return tokens.filter((token) => token.startsWith('invalid'));
    },
  });
  await new Promise<void>((resolve) => server.http.listen(0, '127.0.0.1', resolve));
  const address = server.http.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  t.after(async () => {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  });
  const register = async (username: string) => {
    const response = await request(server.app)
      .post('/api/auth/register')
      .send({ username, name: username, password: 'password123' })
      .expect(201);
    return response.body as { token: string; user: { id: string } };
  };
  const api = (token: string) => ({
    get: (path: string) => request(server.app).get(path).auth(token, { type: 'bearer' }),
    post: (path: string, body: unknown) =>
      request(server.app).post(path).auth(token, { type: 'bearer' }).send(body),
    delete: (path: string) => request(server.app).delete(path).auth(token, { type: 'bearer' }),
    patch: (path: string, body: unknown) =>
      request(server.app).patch(path).auth(token, { type: 'bearer' }).send(body),
  });
  const pair = async (a: string, b: string) => {
    const invite = await api(a).post('/api/pairing/invite', {}).expect(200);
    await api(b).post('/api/pairing/join', { code: invite.body.code }).expect(200);
    return invite.body.code;
  };
  return { ...server, api, register, pair, base, dir, delivered };
}

test('authentication, one-use pairing and isolation between couples', async (t) => {
  const s = await setup(t),
    a = await s.register('alice'),
    b = await s.register('bob'),
    c = await s.register('charlie'),
    d = await s.register('dana');
  await request(s.app).get('/api/me').expect(401);
  await request(s.app)
    .post('/api/auth/login')
    .send({ username: 'alice', password: 'wrong123' })
    .expect(401);
  const code = await s.pair(a.token, b.token);
  await s.pair(c.token, d.token);
  await s.api(c.token).post('/api/pairing/join', { code }).expect(400);
  const message = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '只属于我们' })
    .expect(201);
  assert.equal(message.body.content, '只属于我们');
  assert.equal((await s.api(b.token).get('/api/messages')).body.items.length, 1);
  assert.equal((await s.api(c.token).get('/api/messages')).body.items.length, 0);
  const date = await s
    .api(a.token)
    .post('/api/anniversaries', { title: '生日', date: '2026-02-28', yearly: true })
    .expect(201);
  await s.api(c.token).delete(`/api/anniversaries/${date.body.id}`).expect(404);
  await s
    .api(a.token)
    .post('/api/anniversaries', { title: '错误日期', date: '2026-02-31' })
    .expect(400);
  await s.api(a.token).delete('/api/pairing').expect(204);
  await s.api(a.token).get('/api/messages').expect(409);
  await s.pair(a.token, b.token);
  assert.equal(
    (await s.api(a.token).get('/api/messages')).body.items.length,
    0,
    'a new relationship cannot inherit archived messages',
  );
});

test('socket delivery, idempotent send, read receipts, pagination and logout', async (t) => {
  const s = await setup(t),
    a = await s.register('alice'),
    b = await s.register('bob');
  await s.pair(a.token, b.token);
  const socket = clientSocket(s.base, {
    auth: { token: b.token },
    transports: ['websocket'],
    reconnection: false,
  });
  t.after(() => socket.disconnect());
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
  });
  const incoming = new Promise<any>((resolve) => socket.once('message:new', resolve));
  const body = { clientId: randomUUID(), content: 'hello' };
  const first = await s.api(a.token).post('/api/messages', body).expect(201);
  assert.equal((await incoming).id, first.body.id);
  const duplicate = await s.api(a.token).post('/api/messages', body).expect(200);
  assert.equal(duplicate.body.id, first.body.id);
  const read = new Promise<any>((resolve) => socket.once('message:read', resolve));
  await s.api(b.token).post('/api/messages/read', { throughId: first.body.id }).expect(204);
  await read;
  assert.ok((await s.api(a.token).get('/api/messages')).body.items[0].readAt);
  for (let i = 0; i < 52; i++)
    await s
      .api(a.token)
      .post('/api/messages', { clientId: randomUUID(), content: String(i) })
      .expect(201);
  const recent = (await s.api(a.token).get('/api/messages')).body;
  assert.equal(recent.items.length, 50);
  assert.equal(recent.hasMore, true);
  const older = (await s.api(a.token).get(`/api/messages?before=${recent.items[0].id}`)).body;
  assert.equal(older.items.length, 3);
  const disconnected = new Promise<void>((resolve) => socket.once('disconnect', () => resolve()));
  await s.api(b.token).post('/api/auth/logout', {}).expect(204);
  await disconnected;
  await s.api(b.token).get('/api/me').expect(401);
});

test('image/video compression, signed preview, avatar and media ownership', async (t) => {
  const s = await setup(t),
    a = await s.register('alice'),
    b = await s.register('bob'),
    stranger = await s.register('stranger');
  await s.pair(a.token, b.token);
  const image = await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: '#a64562' },
  })
    .png()
    .toBuffer();
  const upload = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', image, { filename: 'photo.png', contentType: 'image/png' })
    .expect(201);
  assert.equal(upload.body.kind, 'image');
  const thumb = await request(s.app).get(upload.body.thumbnailUrl).expect(200);
  const info = await sharp(thumb.body).metadata();
  assert.ok(info.width! <= 480);
  assert.equal(info.format, 'webp');
  await request(s.app)
    .get(`/api/media/${upload.body.id}/thumbnail?expires=123&signature=no`)
    .expect(403);
  await s
    .api(b.token)
    .post('/api/messages', { clientId: randomUUID(), mediaId: upload.body.id })
    .expect(403);
  await s
    .api(a.token)
    .patch('/api/me', { name: '小爱', avatarMediaId: upload.body.id })
    .expect(200);
  assert.equal((await s.api(b.token).get('/api/me')).body.partner.avatar.id, upload.body.id);
  await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', Buffer.from('fake image'), { filename: 'fake.png', contentType: 'image/png' })
    .expect(422);
  const videoPath = join(s.dir, 'sample.mp4');
  const ffmpeg = spawnSync('ffmpeg', [
    '-nostdin',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'color=c=pink:s=640x360:d=1',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    videoPath,
  ]);
  assert.equal(ffmpeg.status, 0);
  const video = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', await readFile(videoPath), { filename: 'video.mp4', contentType: 'video/mp4' })
    .expect(201);
  assert.equal(video.body.kind, 'video');
  assert.ok(video.body.duration > 0);
  await request(s.app).get(video.body.previewUrl).set('Range', 'bytes=0-99').expect(206);
  const memory = await s
    .api(a.token)
    .post('/api/moments', { mediaId: video.body.id, title: '一起看海', date: '2026-10-05' })
    .expect(201);
  assert.equal((await s.api(b.token).get('/api/moments')).body[0].media.kind, 'video');
  await s.api(b.token).delete(`/api/moments/${memory.body.id}`).expect(404);
  await s
    .api(a.token)
    .patch(`/api/moments/${memory.body.id}`, { title: '新的描述', date: '2026-10-04' })
    .expect(204);
  await s.api(stranger.token).get('/api/moments').expect(409);
});

test('durable push, invalid token cleanup and suppression for read messages', async (t) => {
  const s = await setup(t),
    a = await s.register('alice'),
    b = await s.register('bob');
  await s.pair(a.token, b.token);
  await s.api(b.token).post('/api/devices', { token: 'valid-device-token-00000000' }).expect(204);
  await s.api(b.token).post('/api/devices', { token: 'invalid-device-token-000000' }).expect(204);
  const message = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '提醒' })
    .expect(201);
  await s.tick();
  assert.equal(s.delivered.length, 1);
  assert.equal(s.delivered[0].messageId, message.body.id);
  assert.equal(s.db.prepare('SELECT * FROM devices').all().length, 1);
  const next = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '已读' })
    .expect(201);
  await s.api(b.token).post('/api/messages/read', { throughId: next.body.id }).expect(204);
  await s.tick();
  assert.equal(s.delivered.length, 1);
  await s
    .api(b.token)
    .post('/api/auth/logout', { deviceToken: 'valid-device-token-00000000' })
    .expect(204);
  assert.equal(s.db.prepare('SELECT * FROM devices').all().length, 0);
});

test('@ai encrypted config, tool execution and per-user permissions', async (t) => {
  const s = await setup(t),
    a = await s.register('alice'),
    b = await s.register('bob'),
    c = await s.register('charlie'),
    d = await s.register('dana');
  await s.pair(a.token, b.token);
  await s.pair(c.token, d.token);
  await s
    .api(a.token)
    .post('/api/ai/settings', {
      baseUrl: 'https://api.example.com/v1',
      model: 'test',
      apiKey: 'private-secret',
      enabled: true,
    })
    .expect(204);
  const config = (await s.api(a.token).get('/api/ai/settings')).body;
  assert.equal(config.hasKey, true);
  assert.equal(config.apiKey, undefined);
  assert.ok(
    !JSON.stringify(s.db.prepare('SELECT * FROM ai_settings').all()).includes('private-secret'),
  );
  const other = executeTool(s.db, c.user.id, 'create_anniversary', {
    title: '另一个空间',
    date: '2026-12-01',
    yearly: true,
  }) as { id: string };
  assert.throws(() =>
    executeTool(s.db, a.user.id, 'update_anniversary', {
      id: other.id,
      title: '攻击',
      date: '2026-01-01',
      yearly: true,
    }),
  );
  assert.throws(() => executeTool(s.db, a.user.id, 'shell', { command: 'whoami' }));
  const message = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '@ai 把我的昵称改为小爱' })
    .expect(201);
  let calls = 0;
  const worker = aiWorker({
    db: s.db,
    secret: 'test-secret-at-least-thirty-two-chars',
    notify: () => {},
    changed: () => {},
    completion: async (_base, key) => {
      assert.equal(key, 'private-secret');
      calls++;
      return calls === 1
        ? {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call1',
                      type: 'function',
                      function: {
                        name: 'update_profile',
                        arguments: JSON.stringify({ name: '小爱' }),
                      },
                    },
                  ],
                },
              },
            ],
          }
        : { choices: [{ message: { role: 'assistant', content: '昵称已更新' } }] };
    },
  });
  await worker();
  await worker();
  assert.equal(calls, 2);
  assert.equal((await s.api(a.token).get('/api/me')).body.user.name, '小爱');
  assert.equal((await s.api(b.token).get('/api/me')).body.user.name, 'bob');
  assert.equal(
    s.db.prepare('SELECT status FROM ai_jobs WHERE messageId=?').get(message.body.id)!.status,
    'done',
  );
  const messages = (await s.api(a.token).get('/api/messages')).body.items;
  assert.equal(messages.at(-1).role, 'assistant');
  assert.equal(publicAddress('127.0.0.1'), false);
  assert.equal(publicAddress('169.254.169.254'), false);
  assert.equal(publicAddress('::1'), false);
  assert.equal(publicAddress('8.8.8.8'), true);
  assert.throws(() => validateAIUrl('http://127.0.0.1:11434/v1'));
  assert.notEqual(encryptKey('same', 'key'), encryptKey('same', 'key'));
});

test('OpenAI-compatible HTTP transport supports approved self-hosted providers', async (t) => {
  const old = process.env.AI_ALLOWED_HOSTS;
  process.env.AI_ALLOWED_HOSTS = 'localhost';
  const provider = createServer((req, res) => {
    assert.equal(req.url, '/v1/chat/completions');
    assert.equal(req.headers.authorization, 'Bearer provider-key');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: '连接正常' } }] }));
  });
  await new Promise<void>((resolve) => provider.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    provider.close();
    if (old === undefined) delete process.env.AI_ALLOWED_HOSTS;
    else process.env.AI_ALLOWED_HOSTS = old;
  });
  const port = (provider.address() as { port: number }).port;
  const response = await complete(`http://localhost:${port}/v1`, 'provider-key', {
    model: 'test',
    messages: [],
  });
  assert.equal(response.choices[0].message.content, '连接正常');
});
