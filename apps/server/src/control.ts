import type { Request, Response, NextFunction, Express } from 'express';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomInt, randomUUID, randomBytes, createHmac } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { type DB, transaction } from './db.js';
import { hashPassword, verifyPassword, hashToken, newToken, validSignature } from './security.js';
import { fail } from './errors.js';
import { sendMail, seal, unseal, type MailSender, type SMTP } from './mail.js';
const email = z.string().trim().toLowerCase().email().max(254);
const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/);
const smtpSchema = z.object({
  host: z
    .string()
    .trim()
    .max(253)
    .regex(/^[a-zA-Z0-9.:-]*$/),
  port: z.number().int().min(1).max(65535),
  security: z.enum(['tls', 'starttls', 'plain']),
  user: z.string().trim().max(254),
  password: z.string().max(1024).optional(),
  clearPassword: z.boolean().optional(),
  from: z.union([email, z.literal('')]),
  senderName: z.string().trim().min(1).max(60),
});
const settingsSchema = z.object({
  registration: z.enum(['closed', 'email', 'whitelist']),
  invitationRequired: z.boolean().default(false),
  domains: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/),
    )
    .max(100),
  defaultQuotaMiB: z.number().int().min(0).max(1_000_000),
  retentionDays: z.number().int().min(7).max(90),
  smtp: smtpSchema,
});
export const validateControlSettings = (value: unknown) => settingsSchema.parse(value);
export type ControlSettings = z.infer<typeof settingsSchema>;
const defaults: ControlSettings = {
  registration: 'closed',
  invitationRequired: false,
  domains: [],
  defaultQuotaMiB: 1024,
  retentionDays: 30,
  smtp: { host: '', port: 587, security: 'starttls', user: '', from: '', senderName: 'Love' },
};
export type ControlOptions = {
  notificationConnections?: () => number;
  initialSettings?: Partial<ControlSettings>;
  adminBootstrap?: { username: string; password: string };
  mailSender?: MailSender;
  onCaptcha?: (id: string, answer: string) => void;
};
export async function createControl(
  db: DB,
  secret: string,
  options: ControlOptions,
  disconnect: (userId: string) => void,
) {
  const bootstrap = (async () => {
    if (options.initialSettings) {
      const initial = settingsSchema.parse({ ...defaults, ...options.initialSettings });
      if (initial.registration !== 'closed' && !(initial.smtp.host && initial.smtp.from))
        throw new Error('首次开放邮箱注册需要 SMTP');
      if (initial.smtp.password) initial.smtp.password = seal(initial.smtp.password, secret);
      await db
        .prepare("INSERT INTO server_config VALUES('control',?) ON CONFLICT(key) DO NOTHING")
        .run(JSON.stringify(initial));
    }
    if (
      (await db.prepare('SELECT id FROM administrators LIMIT 1').get()) ||
      !options.adminBootstrap
    )
      return;
    const v = z
      .object({ username, password: z.string().min(12).max(128) })
      .parse(options.adminBootstrap);
    const password = await hashPassword(v.password);
    if (!(await db.prepare('SELECT id FROM administrators LIMIT 1').get()))
      await db
        .prepare('INSERT INTO administrators VALUES(?,?,?,?)')
        .run(randomUUID(), v.username, password, new Date().toISOString());
  })();
  // Startup configuration errors are observable without exposing credentials.
  let bootstrapError = false;
  void bootstrap.catch(async () => {
    bootstrapError = true;
    await log('error', 'admin.bootstrap.invalid');
  });
  async function readSettings(): Promise<ControlSettings> {
    const row = await db.prepare("SELECT value FROM server_config WHERE key='control'").get();
    return settingsSchema.parse(row ? JSON.parse(String(row.value)) : structuredClone(defaults));
  }
  const readySMTP = async (s?: ControlSettings) => {
    const settings = s || (await readSettings());
    return Boolean(settings.smtp.host && settings.smtp.from);
  };
  async function publicSettings() {
    const s = await readSettings();
    const { password, ...smtp } = s.smtp;
    return {
      ...s,
      smtp: { ...smtp, passwordConfigured: Boolean(password) },
      smtpReady: await readySMTP(s),
    };
  }
  async function smtp(): Promise<SMTP> {
    const s = await readSettings();
    if (!(await readySMTP(s))) fail(503, '邮件服务尚未配置，请联系管理员');
    try {
      return { ...s.smtp, password: unseal(s.smtp.password || '', secret) };
    } catch {
      fail(503, '邮件服务配置已失效，请联系管理员重新保存 SMTP 密码');
    }
  }
  const logWrites = new Set<Promise<unknown>>();
  function trackLog(task: Promise<unknown>) {
    const safe = task.catch(() => console.error('Database log write failed'));
    logWrites.add(safe);
    void safe.finally(() => logWrites.delete(safe));
    return safe;
  }
  async function log(level: string, event: string, details: Record<string, unknown> = {}) {
    if (closed) return;
    await db
      .prepare('INSERT INTO server_logs(createdAt,level,event,details) VALUES(?,?,?,?)')
      .run(new Date().toISOString(), level, event, JSON.stringify(details));
  }
  async function audit(
    id: string,
    action: string,
    target = '',
    details: Record<string, unknown> = {},
  ) {
    await db
      .prepare('INSERT INTO audit_logs(createdAt,adminId,action,target,details) VALUES(?,?,?,?,?)')
      .run(new Date().toISOString(), id, action, target, JSON.stringify(details));
  }
  async function registeredEmailAllowed(address: string) {
    const s = await readSettings();
    if (s.registration === 'closed') fail(403, '当前仅允许管理员创建账号');
    if (!(await readySMTP(s))) fail(503, '邮件服务尚未配置，请联系管理员');
    if (s.domains.length && !s.domains.includes(address.split('@')[1]))
      fail(403, '该邮箱域名暂未开放注册');
    if (
      s.registration === 'whitelist' &&
      !(await db.prepare('SELECT email FROM email_allowlist WHERE email=?').get(address))
    )
      fail(403, '此邮箱不在注册白名单中');
  }
  const digest = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  async function checkInvitation(code?: string) {
    if (!(await readSettings()).invitationRequired) return;
    if (!code) fail(403, '注册需要邀请码，请向管理员获取');
    const row = await db
      .prepare('SELECT * FROM registration_invites WHERE hash=?')
      .get(hashToken(code!.trim()));
    if (
      !row ||
      row.revoked ||
      Number(row.uses) >= Number(row.maxUses) ||
      (Number(row.expires) && Number(row.expires) <= Date.now())
    )
      fail(403, '邀请码无效、已过期或已用完');
    return row;
  }
  async function consumeInvitation(code?: string) {
    const row = await checkInvitation(code);
    if (!row) return;
    const result = await db
      .prepare(
        'UPDATE registration_invites SET uses=uses+1 WHERE id=? AND revoked=0 AND uses<maxUses AND (expires=0 OR expires>?)',
      )
      .run(row.id, Date.now());
    if (!result.changes) fail(403, '邀请码无效、已过期或已用完');
  }

  async function consumeCaptcha(req: Request, purpose: string) {
    const v = z
      .object({ captchaId: z.string().uuid(), captcha: z.string().trim().min(1).max(10) })
      .parse(req.body);
    const row = await db.prepare('DELETE FROM captchas WHERE id=? RETURNING *').get(v.captchaId);
    if (
      !row ||
      row.purpose !== purpose ||
      Number(row.expires) <= Date.now() ||
      row.ipHash !== hashToken(req.ip || '') ||
      !validSignature(String(row.hash), digest(`captcha:${v.captchaId}:${v.captcha.toUpperCase()}`))
    )
      fail(400, '图形验证码错误或已过期，请刷新后重试');
  }
  async function verifyCode(
    address: string,
    purpose: string,
    verificationId: string,
    code: string,
  ) {
    const row = await db
      .prepare('SELECT * FROM email_codes WHERE id=? AND email=? AND purpose=?')
      .get(verificationId, address, purpose);
    if (
      !row ||
      row.status !== 'ready' ||
      Number(row.expires) <= Date.now() ||
      Number(row.attempts) >= 5
    )
      fail(400, '邮件验证码错误或已过期，请重新获取');
    await db.prepare('UPDATE email_codes SET attempts=attempts+1 WHERE id=?').run(verificationId);
    if (
      !validSignature(
        String(row.hash),
        digest(`email:${verificationId}:${address}:${purpose}:${code}`),
      )
    )
      fail(400, '邮件验证码错误或已过期，请重新获取');
    return row;
  }
  async function consumeEmail(
    address: string,
    purpose: string,
    verificationId: string,
    code: string,
    action: () => unknown,
  ) {
    const outcome = await transaction(db, async () => {
      try {
        await verifyCode(address, purpose, verificationId, code);
      } catch (error) {
        return { error };
      } // Persist failed-attempt counters.
      const result = await action();
      await db.prepare('DELETE FROM email_codes WHERE email=? AND purpose=?').run(address, purpose);
      return { result };
    });
    if ('error' in outcome) throw outcome.error;
    return outcome.result;
  }

  async function renderCaptcha(answer: string) {
    const colors = ['#264d40', '#344e5a', '#725c3e'];
    const letters = [...answer]
      .map(
        (ch, i) =>
          `<text x="${21 + i * 30}" y="${39 + randomInt(-4, 5)}" transform="rotate(${randomInt(-14, 15)} ${21 + i * 30} 30)" fill="${colors[i % 3]}" font-family="DejaVu Sans" font-size="30" font-weight="bold">${ch}</text>`,
      )
      .join('');
    const lines = Array.from(
      { length: 7 },
      () =>
        `<path d="M${randomInt(0, 160)} ${randomInt(0, 54)} L${randomInt(0, 160)} ${randomInt(0, 54)}" stroke="#9daea0" stroke-width="1"/>`,
    ).join('');
    return (
      'data:image/png;base64,' +
      (
        await sharp(
          Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><rect width="180" height="60" rx="10" fill="#eeefe7"/>${lines}${letters}</svg>`,
          ),
        )
          .png()
          .toBuffer()
      ).toString('base64')
    );
  }
  function installPublic(app: Express) {
    const challengeLimit = rateLimit({
      windowMs: 3600_000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: '验证码请求过于频繁，请稍后重试' },
    });
    app.get('/api/admin/status', async (_req, res) =>
      res.json({
        adminConfigured: Boolean(await db.prepare('SELECT id FROM administrators LIMIT 1').get()),
      }),
    );
    app.get('/api/auth/config', async (_req, res) => {
      await bootstrap.catch(() => {});
      const s = await readSettings();
      res.json({
        registration: s.registration,
        invitationRequired: s.invitationRequired,
        registrationAvailable: s.registration !== 'closed' && (await readySMTP(s)),
        mailAvailable: await readySMTP(s),
        captchaRequired: true,
      });
    });
    app.get('/api/auth/captcha', challengeLimit, async (req, res) => {
      const purpose = z.enum(['login', 'register', 'admin', 'reset']).parse(req.query.purpose);
      const id = randomUUID(),
        answer = Array.from(
          { length: 5 },
          () => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[randomInt(32)],
        ).join('');
      await db
        .prepare('INSERT INTO captchas VALUES(?,?,?,?,?)')
        .run(
          id,
          digest(`captcha:${id}:${answer}`),
          purpose,
          hashToken(req.ip || ''),
          Date.now() + 300_000,
        );
      const image = await renderCaptcha(answer);
      options.onCaptcha?.(id, answer);
      res.set('Cache-Control', 'no-store').json({ id, image, expiresIn: 300 });
    });
    const mailLimit = rateLimit({
      windowMs: 3600_000,
      limit: 15,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: '邮件请求过于频繁，请稍后重试' },
    });
    app.post('/api/auth/email-code', mailLimit, async (req, res) => {
      const v = z
        .object({
          email,
          purpose: z.enum(['register', 'reset']),
          invitationCode: z.string().trim().max(100).optional(),
        })
        .parse(req.body);
      await consumeCaptcha(req, v.purpose);
      if (v.purpose === 'register') {
        await registeredEmailAllowed(v.email);
        await checkInvitation(v.invitationCode);
      }
      const current = await db
        .prepare(
          'SELECT sentAt FROM email_codes WHERE email=? AND purpose=? ORDER BY sentAt DESC LIMIT 1',
        )
        .get(v.email, v.purpose);
      if (current && Number(current.sentAt) > Date.now() - 60000)
        fail(429, '请等待 60 秒后再获取邮件验证码');
      const id = randomUUID(),
        code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const account = await db
        .prepare('SELECT id FROM users WHERE email=? AND disabled=0')
        .get(v.email);
      if (v.purpose === 'register' && account) fail(409, '该邮箱已创建账号，请直接登录');
      if (v.purpose === 'reset' && !account) {
        res.json({ verificationId: id, retryAfter: 60 });
        return;
      }
      const config = await smtp();
      await db
        .prepare(
          'INSERT INTO email_codes(id,email,purpose,hash,expires,sentAt,status) VALUES(?,?,?,?,?,?,?)',
        )
        .run(
          id,
          v.email,
          v.purpose,
          digest(`email:${id}:${v.email}:${v.purpose}:${code}`),
          Date.now() + 600_000,
          Date.now(),
          'pending',
        );
      try {
        await (options.mailSender || sendMail)(config, {
          to: v.email,
          subject: v.purpose === 'register' ? 'Love · 验证注册邮箱' : 'Love · 重置密码',
          text: `你的${v.purpose === 'register' ? '注册' : '重置密码'}验证码是 ${code}，10 分钟内有效。请勿将验证码提供给他人。\n如果并非你本人操作，请忽略此邮件。`,
        });
      } catch (error) {
        await db.prepare('DELETE FROM email_codes WHERE id=?').run(id);
        await log('error', 'smtp.send.failed', {
          code: String((error as { code?: string }).code || 'SMTP_ERROR').slice(0, 50),
        });
        fail(503, '邮件发送失败，请联系管理员检查 SMTP');
      }
      await transaction(db, async () => {
        await db
          .prepare('DELETE FROM email_codes WHERE email=? AND purpose=? AND id<>?')
          .run(v.email, v.purpose, id);
        await db.prepare("UPDATE email_codes SET status='ready' WHERE id=?").run(id);
      });
      await log('info', 'email.code.sent', { purpose: v.purpose });
      res.json({ verificationId: id, retryAfter: 60 });
    });
    app.post('/api/auth/reset-password', mailLimit, async (req, res) => {
      const v = z
        .object({
          email,
          verificationId: z.string().uuid(),
          code: z.string().regex(/^\d{6}$/),
          password: z.string().min(8).max(128),
        })
        .parse(req.body);
      const password = await hashPassword(v.password);
      const account =
        (await db.prepare('SELECT id FROM users WHERE email=? AND disabled=0').get(v.email)) ||
        fail(400, '邮件验证码错误或已过期');
      await consumeEmail(v.email, 'reset', v.verificationId, v.code, async () => {
        await db
          .prepare('UPDATE users SET password=? WHERE id=?')
          .run(password, String(account.id));
        await db.prepare('DELETE FROM sessions WHERE userId=?').run(String(account.id));
      });
      disconnect(String(account.id));
      await log('info', 'account.password.reset', { userId: account.id });
      res.sendStatus(204);
    });
  }
  function installAdmin(app: Express) {
    const router = Router();
    const limit = rateLimit({
      windowMs: 900_000,
      limit: 20,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: '管理登录尝试过于频繁' },
    });
    router.post('/login', limit, async (req, res) => {
      await bootstrap.catch(() => {});
      if (bootstrapError) fail(503, '管理员启动配置无效，请检查服务器环境变量');
      await consumeCaptcha(req, 'admin');
      const v = z.object({ username, password: z.string().min(1).max(128) }).parse(req.body);
      const row = await db.prepare('SELECT * FROM administrators WHERE username=?').get(v.username);
      if (!row || !(await verifyPassword(v.password, String(row.password)))) {
        await log('warn', 'admin.login.failed');
        fail(401, '管理员账号或密码错误');
      }
      const current = await db
        .prepare('SELECT password FROM administrators WHERE id=?')
        .get(String(row.id));
      if (!current || current.password !== row.password) fail(401, '管理员密码已更改，请重新登录');
      const token = newToken();
      await db
        .prepare('INSERT INTO admin_sessions VALUES(?,?,?)')
        .run(hashToken(token), String(row.id), Date.now() + 8 * 3600_000);
      await audit(String(row.id), 'admin.login');
      res.json({ token, admin: { id: row.id, username: row.username } });
    });
    router.use(async (req, res, next) => {
      const row = await db
        .prepare(
          'SELECT a.id,a.username FROM admin_sessions s JOIN administrators a ON a.id=s.adminId WHERE s.hash=? AND s.expires>?',
        )
        .get(hashToken(req.headers.authorization?.replace(/^Bearer /, '') || ''), Date.now());
      if (!row) {
        res.status(401).json({ error: '需要管理员登录' });
        return;
      }
      Object.assign(req, { admin: row });
      next();
    });
    const admin = (req: Request) => String((req as Request & { admin: { id: string } }).admin.id);
    router.get('/me', (req, res) => res.json((req as Request & { admin: unknown }).admin));
    router.post('/logout', async (req, res) => {
      await db
        .prepare('DELETE FROM admin_sessions WHERE hash=?')
        .run(hashToken(req.headers.authorization?.replace(/^Bearer /, '') || ''));
      await audit(admin(req), 'admin.logout');
      res.sendStatus(204);
    });
    router.post('/password', async (req, res) => {
      const v = z
        .object({ currentPassword: z.string().min(1), password: z.string().min(12).max(128) })
        .parse(req.body);
      const id = admin(req),
        row = (await db.prepare('SELECT password FROM administrators WHERE id=?').get(id))!;
      if (!(await verifyPassword(v.currentPassword, String(row.password))))
        fail(400, '当前密码错误');
      const password = await hashPassword(v.password);
      await transaction(db, async () => {
        await db.prepare('UPDATE administrators SET password=? WHERE id=?').run(password, id);
        await db.prepare('DELETE FROM admin_sessions WHERE adminId=?').run(id);
        await audit(id, 'admin.password.changed');
      });
      res.sendStatus(204);
    });
    router.get('/registration-invites', async (_req, res) => {
      res.json(
        await db
          .prepare(
            'SELECT id,label,uses,maxUses,expires,revoked,createdAt FROM registration_invites ORDER BY createdAt DESC,id LIMIT 1000',
          )
          .all(),
      );
    });
    router.post('/registration-invites', async (req, res) => {
      const v = z
        .object({
          count: z.number().int().min(1).max(200),
          maxUses: z.number().int().min(1).max(10000).default(1),
          expiresDays: z.number().int().min(0).max(3650).default(30),
          label: z.string().trim().max(60).default(''),
        })
        .parse(req.body);
      const expires = v.expiresDays ? Date.now() + v.expiresDays * 86400000 : 0;
      const codes = await transaction(db, async () => {
        const result = [];
        for (let i = 0; i < v.count; i++) {
          const code = randomBytes(18).toString('base64url'),
            id = randomUUID();
          await db
            .prepare(
              'INSERT INTO registration_invites(id,hash,label,maxUses,expires,createdAt) VALUES(?,?,?,?,?,?)',
            )
            .run(id, hashToken(code), v.label, v.maxUses, expires, new Date().toISOString());
          result.push({ id, code, expires, maxUses: v.maxUses });
        }
        await audit(admin(req), 'registration.invites.created', '', {
          count: v.count,
          maxUses: v.maxUses,
          expires,
        });
        return result;
      });
      res.set('Cache-Control', 'no-store').status(201).json({ codes });
    });
    router.patch('/registration-invites/revoke', async (req, res) => {
      const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(req.body);
      await transaction(db, async () => {
        for (const id of ids)
          await db.prepare('UPDATE registration_invites SET revoked=1 WHERE id=?').run(id);
        await audit(admin(req), 'registration.invites.revoked', '', { count: ids.length });
      });
      res.sendStatus(204);
    });
    router.get('/settings', async (_req, res) => res.json(await publicSettings()));
    router.patch('/settings', async (req, res) => {
      const v = settingsSchema.parse(req.body),
        old = await readSettings();
      v.smtp.password = v.smtp.clearPassword
        ? ''
        : v.smtp.password
          ? seal(v.smtp.password, secret)
          : old.smtp.password || '';
      delete v.smtp.clearPassword;
      if (v.registration !== 'closed' && !(await readySMTP(v)))
        fail(400, '请先配置 SMTP 主机和发件邮箱，再开放邮箱注册');
      await db
        .prepare(
          "INSERT INTO server_config(key,value) VALUES('control',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(JSON.stringify(v));
      await audit(admin(req), 'settings.updated', '', {
        registration: v.registration,
        defaultQuotaMiB: v.defaultQuotaMiB,
        retentionDays: v.retentionDays,
        smtpHost: v.smtp.host,
      });
      res.json(await publicSettings());
    });
    router.post('/smtp/test', async (req, res) => {
      const v = z.object({ email }).parse(req.body);
      try {
        await (options.mailSender || sendMail)(await smtp(), {
          to: v.email,
          subject: 'Love · SMTP 测试',
          text: '这是一封管理后台发送的测试邮件。收到此邮件说明 SMTP 配置可用于发送注册验证码。',
        });
      } catch (error) {
        await log('error', 'smtp.test.failed', {
          code: String((error as { code?: string }).code || 'SMTP_ERROR'),
        });
        fail(503, 'SMTP 测试发送失败，请检查主机、端口、加密方式和凭据');
      }
      await audit(admin(req), 'smtp.test');
      res.json({ sent: true });
    });
    router.get('/allowlist', async (_req, res) =>
      res.json(
        await db.prepare('SELECT * FROM email_allowlist ORDER BY createdAt DESC LIMIT 1000').all(),
      ),
    );
    router.post('/allowlist', async (req, res) => {
      const v = z.object({ email, note: z.string().trim().max(120).default('') }).parse(req.body);
      await db
        .prepare(
          'INSERT INTO email_allowlist VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET note=excluded.note',
        )
        .run(v.email, v.note, new Date().toISOString());
      await audit(admin(req), 'allowlist.upsert', v.email);
      res.status(201).json(v);
    });
    router.delete('/allowlist', async (req, res) => {
      const v = z.object({ email }).parse(req.body);
      await db.prepare('DELETE FROM email_allowlist WHERE email=?').run(v.email);
      await audit(admin(req), 'allowlist.remove', v.email);
      res.sendStatus(204);
    });
    router.get('/overview', async (_req, res) => {
      const count = async (sql: string) =>
        Number(
          (await db
            .prepare(sql)
            .get(...(sql.includes('?') ? [new Date(Date.now() - 86400000).toISOString()] : [])))!.n,
        );
      res.json({
        users: await count('SELECT COUNT(*) n FROM users'),
        disabledUsers: await count('SELECT COUNT(*) n FROM users WHERE disabled=1'),
        pairedUsers: await count('SELECT COUNT(*) n FROM users WHERE coupleId IS NOT NULL'),
        activeCouples: await count(
          'SELECT COUNT(*) n FROM (SELECT coupleId FROM users WHERE coupleId IS NOT NULL GROUP BY coupleId HAVING COUNT(*)=2)',
        ),
        media: await count('SELECT COUNT(*) n FROM media'),
        images: await count("SELECT COUNT(*) n FROM media WHERE kind='image'"),
        videos: await count("SELECT COUNT(*) n FROM media WHERE kind='video'"),
        storageBytes: await count('SELECT COALESCE(SUM(totalBytes),0) n FROM media_sizes'),
        messages: await count('SELECT COUNT(*) n FROM messages'),
        moments: await count('SELECT COUNT(*) n FROM moments'),
        requests24h: await count('SELECT COUNT(*) n FROM access_logs WHERE createdAt>?'),
        errors24h: await count(
          'SELECT COUNT(*) n FROM access_logs WHERE status>=500 AND createdAt>?',
        ),
        aiPending: await count("SELECT COUNT(*) n FROM ai_jobs WHERE status='pending'"),
        aiFailed: await count('SELECT COUNT(*) n FROM ai_jobs WHERE error IS NOT NULL'),
        notificationConnections: (await options.notificationConnections?.()) || 0,
        uptime: Math.floor(process.uptime()),
        node: process.version,
        database: db.provider,
        registration: (await readSettings()).registration,
        smtpReady: await readySMTP(),
        retentionDays: (await readSettings()).retentionDays,
      });
    });
    const pagination = (req: Request) => ({
      page: z.coerce.number().int().min(1).max(100000).default(1).parse(req.query.page),
      search: z.string().trim().max(100).default('').parse(req.query.search),
    });
    router.get('/users', async (req, res) => {
      const { page, search } = pagination(req);
      const filter = 'instr(lower(u.username||u.name||u.email),lower(?))>0';
      const total = Number(
        (await db.prepare(`SELECT COUNT(*) n FROM users u WHERE ${filter}`).get(search))!.n,
      );
      const items = await db
        .prepare(
          `SELECT u.id,u.username,u.name,u.email,u.verifiedAt,u.disabled,u.createdAt,u.lastLoginAt,u.coupleId,(SELECT COALESCE(SUM(s.totalBytes),0) FROM media m JOIN media_sizes s ON s.mediaId=m.id WHERE m.ownerId=u.id) storageBytes FROM users u WHERE ${filter} ORDER BY u.createdAt DESC,u.id LIMIT 30 OFFSET ?`,
        )
        .all(search, (page - 1) * 30);
      res.json({ items, total, page, pageSize: 30 });
    });
    router.post('/users', async (req, res) => {
      const v = z
        .object({
          username,
          email,
          name: z.string().trim().min(1).max(40),
          password: z.string().min(8).max(128),
          confirmedEmail: z.literal(true),
        })
        .parse(req.body);
      const password = await hashPassword(v.password),
        id = randomUUID();
      try {
        await db
          .prepare(
            'INSERT INTO users(id,username,name,email,password,verifiedAt) VALUES(?,?,?,?,?,?)',
          )
          .run(id, v.username, v.name, v.email, password, new Date().toISOString());
      } catch {
        fail(409, '用户名或邮箱已存在');
      }
      await audit(admin(req), 'account.created', id, { verification: 'administrator' });
      res.status(201).json({ id, username: v.username, email: v.email });
    });
    router.patch('/users/:id', async (req, res) => {
      const id = z.string().uuid().parse(req.params.id);
      if (!(await db.prepare('SELECT id FROM users WHERE id=?').get(id))) fail(404, '账号不存在');
      const v = z
        .object({
          disabled: z.boolean().optional(),
          password: z.string().min(8).max(128).optional(),
          revokeSessions: z.boolean().optional(),
        })
        .refine((x) => Object.keys(x).length > 0)
        .parse(req.body);
      const password = v.password ? await hashPassword(v.password) : null;
      await transaction(db, async () => {
        if (v.disabled !== undefined)
          await db.prepare('UPDATE users SET disabled=? WHERE id=?').run(Number(v.disabled), id);
        if (password) await db.prepare('UPDATE users SET password=? WHERE id=?').run(password, id);
        if (v.disabled || password || v.revokeSessions) {
          await db.prepare('DELETE FROM sessions WHERE userId=?').run(id);
          await db.prepare('DELETE FROM invites WHERE userId=?').run(id);
        }
        await audit(admin(req), 'account.updated', id, {
          disabled: v.disabled,
          passwordChanged: Boolean(password),
          sessionsRevoked: Boolean(v.disabled || password || v.revokeSessions),
        });
      });
      if (v.disabled || password || v.revokeSessions) disconnect(id);
      res.sendStatus(204);
    });
    router.get('/couples', async (req, res) => {
      const { page, search } = pagination(req);
      const filter =
        "(?='' OR c.id=? OR EXISTS(SELECT 1 FROM users u WHERE u.coupleId=c.id AND instr(lower(u.username||u.name||u.email),lower(?))>0))";
      const total = Number(
        (await db
          .prepare(`SELECT COUNT(*) n FROM couples c WHERE ${filter}`)
          .get(search, search, search))!.n,
      );
      const rows = await db
        .prepare(
          `SELECT c.id,c.startDate,(SELECT COUNT(*) FROM messages WHERE coupleId=c.id) messages,(SELECT COUNT(*) FROM moments WHERE coupleId=c.id) moments,(SELECT COUNT(*) FROM media WHERE coupleId=c.id) media,(SELECT COALESCE(SUM(s.totalBytes),0) FROM media m JOIN media_sizes s ON s.mediaId=m.id WHERE m.coupleId=c.id) storageBytes,(SELECT quotaMiB FROM couple_limits WHERE coupleId=c.id) quotaMiB FROM couples c WHERE ${filter} ORDER BY COALESCE((SELECT MAX(createdAt) FROM users WHERE coupleId=c.id),'') DESC,c.id LIMIT 30 OFFSET ?`,
        )
        .all(search, search, search, (page - 1) * 30);
      res.json({
        items: await Promise.all(
          rows.map(async (r) => {
            const members = await db
              .prepare(
                'SELECT id,name,username,email,disabled FROM users WHERE coupleId=? ORDER BY username',
              )
              .all(String(r.id));
            return {
              ...r,
              members,
              active: members.length === 2,
              effectiveQuotaMiB: r.quotaMiB ?? 0,
            };
          }),
        ),
        total,
        page,
        pageSize: 30,
      });
    });
    router.patch('/couples/:id/quota', async (req, res) => {
      const id = z.string().uuid().parse(req.params.id),
        v = z
          .object({ quotaMiB: z.number().int().min(0).max(1_000_000).nullable() })
          .parse(req.body);
      if (!(await db.prepare('SELECT id FROM couples WHERE id=?').get(id)))
        fail(404, '两人空间不存在');
      await db
        .prepare(
          'INSERT INTO couple_limits VALUES(?,?) ON CONFLICT(coupleId) DO UPDATE SET quotaMiB=excluded.quotaMiB',
        )
        .run(id, v.quotaMiB ?? (await readSettings()).defaultQuotaMiB);
      await audit(admin(req), 'couple.quota.updated', id, { quotaMiB: v.quotaMiB });
      res.sendStatus(204);
    });
    router.get('/logs/:kind', async (req, res) => {
      const kind = z.enum(['access', 'server', 'audit']).parse(req.params.kind);
      const { page, search } = pagination(req);
      const from = z.string().datetime().optional().parse(req.query.from),
        to = z.string().datetime().optional().parse(req.query.to);
      if (from && to && from > to) fail(400, '开始时间不能晚于结束时间');
      const table = { access: 'access_logs', server: 'server_logs', audit: 'audit_logs' }[kind];
      let clause = '1=1';
      const params: (string | number)[] = [];
      if (from) {
        clause += ' AND createdAt>=?';
        params.push(from);
      }
      if (to) {
        clause += ' AND createdAt<=?';
        params.push(to);
      }
      if (search) {
        clause +=
          kind === 'access'
            ? ' AND instr(lower(path||method||ip),lower(?))>0'
            : kind === 'server'
              ? ' AND instr(lower(event||details),lower(?))>0'
              : ' AND instr(lower(action||target),lower(?))>0';
        params.push(search);
      }
      if (kind === 'server' && req.query.level) {
        clause += ' AND level=?';
        params.push(z.enum(['info', 'warn', 'error']).parse(req.query.level));
      }
      if (kind === 'access' && req.query.status) {
        clause += ' AND status>=? AND status<?';
        const group = z.enum(['2', '3', '4', '5']).parse(req.query.status);
        params.push(Number(group) * 100, Number(group) * 100 + 100);
      }
      const total = Number(
        (await db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${clause}`).get(...params))!.n,
      );
      const rows = await db
        .prepare(`SELECT * FROM ${table} WHERE ${clause} ORDER BY id DESC LIMIT 50 OFFSET ?`)
        .all(...params, (page - 1) * 50);
      res.json({
        items: rows.map((r) => (r.details ? { ...r, details: JSON.parse(String(r.details)) } : r)),
        total,
        page,
        pageSize: 50,
      });
    });
    router.use((_req, res) => res.status(404).json({ error: '管理接口不存在' }));
    app.use('/api/admin', router);
  }
  let closed = false;
  function access(req: Request, res: Response, next: NextFunction) {
    const started = performance.now(),
      requestId = randomUUID(),
      requestPath = req.path;
    res.setHeader('X-Request-ID', requestId);
    Object.assign(req, { requestId });
    res.on('finish', async () => {
      if (closed || req.path === '/api/health') return;
      const actor = req as Request & { user?: { id: string }; admin?: { id: string } };
      await trackLog(
        db
          .prepare(
            'INSERT INTO access_logs(requestId,createdAt,method,path,status,durationMs,ip,actorId,userAgent) VALUES(?,?,?,?,?,?,?,?,?)',
          )
          .run(
            requestId,
            new Date().toISOString(),
            req.method,
            requestPath.slice(0, 512),
            res.statusCode,
            Math.round((performance.now() - started) * 100) / 100,
            (req.ip || '').slice(0, 100),
            actor.admin?.id || actor.user?.id || null,
            (req.get('user-agent') || '').replace(/[\x00-\x1f]/g, '').slice(0, 200),
          ),
      );
    });
    next();
  }
  async function quota(coupleId: string | null) {
    if (!coupleId) fail(409, '请先与另一半配对');
    const row = await db
      .prepare('SELECT quotaMiB FROM couple_limits WHERE coupleId=?')
      .get(coupleId);
    return Number(row?.quotaMiB ?? 0) * 1024 * 1024;
  }
  async function usage(coupleId: string) {
    return Number(
      (await db
        .prepare(
          'SELECT COALESCE(SUM(s.totalBytes),0) n FROM media m JOIN media_sizes s ON s.mediaId=m.id WHERE m.coupleId=?',
        )
        .get(coupleId))!.n,
    );
  }
  async function prune() {
    const now = Date.now(),
      cutoff = new Date(now - (await readSettings()).retentionDays * 86400_000).toISOString();
    for (const table of ['access_logs', 'server_logs', 'audit_logs']) {
      await db.prepare(`DELETE FROM ${table} WHERE createdAt<?`).run(cutoff);
      await db.exec(
        `DELETE FROM ${table} WHERE id IN (SELECT id FROM ${table} ORDER BY id DESC LIMIT 9223372036854775807 OFFSET 100000)`,
      );
    }
    await db.prepare('DELETE FROM captchas WHERE expires<?').run(now);
    await db.prepare('DELETE FROM email_codes WHERE expires<?').run(now);
    await db.prepare('DELETE FROM admin_sessions WHERE expires<?').run(now);
  }
  await log('info', 'server.started', { version: '2.4.0' });
  return {
    bootstrap,
    installPublic,
    installAdmin,
    consumeCaptcha,
    consumeEmail,
    verifyCode,
    registeredEmailAllowed,
    checkInvitation,
    consumeInvitation,
    readSettings,
    publicSettings,
    access,
    log,
    quota,
    usage,
    prune,
    close: async () => {
      closed = true;
      await Promise.allSettled([...logWrites]);
    },
  };
}
