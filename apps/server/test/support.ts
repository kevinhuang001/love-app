import type { TestContext } from 'node:test';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import type { MailMessage, MailSender } from '../src/mail.js';
export async function setup(t: TestContext, options: { mailSender?: MailSender } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'love-test-')),
    delivered: { tokens: string[]; messageId: number }[] = [],
    answers = new Map<string, string>(),
    mailbox: MailMessage[] = [];
  const server = createApp({
    database: join(dir, 'test.sqlite'),
    uploads: join(dir, 'media'),
    mediaSecret: 'test-secret-at-least-thirty-two-chars',
    adminBootstrap: { username: 'admin_master', password: 'admin-test-password-123' },
    onCaptcha: (id, answer) => answers.set(id, answer),
    mailSender: async (config, message) => {
      if (options.mailSender) await options.mailSender(config, message);
      mailbox.push(message);
    },
    pushSenders: {
      fcm: async (token, messageId) => {
        delivered.push({ tokens: [token], messageId });
        return token.startsWith('invalid') ? 'invalid' : 'sent';
      },
    },
  });
  await server.control.bootstrap;
  await new Promise<void>((resolve) => server.http.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.http.address() as { port: number }).port}`;
  t.after(async () => {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  });
  const captcha = async (purpose: 'login' | 'register' | 'admin' | 'reset') => {
    const r = await request(server.app).get(`/api/auth/captcha?purpose=${purpose}`).expect(200);
    return { captchaId: r.body.id, captcha: answers.get(r.body.id)! };
  };
  const adminLogin = async (password = 'admin-test-password-123') => {
    const response = await request(server.app)
      .post('/api/admin/login')
      .send({ username: 'admin_master', password, ...(await captcha('admin')) })
      .expect(200);
    return response.body.token as string;
  };
  const adminToken = await adminLogin();
  const api = (token: string) => ({
    get: (path: string) => request(server.app).get(path).auth(token, { type: 'bearer' }),
    post: (path: string, body: unknown) =>
      request(server.app).post(path).auth(token, { type: 'bearer' }).send(body),
    delete: (path: string) => request(server.app).delete(path).auth(token, { type: 'bearer' }),
    patch: (path: string, body: unknown) =>
      request(server.app).patch(path).auth(token, { type: 'bearer' }).send(body),
  });
  await api(adminToken)
    .patch('/api/admin/settings', {
      ...server.control.readSettings(),
      registration: 'email',
      smtp: {
        host: 'smtp.example.test',
        port: 587,
        security: 'starttls',
        user: '',
        password: 'smtp-private-test-value',
        from: 'noreply@example.test',
        senderName: 'Love',
      },
    })
    .expect(200);
  const emailCode = async (address: string, purpose: 'register' | 'reset' = 'register') => {
    const result = await request(server.app)
      .post('/api/auth/email-code')
      .send({ email: address, purpose, ...(await captcha(purpose)) })
      .expect(200);
    const message = mailbox.findLast((m) => m.to === address && m.text.includes('验证码是'))!;
    return {
      verificationId: result.body.verificationId,
      code: message?.text.match(/验证码是 (\d{6})/)?.[1] || '',
    };
  };
  const register = async (username: string) => {
    const address = `${username}@example.test`;
    const response = await request(server.app)
      .post('/api/auth/register')
      .send({
        username,
        email: address,
        name: username,
        password: 'password123',
        ...(await emailCode(address)),
      })
      .expect(201);
    return response.body as { token: string; user: { id: string } };
  };
  const login = async (username: string, password = 'password123') =>
    request(server.app)
      .post('/api/auth/login')
      .send({ username, password, ...(await captcha('login')) });
  const pair = async (a: string, b: string) => {
    const invite = await api(a).post('/api/pairing/invite', {}).expect(200);
    await api(b).post('/api/pairing/join', { code: invite.body.code }).expect(200);
    return invite.body.code;
  };
  return {
    ...server,
    api,
    register,
    pair,
    base,
    dir,
    delivered,
    captcha,
    emailCode,
    login,
    mailbox,
    answers,
    adminToken,
    adminLogin,
  };
}
