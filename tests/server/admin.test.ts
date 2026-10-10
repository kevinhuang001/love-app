import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { io } from 'socket.io-client';
import { SMTPServer } from 'smtp-server';
import { createControl } from '../../apps/server/src/control.js';
import { sendMail } from '../../apps/server/src/mail.js';
import { setup } from './support.js';

test('administrator and user sessions are separate; captchas are bound, one-use and expire', async (t) => {
  const s = await setup(t),
    user = await s.register('auth_user');
  await request(s.app).get('/api/admin/overview').expect(401);
  await s.api(user.token).get('/api/admin/settings').expect(401);
  await s.api(s.adminToken).get('/api/me').expect(401);
  await request(s.app)
    .post('/api/auth/login')
    .send({ username: 'auth_user', password: 'password123' })
    .expect(400);
  const challenge = await s.captcha('admin');
  await request(s.app)
    .post('/api/admin/login')
    .send({
      username: 'admin_master',
      password: 'admin-test-password-123',
      ...challenge,
      captcha: 'WRONG',
    })
    .expect(400);
  await request(s.app)
    .post('/api/admin/login')
    .send({ username: 'admin_master', password: 'admin-test-password-123', ...challenge })
    .expect(400);
  const wrongPurpose = await s.captcha('register');
  await request(s.app)
    .post('/api/auth/login')
    .send({ username: 'auth_user', password: 'password123', ...wrongPurpose })
    .expect(400);
  const expired = await s.captcha('login');
  await s.db.prepare('UPDATE captchas SET expires=0 WHERE id=?').run(expired.captchaId);
  await request(s.app)
    .post('/api/auth/login')
    .send({ username: 'auth_user', password: 'password123', ...expired })
    .expect(400);
  const bound = await s.captcha('login');
  await s.db.prepare("UPDATE captchas SET ipHash='different-ip' WHERE id=?").run(bound.captchaId);
  await request(s.app)
    .post('/api/auth/login')
    .send({ username: 'auth_user', password: 'password123', ...bound })
    .expect(400);
  const image = (await request(s.app).get('/api/auth/captcha?purpose=admin')).body.image;
  assert.equal((await sharp(Buffer.from(image.split(',')[1], 'base64')).metadata()).width, 180);
  await s
    .api(s.adminToken)
    .post('/api/admin/password', { currentPassword: 'wrong', password: 'new-admin-password-123' })
    .expect(404);
  const unchanged = await createControl(
    s.db,
    'test-secret-at-least-thirty-two-chars',
    { adminCredentials: { username: 'admin_master', password: 'admin-test-password-123' } },
    () => {},
  );
  await unchanged.bootstrap;
  await unchanged.close();
  await s.api(s.adminToken).get('/api/admin/overview').expect(200);
  const changed = await createControl(
    s.db,
    'test-secret-at-least-thirty-two-chars',
    { adminCredentials: { username: 'admin_master', password: 'new-admin-password-123' } },
    () => {},
  );
  await changed.bootstrap;
  await changed.close();
  await s.api(s.adminToken).get('/api/admin/overview').expect(401);
  await request(s.app)
    .post('/api/admin/login')
    .send({
      username: 'admin_master',
      password: 'admin-test-password-123',
      ...(await s.captcha('admin')),
    })
    .expect(401);
  const token = await s.adminLogin('new-admin-password-123');
  await s.api(token).get('/api/admin/overview').expect(200);
});

test('email signup checks current policy, whitelist, mailbox proof, expiry, attempts and replay', async (t) => {
  const s = await setup(t),
    admin = s.api(s.adminToken);
  await admin
    .patch('/api/admin/settings', {
      ...(await s.control.readSettings()),
      registration: 'whitelist',
      domains: ['example.test'],
    })
    .expect(200);
  await request(s.app)
    .post('/api/auth/email-code')
    .send({ email: 'blocked@example.test', purpose: 'register', ...(await s.captcha('register')) })
    .expect(403);
  await admin
    .post('/api/admin/allowlist', { email: 'ALLOWED@example.test', note: 'only this mailbox' })
    .expect(201);
  await admin.post('/api/admin/allowlist', { email: 'second@example.test' }).expect(201);
  const proof = await s.emailCode('allowed@example.test');
  await request(s.app)
    .post('/api/auth/email-code')
    .send({ email: 'allowed@example.test', purpose: 'register', ...(await s.captcha('register')) })
    .expect(429);
  const signup = {
    username: 'allowed_user',
    name: '邮箱用户',
    password: 'password123',
    email: 'allowed@example.test',
    ...proof,
  };
  await request(s.app)
    .post('/api/auth/register')
    .send({ ...signup, email: 'second@example.test' })
    .expect(400);
  await request(s.app)
    .post('/api/auth/register')
    .send({ ...signup, code: proof.code === '000000' ? '111111' : '000000' })
    .expect(400);
  const created = await request(s.app).post('/api/auth/register').send(signup).expect(201);
  assert.equal(created.body.user.email, 'allowed@example.test');
  await request(s.app)
    .post('/api/auth/register')
    .send({ ...signup, username: 'replayed_user' })
    .expect(400);
  const pending = await s.emailCode('second@example.test');
  await admin
    .patch('/api/admin/settings', { ...(await s.control.readSettings()), registration: 'closed' })
    .expect(200);
  await request(s.app)
    .post('/api/auth/register')
    .send({ ...signup, username: 'second_user', email: 'second@example.test', ...pending })
    .expect(403);
  const publicConfig = (await request(s.app).get('/api/auth/config')).body;
  assert.equal(publicConfig.registrationAvailable, false);
  await admin
    .post('/api/admin/users', {
      username: 'manual_user',
      name: '手动账号',
      email: 'manual@example.test',
      password: 'manual-password',
      confirmedEmail: true,
    })
    .expect(201);
  assert.equal((await s.login('manual_user', 'manual-password')).status, 200);
  await admin
    .patch('/api/admin/settings', { ...(await s.control.readSettings()), registration: 'email' })
    .expect(200);
  for (const address of ['expired@example.test', 'attempts@example.test']) {
    const value = await s.emailCode(address);
    const body = {
      username: address.split('@')[0] + '_user',
      email: address,
      name: 'test',
      password: 'password123',
      ...value,
    };
    if (address.startsWith('expired'))
      await s.db.prepare('UPDATE email_codes SET expires=0 WHERE id=?').run(value.verificationId);
    else
      for (let i = 0; i < 5; i++)
        await request(s.app)
          .post('/api/auth/register')
          .send({ ...body, code: value.code === '000000' ? '111111' : '000000' })
          .expect(400);
    await request(s.app).post('/api/auth/register').send(body).expect(400);
  }
});

test('verified password reset revokes sessions and cannot reuse registration proof', async (t) => {
  const s = await setup(t),
    a = await s.register('reset_user');
  const proof = await s.emailCode('reset_user@example.test', 'reset');
  await request(s.app)
    .post('/api/auth/register')
    .send({
      username: 'reset_as_signup',
      name: 'test',
      password: 'password123',
      email: 'reset_user@example.test',
      ...proof,
    })
    .expect(400);
  await request(s.app)
    .post('/api/auth/reset-password')
    .send({ email: 'reset_user@example.test', password: 'updated-password', ...proof })
    .expect(204);
  await s.api(a.token).get('/api/me').expect(401);
  assert.equal((await s.login('reset_user', 'password123')).status, 401);
  assert.equal((await s.login('reset_user@example.test', 'updated-password')).status, 200);
  await request(s.app)
    .post('/api/auth/reset-password')
    .send({ email: 'reset_user@example.test', password: 'another-password', ...proof })
    .expect(400);
});

test('pair storage uses real byte counts and enforces quotas without leaving files; disabling revokes sockets', async (t) => {
  const s = await setup(t),
    a = await s.register('store_a'),
    b = await s.register('store_b');
  await s.pair(a.token, b.token);
  const admin = s.api(s.adminToken);
  const upload = async (buffer: Buffer) =>
    request(s.app)
      .post('/api/media')
      .auth(a.token, { type: 'bearer' })
      .attach('file', buffer, { filename: 'memory.png', contentType: 'image/png' });
  const image = await sharp({
    create: { width: 500, height: 400, channels: 3, background: '#678576' },
  })
    .png()
    .toBuffer();
  const media = await upload(image);
  assert.equal(media.status, 201);
  await s
    .api(a.token)
    .post('/api/moments', { mediaId: media.body.id, title: 'saved', date: '2026-10-09' })
    .expect(201);
  const row = (await s.db.prepare('SELECT * FROM media WHERE id=?').get(media.body.id))!;
  const measured = (
    await Promise.all(
      ['original', 'preview', 'thumbnail'].map((k) =>
        s.mediaRepository
          .info(String(row[k]))
          .then((info) => ({ size: info.bytes }))
          .then((v) => v.size),
      ),
    )
  ).reduce((a, b) => a + b, 0);
  const pairs = (await admin.get('/api/admin/couples').expect(200)).body;
  assert.equal(pairs.items[0].storageBytes, measured);
  assert.equal(pairs.items[0].members.length, 2);
  const id = pairs.items[0].id;
  await admin.patch(`/api/admin/couples/${id}/quota`, { quotaMiB: 1 }).expect(204);
  const before = (await readdir(join(s.dir, 'media'))).sort();
  const large = await sharp(randomBytes(1000 * 1000 * 3), {
    raw: { width: 1000, height: 1000, channels: 3 },
  })
    .png()
    .toBuffer();
  const rejected = await upload(large);
  assert.equal(rejected.status, 413);
  assert.deepEqual((await readdir(join(s.dir, 'media'))).sort(), before);
  assert.equal(await s.control.usage(id), measured);
  await admin
    .patch('/api/admin/settings', { ...(await s.control.readSettings()), defaultQuotaMiB: 2 })
    .expect(200);
  await admin.patch(`/api/admin/couples/${id}/quota`, { quotaMiB: null }).expect(204);
  assert.equal((await admin.get('/api/admin/couples')).body.items[0].effectiveQuotaMiB, 2);
  const socket = io(s.base, {
    auth: { token: a.token },
    transports: ['websocket'],
    reconnection: false,
  });
  t.after(() => socket.disconnect());
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  const disconnected = new Promise<void>((resolve) => socket.once('disconnect', () => resolve()));
  await admin.patch(`/api/admin/users/${a.user.id}`, { disabled: true }).expect(204);
  await disconnected;
  await s.api(a.token).get('/api/me').expect(401);
  await s.api(b.token).get('/api/me').expect(200);
  assert.equal((await s.login('store_a')).status, 403);
  await admin.patch(`/api/admin/users/${a.user.id}`, { disabled: false }).expect(204);
  const restored = await s.login('store_a');
  assert.equal(restored.status, 200);
  await s.api(a.token).get('/api/me').expect(401);
  await admin.patch(`/api/admin/users/${a.user.id}`, { password: 'new-password-123' }).expect(204);
  await s.api(restored.body.token).get('/api/me').expect(401);
  assert.equal((await s.login('store_a', 'new-password-123')).status, 200);
  const users = (await admin.get('/api/admin/users')).body;
  assert.equal(users.items.find((u: { id: string }) => u.id === a.user.id).storageBytes, measured);
  assert.equal(users.items[0].password, undefined);
  const stats = (await admin.get('/api/admin/overview')).body;
  assert.equal(stats.activeCouples, 1);
  assert.equal(stats.storageBytes, measured);
});

test('SMTP secrets and credentials do not leak into responses or logs; logs are filtered and retained', async (t) => {
  const s = await setup(t),
    admin = s.api(s.adminToken),
    u = await s.register('log_user');
  const settings = (await admin.get('/api/admin/settings')).body;
  assert.equal(settings.smtp.password, undefined);
  assert.equal(settings.smtp.passwordConfigured, true);
  assert.ok(!JSON.stringify(settings).includes('smtp-private-test-value'));
  const raw = String(
    (await s.db.prepare("SELECT value FROM server_config WHERE key='control'").get())!.value,
  );
  assert.ok(!raw.includes('smtp-private-test-value'));
  await s.api(u.token).get('/api/missing?token=private-query-token').expect(409);
  // Access logging writes asynchronously after response finish. Wait for that
  // write before checking the filtered API, especially with PostgreSQL I/O.
  for (const deadline = Date.now() + 5000; Date.now() < deadline;) {
    const written = await s.db
      .prepare('SELECT COUNT(*) n FROM access_logs WHERE path=? AND status=?')
      .get('/api/missing', 409);
    if (Number(written?.n) === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const access = (await admin.get('/api/admin/logs/access?search=/api/missing&status=4')).body;
  assert.equal(access.total, 1);
  assert.equal(access.items[0].path, '/api/missing');
  assert.equal(access.items[0].status, 409);
  assert.equal(access.items[0].actorId, u.user.id);
  const responses = await Promise.all(
    ['access', 'server', 'audit'].map((kind) => admin.get(`/api/admin/logs/${kind}`).expect(200)),
  );
  const logs = JSON.stringify(responses.map((r) => r.body));
  for (const sensitive of [
    'private-query-token',
    'smtp-private-test-value',
    'admin-test-password-123',
    'password123',
  ])
    assert.ok(!logs.includes(sensitive));
  assert.ok(
    (await admin.get('/api/admin/logs/audit?search=settings.updated')).body.items.length >= 1,
  );
  await admin
    .get('/api/admin/logs/access?from=2026-01-02T00:00:00Z&to=2026-01-01T00:00:00Z')
    .expect(400);
  const old = new Date(Date.now() - 91 * 86400_000).toISOString();
  await s.db
    .prepare('INSERT INTO server_logs(createdAt,level,event,details) VALUES(?,?,?,?)')
    .run(old, 'info', 'expired.log', '{}');
  await s.control.prune();
  assert.equal(
    await s.db.prepare("SELECT id FROM server_logs WHERE event='expired.log'").get(),
    undefined,
  );
});

test('SMTP delivery is real UTF-8 mail and failed sends do not leave valid verification codes', async (t) => {
  const messages: string[] = [];
  const smtpServer = new SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH', 'STARTTLS'],
    onData(stream, _session, callback) {
      let text = '';
      stream.on('data', (chunk) => (text += chunk.toString()));
      stream.on('end', () => {
        messages.push(text);
        callback();
      });
    },
  });
  await new Promise<void>((resolve) => smtpServer.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(async (resolve) => await smtpServer.close(resolve)));
  const s = await setup(t, { mailSender: sendMail });
  const port = (smtpServer.server.address() as { port: number }).port;
  await s
    .api(s.adminToken)
    .patch('/api/admin/settings', {
      ...(await s.control.readSettings()),
      smtp: {
        host: '127.0.0.1',
        port,
        security: 'plain',
        user: '',
        from: 'noreply@example.test',
        senderName: '两人空间',
        clearPassword: true,
      },
    })
    .expect(200);
  await s.register('smtp_user');
  assert.equal(messages.length, 1);
  assert.match(messages[0], /charset=utf-8/i);
  assert.match(messages[0], /To: smtp_user@example.test/);
  assert.equal(s.mailbox[0].to, 'smtp_user@example.test');
  await s
    .api(s.adminToken)
    .post('/api/admin/smtp/test', { email: 'owner@example.test' })
    .expect(200);
  assert.equal(messages.length, 2);
  const bad = await setup(t, {
    mailSender: async () => {
      throw Object.assign(new Error('do not log SMTP credentials'), { code: 'EAUTH' });
    },
  });
  await request(bad.app)
    .post('/api/auth/email-code')
    .send({ email: 'failed@example.test', purpose: 'register', ...(await bad.captcha('register')) })
    .expect(503);
  assert.equal(
    (await bad.db.prepare("SELECT COUNT(*) n FROM email_codes WHERE status='ready'").get())!.n,
    0,
  );
  assert.equal(
    await bad.db.prepare("SELECT id FROM users WHERE email='failed@example.test'").get(),
    undefined,
  );
  const log = (await bad.api(bad.adminToken).get('/api/admin/logs/server?search=smtp.send.failed'))
    .body.items[0];
  assert.deepEqual(log.details, { code: 'EAUTH' });
});

test('registration invitations are optional, hashed, batch-generated, expiring and consumed only on successful signup', async (t) => {
  const s = await setup(t),
    admin = s.api(s.adminToken);
  await s.register('without_invitation');
  await request(s.app).get('/api/admin/registration-invites').expect(401);
  await admin.post('/api/admin/registration-invites', { count: 201 }).expect(400);
  const batch = (
    await admin
      .post('/api/admin/registration-invites', {
        count: 3,
        maxUses: 1,
        expiresDays: 30,
        label: '测试批次',
      })
      .expect(201)
  ).body.codes;
  assert.equal(batch.length, 3);
  assert.equal(new Set(batch.map((x: { code: string }) => x.code)).size, 3);
  const list = (await admin.get('/api/admin/registration-invites').expect(200)).body;
  assert.equal(list.length, 3);
  assert.ok(!JSON.stringify(list).includes(batch[0].code));
  assert.equal(list[0].hash, undefined);
  await admin
    .patch('/api/admin/settings', { ...(await s.control.readSettings()), invitationRequired: true })
    .expect(200);
  assert.equal((await request(s.app).get('/api/auth/config')).body.invitationRequired, true);
  for (const invitationCode of [undefined, 'invalid'])
    await request(s.app)
      .post('/api/auth/email-code')
      .send({
        email: 'invite_user@example.test',
        purpose: 'register',
        invitationCode,
        ...(await s.captcha('register')),
      })
      .expect(403);
  const proof = await s.emailCode('invite_user@example.test', 'register', batch[0].code);
  const signup = {
    username: 'invite_user',
    email: 'invite_user@example.test',
    password: 'password123',
    ...proof,
    invitationCode: batch[0].code,
  };
  await request(s.app)
    .post('/api/auth/register')
    .send({ ...signup, code: 'WRONG' })
    .expect(400);
  assert.equal(
    (await s.db.prepare('SELECT uses FROM registration_invites WHERE id=?').get(batch[0].id))!.uses,
    0,
  );
  await request(s.app).post('/api/auth/register').send(signup).expect(201);
  assert.equal(
    (await s.db.prepare('SELECT uses FROM registration_invites WHERE id=?').get(batch[0].id))!.uses,
    1,
  );
  await request(s.app)
    .post('/api/auth/email-code')
    .send({
      email: 'invite_second@example.test',
      purpose: 'register',
      invitationCode: batch[0].code,
      ...(await s.captcha('register')),
    })
    .expect(403);
  await s.db.prepare('UPDATE registration_invites SET expires=1 WHERE id=?').run(batch[1].id);
  await request(s.app)
    .post('/api/auth/email-code')
    .send({
      email: 'expired@example.test',
      purpose: 'register',
      invitationCode: batch[1].code,
      ...(await s.captcha('register')),
    })
    .expect(403);
  const revokeProof = await s.emailCode('revoked@example.test', 'register', batch[2].code);
  await admin.patch('/api/admin/registration-invites/revoke', { ids: [batch[2].id] }).expect(204);
  await request(s.app)
    .post('/api/auth/register')
    .send({
      username: 'revoked_user',
      email: 'revoked@example.test',
      password: 'password123',
      invitationCode: batch[2].code,
      ...revokeProof,
    })
    .expect(403);
  await admin
    .patch('/api/admin/settings', {
      ...(await s.control.readSettings()),
      invitationRequired: false,
    })
    .expect(200);
  await s.register('optional_again');
  const logs = (await s.db.prepare('SELECT details FROM audit_logs').all())
    .map((v) => v.details)
    .join('');
  assert.ok(batch.every((v: { code: string }) => !logs.includes(v.code)));
});

test('single-use registration invitation cannot be redeemed by concurrent verified registrations', async (t) => {
  const s = await setup(t),
    admin = s.api(s.adminToken);
  const { code, id } = (
    await admin.post('/api/admin/registration-invites', { count: 1, expiresDays: 0 }).expect(201)
  ).body.codes[0];
  await admin
    .patch('/api/admin/settings', { ...(await s.control.readSettings()), invitationRequired: true })
    .expect(200);
  const a = await s.emailCode('race_a@example.test', 'register', code),
    b = await s.emailCode('race_b@example.test', 'register', code);
  const outcomes = await Promise.all(
    [
      ['race_a', a],
      ['race_b', b],
    ].map(([name, proof]) =>
      request(s.app)
        .post('/api/auth/register')
        .send({
          username: name,
          email: name + '@example.test',
          password: 'password123',
          invitationCode: code,
          ...(proof as object),
        }),
    ),
  );
  assert.deepEqual(outcomes.map((r) => r.status).sort(), [201, 403]);
  assert.equal(
    (await s.db.prepare('SELECT uses FROM registration_invites WHERE id=?').get(id))!.uses,
    1,
  );
});
