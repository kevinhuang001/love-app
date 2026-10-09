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

import { setup } from './support.js';

test('authentication, one-use pairing and isolation between couples', async (t) => {
  const s = await setup(t),
    a = await s.register('alice'),
    b = await s.register('bob'),
    c = await s.register('charlie'),
    d = await s.register('dana');
  await request(s.app).get('/api/me').expect(401);
  assert.equal((await s.login('alice', 'wrong123')).status, 401);
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
    .post('/api/anniversaries', { title: '生日', date: '2026-02-28' })
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
  assert.equal(upload.body.capturedDate, null);
  const thumb = await request(s.app).get(upload.body.thumbnailUrl).expect(200);
  const info = await sharp(thumb.body).metadata();
  assert.ok(info.width! <= 480);
  assert.equal(info.format, 'webp');
  await request(s.app)
    .get(`/api/media/${upload.body.id}/thumbnail?expires=123&signature=no`)
    .expect(403);
  await s
    .api(b.token)
    .post('/api/messages', { clientId: randomUUID(), mediaIds: [upload.body.id] })
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
    '-metadata',
    'creation_time=2024-02-29T16:05:00Z',
    videoPath,
  ]);
  assert.equal(ffmpeg.status, 0);
  const video = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', await readFile(videoPath), { filename: 'video.mp4', contentType: 'video/mp4' })
    .expect(201);
  assert.equal(video.body.kind, 'video');
  assert.equal(video.body.capturedDate, '2024-03-01');
  assert.ok(video.body.duration > 0);
  await request(s.app).get(video.body.previewUrl).set('Range', 'bytes=0-99').expect(206);
  const memory = await s
    .api(a.token)
    .post('/api/moments', { mediaId: video.body.id, title: '一起看海', date: '2026-10-05' })
    .expect(201);
  assert.equal((await s.api(b.token).get('/api/moments')).body.items[0].media.kind, 'video');
  await s.api(b.token).delete(`/api/moments/${memory.body.id}`).expect(404);
  await s
    .api(a.token)
    .patch(`/api/moments/${memory.body.id}`, { title: '新的描述', date: '2026-10-04' })
    .expect(204);
  await s.api(stranger.token).get('/api/moments').expect(409);
});

test('each uploaded photo detects its own capture date without using upload or modification time', async (t) => {
  const s = await setup(t),
    a = await s.register('datealice'),
    b = await s.register('datebob');
  await s.pair(a.token, b.token);
  const photo = () =>
    sharp({ create: { width: 60, height: 40, channels: 3, background: '#6f897a' } });
  const fixtures = [
    {
      name: 'original.jpg',
      bytes: await photo()
        .withExif({
          IFD2: {
            DateTimeOriginal: '2024:02:29 23:59:58',
            DateTimeDigitized: '2026:03:01 00:00:00',
            OffsetTimeOriginal: '-08:00',
          },
        })
        .jpeg()
        .toBuffer(),
      expected: '2024-02-29',
    },
    {
      name: 'digitized.jpg',
      bytes: await photo()
        .withExif({ IFD2: { DateTimeDigitized: '2025:01:02 01:02:03' } })
        .jpeg()
        .toBuffer(),
      expected: '2025-01-02',
    },
    {
      name: 'modified-only.jpg',
      bytes: await photo()
        .withExif({ IFD0: { DateTime: '2026:10:01 12:00:00' } })
        .jpeg()
        .toBuffer(),
      expected: null,
    },
    {
      name: 'invalid.jpg',
      bytes: await photo()
        .withExif({ IFD2: { DateTimeOriginal: '2025:02:29 12:00:00' } })
        .jpeg()
        .toBuffer(),
      expected: null,
    },
    { name: 'IMG_20200101.png', bytes: await photo().png().toBuffer(), expected: null },
    {
      name: 'metadata.webp',
      bytes: await photo()
        .withExif({ IFD2: { DateTimeOriginal: '2023:12:31 23:59:58' } })
        .webp()
        .toBuffer(),
      expected: '2023-12-31',
    },
  ];
  for (const fixture of fixtures) {
    const media = await request(s.app)
      .post('/api/media')
      .auth(a.token, { type: 'bearer' })
      .attach('file', fixture.bytes, { filename: fixture.name })
      .expect(201);
    assert.equal(media.body.capturedDate, fixture.expected, fixture.name);
    const original = (await s.db
      .prepare('SELECT original FROM media WHERE id=?')
      .get(media.body.id))!;
    assert.deepEqual(await s.mediaRepository.read(String(original.original)), fixture.bytes);
    const thumb = await request(s.app).get(media.body.thumbnailUrl).expect(200);
    assert.equal((await sharp(thumb.body).metadata()).exif, undefined);
    await s
      .api(a.token)
      .post('/api/moments', { mediaId: media.body.id, title: fixture.name })
      .expect(400);
    await s
      .api(a.token)
      .post('/api/moments', {
        mediaId: media.body.id,
        title: fixture.name,
        date: fixture.expected || '2022-07-08',
      })
      .expect(201);
  }
  const saved = (await s.api(b.token).get('/api/moments')).body.items;
  for (const fixture of fixtures)
    assert.equal(
      saved.find((item: { title: string }) => item.title === fixture.name).date,
      fixture.expected || '2022-07-08',
    );
});

test('named assistant encrypted config, tool execution and per-user permissions', async (t) => {
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
    !JSON.stringify(await s.db.prepare('SELECT * FROM couple_ai_settings').all()).includes(
      'private-secret',
    ),
  );
  const other = (await executeTool(s.db, c.user.id, 'create_anniversary', {
    title: '另一个空间',
    date: '2025-12-01',
  })) as { id: string };
  await assert.rejects(
    async () =>
      await executeTool(s.db, a.user.id, 'update_anniversary', {
        id: other.id,
        title: '攻击',
        date: '2026-01-01',
      }),
  );
  await assert.rejects(
    async () => await executeTool(s.db, a.user.id, 'shell', { command: 'whoami' }),
  );
  const message = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '@小爱 把我的昵称改为小爱' })
    .expect(201);
  let calls = 0;
  const worker = aiWorker({
    db: s.db,
    uploads: join(s.dir, 'media'),
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
    (await s.db.prepare('SELECT status FROM ai_jobs WHERE messageId=?').get(message.body.id))!
      .status,
    'done',
  );
  const messages = (await s.api(a.token).get('/api/messages')).body.items;
  assert.equal(messages.at(-1).role, 'assistant');
  assert.equal(await publicAddress('127.0.0.1'), false);
  assert.equal(await publicAddress('169.254.169.254'), false);
  assert.equal(await publicAddress('::1'), false);
  assert.equal(await publicAddress('8.8.8.8'), true);
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
  t.after(async () => {
    await provider.close();
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

test('UTF-8 response decoding preserves Chinese across byte boundaries', async (t) => {
  const old = process.env.AI_ALLOWED_HOSTS;
  process.env.AI_ALLOWED_HOSTS = 'localhost';
  const content = '名称已保存，七夕快乐！🌙';
  const provider = createServer(async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    const buffer = Buffer.from(
      JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }),
    );
    for (let i = 0; i < buffer.length; i++) {
      res.write(buffer.subarray(i, i + 1));
      await new Promise((r) => setTimeout(r, 1));
    }
    res.end();
  });
  await new Promise<void>((r) => provider.listen(0, '127.0.0.1', r));
  t.after(async () => {
    await provider.close();
    if (old === undefined) delete process.env.AI_ALLOWED_HOSTS;
    else process.env.AI_ALLOWED_HOSTS = old;
  });
  const response = await complete(
    `http://localhost:${(provider.address() as { port: number }).port}/v1`,
    '',
    {},
  );
  assert.equal(response.choices[0].message.content, content);
});

test('upward anniversaries, lunar todo lifecycle, couple isolation and AI tools', async (t) => {
  const s = await setup(t),
    a = await s.register('todo_alice'),
    b = await s.register('todo_bob'),
    c = await s.register('todo_other');
  await s.pair(a.token, b.token);
  await s
    .api(a.token)
    .post('/api/anniversaries', { title: '过去的日子', date: '2025-01-01' })
    .expect(201);
  await s
    .api(a.token)
    .post('/api/anniversaries', { title: '未来安排', date: '2099-01-01' })
    .expect(400);
  const value = {
    title: '七夕',
    date: '2026-07-07',
    calendar: 'lunar',
    leapMonth: false,
    repeat: 'yearly',
  };
  const todo = await s.api(a.token).post('/api/todos', value).expect(201);
  await s
    .api(a.token)
    .post('/api/todos', { ...value, date: '2026-02-01', leapMonth: true })
    .expect(400);
  assert.equal((await s.api(b.token).get('/api/todos')).body[0].calendar, 'lunar');
  await s.api(c.token).get('/api/todos').expect(409);
  await assert.rejects(
    async () => await executeTool(s.db, c.user.id, 'delete_todo', { id: todo.body.id }),
  );
  await s
    .api(a.token)
    .post(`/api/todos/${todo.body.id}/completion`, { completed: true })
    .expect(204);
  let row = (await s.api(a.token).get('/api/todos')).body[0];
  assert.equal(row.completed, 0);
  assert.ok(row.completedDate);
  await s
    .api(b.token)
    .post(`/api/todos/${todo.body.id}/completion`, { completed: false })
    .expect(204);
  row = (await s.api(a.token).get('/api/todos')).body[0];
  assert.equal(row.completedDate, null);
  await s
    .api(a.token)
    .patch(`/api/todos/${todo.body.id}`, { ...value, title: '一起过七夕' })
    .expect(204);
  const one = (await executeTool(s.db, a.user.id, 'create_todo', {
    ...value,
    title: '具体的一天',
    calendar: 'solar',
    repeat: 'none',
  })) as { id: string };
  await executeTool(s.db, a.user.id, 'complete_todo', { id: one.id, completed: true });
  assert.equal(
    (await s.db.prepare('SELECT completed FROM todos WHERE id=?').get(one.id))!.completed,
    1,
  );
  await executeTool(s.db, a.user.id, 'delete_todo', { id: one.id });
  await s.api(a.token).delete(`/api/todos/${todo.body.id}`).expect(204);
});

test('custom AI name and avatar are separate from user identity and visible to both chat participants', async (t) => {
  const s = await setup(t),
    a = await s.register('name_alice'),
    b = await s.register('name_bob');
  await s.pair(a.token, b.token);
  const img = await sharp({
    create: { width: 100, height: 100, channels: 3, background: '#a64562' },
  })
    .png()
    .toBuffer();
  const media = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', img, 'avatar.png')
    .expect(201);
  await s
    .api(a.token)
    .patch('/api/ai/profile', { name: '小桃', avatarMediaId: media.body.id })
    .expect(204);
  await s
    .api(b.token)
    .patch('/api/ai/profile', { name: '小桃', avatarMediaId: media.body.id })
    .expect(204);
  await s.api(a.token).patch('/api/ai/profile', { name: '含 空格' }).expect(400);
  await s
    .api(a.token)
    .post('/api/ai/settings', {
      baseUrl: 'https://api.example.com/v1',
      model: 'test',
      apiKey: 'key',
      enabled: true,
    })
    .expect(204);
  assert.equal((await s.api(a.token).get('/api/me')).body.ai.name, '小桃');
  assert.equal((await s.api(a.token).get('/api/ai/settings')).body.name, '小桃');
  const msg = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '@小桃，帮我记住七夕' })
    .expect(201);
  assert.ok(await s.db.prepare('SELECT * FROM ai_jobs WHERE messageId=?').get(msg.body.id));
  const removedAlias = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '@ai 不应触发' })
    .expect(201);
  assert.equal(
    await s.db.prepare('SELECT * FROM ai_jobs WHERE messageId=?').get(removedAlias.body.id),
    undefined,
  );
  const notMention = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '@小桃子 不要误触发' })
    .expect(201);
  assert.equal(
    await s.db.prepare('SELECT * FROM ai_jobs WHERE messageId=?').get(notMention.body.id),
    undefined,
  );
  const worker = aiWorker({
    db: s.db,
    uploads: join(s.dir, 'media'),
    secret: 'test-secret-at-least-thirty-two-chars',
    notify: () => {},
    changed: () => {},
    completion: async () => ({
      choices: [{ message: { role: 'assistant', content: '七夕记住了。' } }],
    }),
  });
  await worker();
  const reply = (await s.api(b.token).get('/api/messages')).body.items.find(
    (m: { role: string }) => m.role === 'assistant',
  );
  assert.equal(reply.assistant.name, '小桃');
  assert.equal(reply.assistant.avatar.id, media.body.id);
  await executeTool(s.db, a.user.id, 'update_ai_profile', {
    name: '星星',
    avatarMediaId: media.body.id,
  });
  assert.equal((await s.api(a.token).get('/api/me')).body.ai.name, '星星');
  assert.equal((await s.api(a.token).get('/api/me')).body.user.name, 'name_alice');
  assert.equal(
    (await s.api(a.token).get('/api/messages')).body.items.find(
      (m: { role: string }) => m.role === 'assistant',
    ).assistant.name,
    '小桃',
  );
  const next = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '@星星 在吗' })
    .expect(201);
  assert.ok(await s.db.prepare('SELECT * FROM ai_jobs WHERE messageId=?').get(next.body.id));
});

test('album filters, ordering and cursor pagination preserve isolation beyond 200 memories', async (t) => {
  const s = await setup(t),
    a = await s.register('album_alice'),
    b = await s.register('album_bob'),
    c = await s.register('album_charlie'),
    d = await s.register('album_dana');
  await s.pair(a.token, b.token);
  await s.pair(c.token, d.token);
  const coupleId = String(
    (await s.db.prepare('SELECT coupleId FROM users WHERE id=?').get(a.user.id))!.coupleId,
  );
  const otherCouple = String(
    (await s.db.prepare('SELECT coupleId FROM users WHERE id=?').get(c.user.id))!.coupleId,
  );
  const imageId = randomUUID(),
    videoId = randomUUID(),
    otherMedia = randomUUID();
  const media = s.db.prepare(
    'INSERT INTO media(id,coupleId,ownerId,kind,original,preview,thumbnail,createdAt) VALUES(?,?,?,?,?,?,?,?)',
  );
  await media.run(
    imageId,
    coupleId,
    a.user.id,
    'image',
    'test.jpg',
    'test.webp',
    'test.webp',
    '2026-01-01',
  );
  await media.run(
    videoId,
    coupleId,
    b.user.id,
    'video',
    'test.mp4',
    'test.mp4',
    'test.webp',
    '2026-01-01',
  );
  await media.run(
    otherMedia,
    otherCouple,
    c.user.id,
    'image',
    'other.jpg',
    'other.webp',
    'other.webp',
    '2026-01-01',
  );
  const insert = s.db.prepare(
    'INSERT INTO moments(id,coupleId,ownerId,title,mediaId,date,createdAt) VALUES(?,?,?,?,?,?,?)',
  );
  for (let i = 0; i < 205; i++)
    await insert.run(
      randomUUID(),
      coupleId,
      i % 2 ? a.user.id : b.user.id,
      i === 7 ? '50%_完成' : `散步${i}`,
      i % 3 ? imageId : videoId,
      new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
      new Date(Date.UTC(2026, 0, 1, 0, 0, 205 - i)).toISOString(),
    );
  await insert.run(
    randomUUID(),
    otherCouple,
    c.user.id,
    '其他空间',
    otherMedia,
    '2099-01-01',
    '2099-01-01T00:00:00.000Z',
  );
  const seen = new Set<string>();
  let cursor: string | null = null;
  let previous = '9999-99-99';
  do {
    const page = (
      await s.api(a.token).get('/api/moments?limit=60' + (cursor ? `&cursor=${cursor}` : ''))
    ).body;
    assert.equal(page.total, 205);
    assert.ok(page.items.length <= 60);
    for (const item of page.items) {
      assert.ok(item.date <= previous);
      previous = item.date;
      assert.ok(!seen.has(item.id));
      seen.add(item.id);
      assert.notEqual(item.title, '其他空间');
    }
    cursor = page.nextCursor;
  } while (cursor);
  assert.equal(seen.size, 205);
  const oldest = (await s.api(a.token).get('/api/moments?sort=date_asc&limit=1')).body;
  assert.equal(oldest.items[0].date, '2025-01-01');
  const uploaded = (await s.api(a.token).get('/api/moments?sort=uploaded_desc&limit=1')).body;
  assert.equal(uploaded.items[0].date, '2025-01-01');
  const filtered = (
    await s.api(a.token).get('/api/moments?type=video&owner=mine&from=2025-01-01&to=2025-01-31')
  ).body;
  assert.equal(filtered.total, 5);
  assert.ok(
    filtered.items.every(
      (item: { ownerId: string; media: { kind: string } }) =>
        item.ownerId === a.user.id && item.media.kind === 'video',
    ),
  );
  const partner = (await s.api(a.token).get('/api/moments?owner=partner&limit=100')).body;
  assert.equal(partner.total, 103);
  const literal = (await s.api(a.token).get('/api/moments?search=' + encodeURIComponent('%_')))
    .body;
  assert.equal(literal.total, 1);
  assert.equal(literal.items[0].title, '50%_完成');
  await s.api(a.token).get('/api/moments?from=2025-02-01&to=2025-01-01').expect(400);
  await s.api(a.token).get('/api/moments?from=2025-02-31').expect(400);
  await s.api(a.token).get('/api/moments?sort=invalid').expect(400);
  await s.api(a.token).get('/api/moments?cursor=broken').expect(400);
  await s
    .api(a.token)
    .get('/api/moments?sort=date_desc&cursor=' + oldest.nextCursor)
    .expect(400);
  await s.api(a.token).get('/api/moments?limit=101').expect(400);
});
