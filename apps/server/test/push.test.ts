import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { jpushSender, pushWorker, deviceKey } from '../src/push.js';
import { setup } from './support.js';

test('JPush authenticates server-side, targets one RID and supplies all six vendor routes', async () => {
  let payload: any;
  const sender = jpushSender(
    {
      appKey: 'public-key',
      masterSecret: 'private-server-secret',
      thirdPartyChannel: {
        xiaomi: { channel_id: 'approved-chat', mi_template_id: 'template-1' },
        vivo: { classification: 1, category: 'IM' },
      },
    },
    async (url, options) => {
      assert.equal(url, 'https://api.jpush.cn/v3/push');
      assert.equal(
        new Headers(options?.headers).get('authorization'),
        'Basic ' + Buffer.from('public-key:private-server-secret').toString('base64'),
      );
      assert.ok(options?.signal);
      payload = JSON.parse(String(options?.body));
      return Response.json({ msg_id: 'accepted-123' });
    },
  );
  assert.equal(await sender('registration-1', 42), 'sent');
  assert.deepEqual(payload.audience, { registration_id: ['registration-1'] });
  assert.deepEqual(Object.keys(payload.options.third_party_channel), [
    'huawei',
    'honor',
    'xiaomi',
    'oppo',
    'vivo',
    'meizu',
  ]);
  assert.equal(payload.options.third_party_channel.xiaomi.distribution, 'first_ospush');
  assert.equal(payload.options.third_party_channel.xiaomi.mi_template_id, 'template-1');
  assert.equal(payload.notification.android.channel_id, 'messages');
  assert.deepEqual(payload.notification.android.extras, { messageId: '42', screen: 'chat' });
  assert.match(payload.notification.android.intent.url, /PushClickActivity/);
  assert.ok(!JSON.stringify(payload).includes('private-server-secret'));
});

test('JPush expires absent targets but preserves devices on auth, rate limit and malformed channel errors', async () => {
  const sender = (status: number, body: unknown) =>
    jpushSender({ appKey: 'key', masterSecret: 'secret' }, async () =>
      Response.json(body, { status }),
    );
  assert.equal(await sender(400, { error: { code: 1011 } })('expired', 1), 'invalid');
  for (const [status, code] of [
    [400, 1003],
    [401, 1004],
    [429, 2002],
    [500, 1000],
  ])
    await assert.rejects(sender(status, { error: { code } })('keep-token', 1));
  await assert.rejects(sender(200, {})('keep-token', 1));
});

test('provider retry resumes after restart without resending accepted devices; invalid devices are removed immediately', async (t) => {
  const s = await setup(t),
    a = await s.register('pushalice'),
    b = await s.register('pushbob');
  await s.pair(a.token, b.token);
  for (const key of [
    deviceKey('fcm', 'accepted'),
    deviceKey('jpush', 'transient'),
    deviceKey('jpush', 'expired'),
  ])
    s.db.prepare('INSERT INTO devices VALUES(?,?,?)').run(key, b.user.id, Date.now());
  const msg = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: '一条消息' })
    .expect(201);
  const calls: string[] = [];
  const logs: string[] = [];
  let fail = true;
  const senders = {
    fcm: async (token: string) => {
      calls.push(token);
      return 'sent' as const;
    },
    jpush: async (token: string) => {
      calls.push(token);
      if (token === 'expired') return 'invalid' as const;
      if (fail) throw new Error('private detail');
      return 'sent' as const;
    },
  };
  await pushWorker(s.db, senders, (code) => logs.push(code))();
  assert.equal(s.db.prepare('SELECT 1 FROM devices WHERE token=?').get('jpush:expired'), undefined);
  assert.equal(s.db.prepare('SELECT attempts FROM push_jobs').get()!.attempts, 1);
  assert.deepEqual(logs, ['push.jpush.failed']);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM push_acceptances').get()!.n, 1);
  fail = false;
  s.db.prepare('UPDATE push_jobs SET nextAt=0').run();
  await pushWorker(s.db, senders)();
  assert.deepEqual(calls, ['accepted', 'transient', 'expired', 'transient']);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM push_jobs').get()!.n, 0);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM push_acceptances').get()!.n, 0);
  assert.equal(msg.body.content, '一条消息');
});

test('typed device registration rotates tokens, validates providers and protects device deletion', async (t) => {
  const s = await setup(t),
    a = await s.register('devicealice'),
    b = await s.register('devicebob');
  const installationId = randomUUID();
  await s.api(a.token).post('/api/devices', { token: 'untyped-device' }).expect(400);
  await s
    .api(a.token)
    .post('/api/devices', { provider: 'vendor-unknown', token: 'device-token', installationId })
    .expect(400);
  await s
    .api(a.token)
    .post('/api/devices', { provider: 'jpush', token: 'device-token', installationId })
    .expect(503);
  for (const token of ['old-device-token', 'new-device-token'])
    await s
      .api(a.token)
      .post('/api/devices', { provider: 'fcm', token, installationId })
      .expect(204);
  assert.deepEqual(
    s.db
      .prepare('SELECT token FROM devices')
      .all()
      .map((d) => d.token),
    ['fcm:new-device-token'],
  );
  await s
    .api(b.token)
    .delete('/api/devices')
    .send({ provider: 'fcm', token: 'new-device-token' })
    .expect(204);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM devices').get()!.n, 1);
  // Knowing an installation UUID alone cannot revoke someone else's token.
  await s
    .api(b.token)
    .post('/api/devices', { provider: 'fcm', token: 'bob-device-token', installationId })
    .expect(204);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM devices').get()!.n, 2);
  await s
    .api(a.token)
    .delete('/api/devices')
    .send({ provider: 'fcm', token: 'new-device-token' })
    .expect(204);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM devices').get()!.n, 1);
  const health = await s.api(a.token).get('/api/health').expect(200);
  assert.deepEqual(health.body.pushProviders, ['fcm']);
  const overview = await s.api(s.adminToken).get('/api/admin/overview').expect(200);
  assert.deepEqual(overview.body.pushDevices, [{ provider: 'fcm', count: 1 }]);
});
