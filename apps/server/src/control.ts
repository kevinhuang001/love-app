import type { Request, Response, NextFunction, Express } from 'express';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomInt, randomUUID, createHmac } from 'node:crypto';
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
export type ControlSettings = z.infer<typeof settingsSchema>;
const defaults: ControlSettings = {
  registration: 'closed',
  domains: [],
  defaultQuotaMiB: 0,
  retentionDays: 30,
  smtp: { host: '', port: 587, security: 'starttls', user: '', from: '', senderName: 'Love' },
};
export type ControlOptions = {
  adminBootstrap?: { username: string; password: string };
  mailSender?: MailSender;
  onCaptcha?: (id: string, answer: string) => void;
};
export function createControl(
  db: DB,
  secret: string,
  options: ControlOptions,
  disconnect: (userId: string) => void,
) {
  db.exec(`CREATE TABLE IF NOT EXISTS server_config(key TEXT PRIMARY KEY,value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS administrators(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,createdAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS admin_sessions(hash TEXT PRIMARY KEY,adminId TEXT NOT NULL REFERENCES administrators(id),expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS captchas(id TEXT PRIMARY KEY,hash TEXT NOT NULL,purpose TEXT NOT NULL,ipHash TEXT NOT NULL,expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS email_codes(id TEXT PRIMARY KEY,email TEXT NOT NULL,purpose TEXT NOT NULL,hash TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,expires INTEGER NOT NULL,sentAt INTEGER NOT NULL,status TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS email_codes_email ON email_codes(email,purpose,sentAt);
  CREATE TABLE IF NOT EXISTS email_allowlist(email TEXT PRIMARY KEY,note TEXT NOT NULL,createdAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS media_sizes(mediaId TEXT PRIMARY KEY REFERENCES media(id),originalBytes INTEGER NOT NULL,previewBytes INTEGER NOT NULL,thumbnailBytes INTEGER NOT NULL,totalBytes INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS couple_limits(coupleId TEXT PRIMARY KEY REFERENCES couples(id),quotaMiB INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS access_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,requestId TEXT NOT NULL,createdAt TEXT NOT NULL,method TEXT NOT NULL,path TEXT NOT NULL,status INTEGER NOT NULL,durationMs REAL NOT NULL,ip TEXT NOT NULL,actorId TEXT,userAgent TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS access_logs_created ON access_logs(createdAt,id);
  CREATE TABLE IF NOT EXISTS server_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,createdAt TEXT NOT NULL,level TEXT NOT NULL,event TEXT NOT NULL,details TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,createdAt TEXT NOT NULL,adminId TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,details TEXT NOT NULL);`);
  const bootstrap = (async () => {
    if (db.prepare('SELECT id FROM administrators LIMIT 1').get() || !options.adminBootstrap)
      return;
    const v = z
      .object({ username, password: z.string().min(12).max(128) })
      .parse(options.adminBootstrap);
    const password = await hashPassword(v.password);
    if (!db.prepare('SELECT id FROM administrators LIMIT 1').get())
      db.prepare('INSERT INTO administrators VALUES(?,?,?,?)').run(
        randomUUID(),
        v.username,
        password,
        new Date().toISOString(),
      );
  })();
  // Startup configuration errors are observable without exposing credentials.
  let bootstrapError = false;
  void bootstrap.catch(() => {
    bootstrapError = true;
    log('error', 'admin.bootstrap.invalid');
  });
  function readSettings(): ControlSettings {
    const row = db.prepare("SELECT value FROM server_config WHERE key='control'").get();
    return row ? JSON.parse(String(row.value)) : structuredClone(defaults);
  }
  const readySMTP = (s = readSettings()) => Boolean(s.smtp.host && s.smtp.from);
  function publicSettings() {
    const s = readSettings();
    const { password, ...smtp } = s.smtp;
    return {
      ...s,
      smtp: { ...smtp, passwordConfigured: Boolean(password) },
      smtpReady: readySMTP(s),
    };
  }
  function smtp(): SMTP {
    const s = readSettings();
    if (!readySMTP(s)) fail(503, '邮件服务尚未配置，请联系管理员');
    try {
      return { ...s.smtp, password: unseal(s.smtp.password || '', secret) };
    } catch {
      fail(503, '邮件服务配置已失效，请联系管理员重新保存 SMTP 密码');
    }
  }
  function log(level: string, event: string, details: Record<string, unknown> = {}) {
    if (closed) return;
    db.prepare('INSERT INTO server_logs(createdAt,level,event,details) VALUES(?,?,?,?)').run(
      new Date().toISOString(),
      level,
      event,
      JSON.stringify(details),
    );
  }
  function audit(id: string, action: string, target = '', details: Record<string, unknown> = {}) {
    db.prepare(
      'INSERT INTO audit_logs(createdAt,adminId,action,target,details) VALUES(?,?,?,?,?)',
    ).run(new Date().toISOString(), id, action, target, JSON.stringify(details));
  }
  function registeredEmailAllowed(address: string) {
    const s = readSettings();
    if (s.registration === 'closed') fail(403, '当前仅允许管理员创建账号');
    if (!readySMTP(s)) fail(503, '邮件服务尚未配置，请联系管理员');
    if (s.domains.length && !s.domains.includes(address.split('@')[1]))
      fail(403, '该邮箱域名暂未开放注册');
    if (
      s.registration === 'whitelist' &&
      !db.prepare('SELECT email FROM email_allowlist WHERE email=?').get(address)
    )
      fail(403, '此邮箱不在注册白名单中');
  }
  const digest = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  function consumeCaptcha(req: Request, purpose: string) {
    const v = z
      .object({ captchaId: z.string().uuid(), captcha: z.string().trim().min(1).max(10) })
      .parse(req.body);
    const row = db.prepare('SELECT * FROM captchas WHERE id=?').get(v.captchaId);
    db.prepare('DELETE FROM captchas WHERE id=?').run(v.captchaId);
    if (
      !row ||
      row.purpose !== purpose ||
      Number(row.expires) <= Date.now() ||
      row.ipHash !== hashToken(req.ip || '') ||
      !validSignature(String(row.hash), digest(`captcha:${v.captchaId}:${v.captcha.toUpperCase()}`))
    )
      fail(400, '图形验证码错误或已过期，请刷新后重试');
  }
  function verifyCode(address: string, purpose: string, verificationId: string, code: string) {
    const row = db
      .prepare('SELECT * FROM email_codes WHERE id=? AND email=? AND purpose=?')
      .get(verificationId, address, purpose);
    if (
      !row ||
      row.status !== 'ready' ||
      Number(row.expires) <= Date.now() ||
      Number(row.attempts) >= 5
    )
      fail(400, '邮件验证码错误或已过期，请重新获取');
    db.prepare('UPDATE email_codes SET attempts=attempts+1 WHERE id=?').run(verificationId);
    if (
      !validSignature(
        String(row.hash),
        digest(`email:${verificationId}:${address}:${purpose}:${code}`),
      )
    )
      fail(400, '邮件验证码错误或已过期，请重新获取');
    return row;
  }
  function consumeEmail(
    address: string,
    purpose: string,
    verificationId: string,
    code: string,
    action: () => unknown,
  ) {
    verifyCode(address, purpose, verificationId, code);
    return transaction(db, () => {
      const result = action();
      db.prepare('DELETE FROM email_codes WHERE email=? AND purpose=?').run(address, purpose);
      return result;
    });
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
    app.get('/api/auth/config', async (_req, res) => {
      await bootstrap.catch(() => {});
      const s = readSettings();
      res.json({
        registration: s.registration,
        registrationAvailable: s.registration !== 'closed' && readySMTP(s),
        mailAvailable: readySMTP(s),
        adminConfigured: Boolean(db.prepare('SELECT id FROM administrators LIMIT 1').get()),
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
      db.prepare('INSERT INTO captchas VALUES(?,?,?,?,?)').run(
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
      const v = z.object({ email, purpose: z.enum(['register', 'reset']) }).parse(req.body);
      consumeCaptcha(req, v.purpose);
      if (v.purpose === 'register') registeredEmailAllowed(v.email);
      const current = db
        .prepare(
          'SELECT sentAt FROM email_codes WHERE email=? AND purpose=? ORDER BY sentAt DESC LIMIT 1',
        )
        .get(v.email, v.purpose);
      if (current && Number(current.sentAt) > Date.now() - 60000)
        fail(429, '请等待 60 秒后再获取邮件验证码');
      const id = randomUUID(),
        code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const account = db.prepare('SELECT id FROM users WHERE email=? AND disabled=0').get(v.email);
      if (v.purpose === 'register' && account) fail(409, '该邮箱已创建账号，请直接登录');
      if (v.purpose === 'reset' && !account) {
        res.json({ verificationId: id, retryAfter: 60 });
        return;
      }
      const config = smtp();
      db.prepare(
        'INSERT INTO email_codes(id,email,purpose,hash,expires,sentAt,status) VALUES(?,?,?,?,?,?,?)',
      ).run(
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
        db.prepare('DELETE FROM email_codes WHERE id=?').run(id);
        log('error', 'smtp.send.failed', {
          code: String((error as { code?: string }).code || 'SMTP_ERROR').slice(0, 50),
        });
        fail(503, '邮件发送失败，请联系管理员检查 SMTP');
      }
      transaction(db, () => {
        db.prepare('DELETE FROM email_codes WHERE email=? AND purpose=? AND id<>?').run(
          v.email,
          v.purpose,
          id,
        );
        db.prepare("UPDATE email_codes SET status='ready' WHERE id=?").run(id);
      });
      log('info', 'email.code.sent', { purpose: v.purpose });
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
        db.prepare('SELECT id FROM users WHERE email=? AND disabled=0').get(v.email) ||
        fail(400, '邮件验证码错误或已过期');
      consumeEmail(v.email, 'reset', v.verificationId, v.code, () => {
        db.prepare('UPDATE users SET password=? WHERE id=?').run(password, String(account.id));
        db.prepare('DELETE FROM sessions WHERE userId=?').run(String(account.id));
      });
      disconnect(String(account.id));
      log('info', 'account.password.reset', { userId: account.id });
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
      consumeCaptcha(req, 'admin');
      const v = z.object({ username, password: z.string().min(1).max(128) }).parse(req.body);
      const row = db.prepare('SELECT * FROM administrators WHERE username=?').get(v.username);
      if (!row || !(await verifyPassword(v.password, String(row.password)))) {
        log('warn', 'admin.login.failed');
        fail(401, '管理员账号或密码错误');
      }
      const current = db
        .prepare('SELECT password FROM administrators WHERE id=?')
        .get(String(row.id));
      if (!current || current.password !== row.password) fail(401, '管理员密码已更改，请重新登录');
      const token = newToken();
      db.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').run(
        hashToken(token),
        String(row.id),
        Date.now() + 8 * 3600_000,
      );
      audit(String(row.id), 'admin.login');
      res.json({ token, admin: { id: row.id, username: row.username } });
    });
    router.use((req, res, next) => {
      const row = db
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
    router.post('/logout', (req, res) => {
      db.prepare('DELETE FROM admin_sessions WHERE hash=?').run(
        hashToken(req.headers.authorization?.replace(/^Bearer /, '') || ''),
      );
      audit(admin(req), 'admin.logout');
      res.sendStatus(204);
    });
    router.post('/password', async (req, res) => {
      const v = z
        .object({ currentPassword: z.string().min(1), password: z.string().min(12).max(128) })
        .parse(req.body);
      const id = admin(req),
        row = db.prepare('SELECT password FROM administrators WHERE id=?').get(id)!;
      if (!(await verifyPassword(v.currentPassword, String(row.password))))
        fail(400, '当前密码错误');
      const password = await hashPassword(v.password);
      transaction(db, () => {
        db.prepare('UPDATE administrators SET password=? WHERE id=?').run(password, id);
        db.prepare('DELETE FROM admin_sessions WHERE adminId=?').run(id);
        audit(id, 'admin.password.changed');
      });
      res.sendStatus(204);
    });
    router.get('/settings', (_req, res) => res.json(publicSettings()));
    router.patch('/settings', (req, res) => {
      const v = settingsSchema.parse(req.body),
        old = readSettings();
      v.smtp.password = v.smtp.clearPassword
        ? ''
        : v.smtp.password
          ? seal(v.smtp.password, secret)
          : old.smtp.password || '';
      delete v.smtp.clearPassword;
      if (v.registration !== 'closed' && !readySMTP(v))
        fail(400, '请先配置 SMTP 主机和发件邮箱，再开放邮箱注册');
      db.prepare(
        "INSERT INTO server_config(key,value) VALUES('control',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      ).run(JSON.stringify(v));
      audit(admin(req), 'settings.updated', '', {
        registration: v.registration,
        defaultQuotaMiB: v.defaultQuotaMiB,
        retentionDays: v.retentionDays,
        smtpHost: v.smtp.host,
      });
      res.json(publicSettings());
    });
    router.post('/smtp/test', async (req, res) => {
      const v = z.object({ email }).parse(req.body);
      try {
        await (options.mailSender || sendMail)(smtp(), {
          to: v.email,
          subject: 'Love · SMTP 测试',
          text: '这是一封管理后台发送的测试邮件。收到此邮件说明 SMTP 配置可用于发送注册验证码。',
        });
      } catch (error) {
        log('error', 'smtp.test.failed', {
          code: String((error as { code?: string }).code || 'SMTP_ERROR'),
        });
        fail(503, 'SMTP 测试发送失败，请检查主机、端口、加密方式和凭据');
      }
      audit(admin(req), 'smtp.test');
      res.json({ sent: true });
    });
    router.get('/allowlist', (_req, res) =>
      res.json(
        db.prepare('SELECT * FROM email_allowlist ORDER BY createdAt DESC LIMIT 1000').all(),
      ),
    );
    router.post('/allowlist', (req, res) => {
      const v = z.object({ email, note: z.string().trim().max(120).default('') }).parse(req.body);
      db.prepare(
        'INSERT INTO email_allowlist VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET note=excluded.note',
      ).run(v.email, v.note, new Date().toISOString());
      audit(admin(req), 'allowlist.upsert', v.email);
      res.status(201).json(v);
    });
    router.delete('/allowlist', (req, res) => {
      const v = z.object({ email }).parse(req.body);
      db.prepare('DELETE FROM email_allowlist WHERE email=?').run(v.email);
      audit(admin(req), 'allowlist.remove', v.email);
      res.sendStatus(204);
    });
    router.get('/overview', (_req, res) => {
      const count = (sql: string) => Number(db.prepare(sql).get()!.n);
      res.json({
        users: count('SELECT COUNT(*) n FROM users'),
        disabledUsers: count('SELECT COUNT(*) n FROM users WHERE disabled=1'),
        pairedUsers: count('SELECT COUNT(*) n FROM users WHERE coupleId IS NOT NULL'),
        activeCouples: count(
          'SELECT COUNT(*) n FROM (SELECT coupleId FROM users WHERE coupleId IS NOT NULL GROUP BY coupleId HAVING COUNT(*)=2)',
        ),
        media: count('SELECT COUNT(*) n FROM media'),
        images: count("SELECT COUNT(*) n FROM media WHERE kind='image'"),
        videos: count("SELECT COUNT(*) n FROM media WHERE kind='video'"),
        storageBytes: count('SELECT COALESCE(SUM(totalBytes),0) n FROM media_sizes'),
        messages: count('SELECT COUNT(*) n FROM messages'),
        moments: count('SELECT COUNT(*) n FROM moments'),
        requests24h: count(
          "SELECT COUNT(*) n FROM access_logs WHERE createdAt>strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 day')",
        ),
        errors24h: count(
          "SELECT COUNT(*) n FROM access_logs WHERE status>=500 AND createdAt>strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 day')",
        ),
        aiPending: count("SELECT COUNT(*) n FROM ai_jobs WHERE status='pending'"),
        aiFailed: count('SELECT COUNT(*) n FROM ai_jobs WHERE error IS NOT NULL'),
        pushPending: count('SELECT COUNT(*) n FROM push_jobs'),
        uptime: Math.floor(process.uptime()),
        node: process.version,
        registration: readSettings().registration,
        smtpReady: readySMTP(),
        retentionDays: readSettings().retentionDays,
      });
    });
    const pagination = (req: Request) => ({
      page: z.coerce.number().int().min(1).max(100000).default(1).parse(req.query.page),
      search: z.string().trim().max(100).default('').parse(req.query.search),
    });
    router.get('/users', (req, res) => {
      const { page, search } = pagination(req);
      const filter = 'instr(lower(u.username||u.name||u.email),lower(?))>0';
      const total = Number(
        db.prepare(`SELECT COUNT(*) n FROM users u WHERE ${filter}`).get(search)!.n,
      );
      const items = db
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
        db.prepare(
          'INSERT INTO users(id,username,name,email,password,verifiedAt) VALUES(?,?,?,?,?,?)',
        ).run(id, v.username, v.name, v.email, password, new Date().toISOString());
      } catch {
        fail(409, '用户名或邮箱已存在');
      }
      audit(admin(req), 'account.created', id, { verification: 'administrator' });
      res.status(201).json({ id, username: v.username, email: v.email });
    });
    router.patch('/users/:id', async (req, res) => {
      const id = z.string().uuid().parse(req.params.id);
      if (!db.prepare('SELECT id FROM users WHERE id=?').get(id)) fail(404, '账号不存在');
      const v = z
        .object({
          disabled: z.boolean().optional(),
          password: z.string().min(8).max(128).optional(),
          revokeSessions: z.boolean().optional(),
        })
        .refine((x) => Object.keys(x).length > 0)
        .parse(req.body);
      const password = v.password ? await hashPassword(v.password) : null;
      transaction(db, () => {
        if (v.disabled !== undefined)
          db.prepare('UPDATE users SET disabled=? WHERE id=?').run(Number(v.disabled), id);
        if (password) db.prepare('UPDATE users SET password=? WHERE id=?').run(password, id);
        if (v.disabled || password || v.revokeSessions) {
          db.prepare('DELETE FROM sessions WHERE userId=?').run(id);
          db.prepare('DELETE FROM devices WHERE userId=?').run(id);
          db.prepare('DELETE FROM invites WHERE userId=?').run(id);
        }
        audit(admin(req), 'account.updated', id, {
          disabled: v.disabled,
          passwordChanged: Boolean(password),
          sessionsRevoked: Boolean(v.disabled || password || v.revokeSessions),
        });
      });
      if (v.disabled || password || v.revokeSessions) disconnect(id);
      res.sendStatus(204);
    });
    router.get('/couples', (req, res) => {
      const { page, search } = pagination(req);
      const filter =
        "(?='' OR c.id=? OR EXISTS(SELECT 1 FROM users u WHERE u.coupleId=c.id AND instr(lower(u.username||u.name||u.email),lower(?))>0))";
      const total = Number(
        db.prepare(`SELECT COUNT(*) n FROM couples c WHERE ${filter}`).get(search, search, search)!
          .n,
      );
      const rows = db
        .prepare(
          `SELECT c.id,c.startDate,(SELECT COUNT(*) FROM messages WHERE coupleId=c.id) messages,(SELECT COUNT(*) FROM moments WHERE coupleId=c.id) moments,(SELECT COUNT(*) FROM media WHERE coupleId=c.id) media,(SELECT COALESCE(SUM(s.totalBytes),0) FROM media m JOIN media_sizes s ON s.mediaId=m.id WHERE m.coupleId=c.id) storageBytes,(SELECT quotaMiB FROM couple_limits WHERE coupleId=c.id) quotaMiB FROM couples c WHERE ${filter} ORDER BY c.rowid DESC LIMIT 30 OFFSET ?`,
        )
        .all(search, search, search, (page - 1) * 30);
      res.json({
        items: rows.map((r) => {
          const members = db
            .prepare(
              'SELECT id,name,username,email,disabled FROM users WHERE coupleId=? ORDER BY username',
            )
            .all(String(r.id));
          return {
            ...r,
            members,
            active: members.length === 2,
            effectiveQuotaMiB: r.quotaMiB ?? readSettings().defaultQuotaMiB,
          };
        }),
        total,
        page,
        pageSize: 30,
      });
    });
    router.patch('/couples/:id/quota', (req, res) => {
      const id = z.string().uuid().parse(req.params.id),
        v = z
          .object({ quotaMiB: z.number().int().min(0).max(1_000_000).nullable() })
          .parse(req.body);
      if (!db.prepare('SELECT id FROM couples WHERE id=?').get(id)) fail(404, '两人空间不存在');
      if (v.quotaMiB === null) db.prepare('DELETE FROM couple_limits WHERE coupleId=?').run(id);
      else
        db.prepare(
          'INSERT INTO couple_limits VALUES(?,?) ON CONFLICT(coupleId) DO UPDATE SET quotaMiB=excluded.quotaMiB',
        ).run(id, v.quotaMiB);
      audit(admin(req), 'couple.quota.updated', id, { quotaMiB: v.quotaMiB });
      res.sendStatus(204);
    });
    router.get('/logs/:kind', (req, res) => {
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
        db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${clause}`).get(...params)!.n,
      );
      const rows = db
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
    res.on('finish', () => {
      if (closed || req.path === '/api/health') return;
      const actor = req as Request & { user?: { id: string }; admin?: { id: string } };
      db.prepare(
        'INSERT INTO access_logs(requestId,createdAt,method,path,status,durationMs,ip,actorId,userAgent) VALUES(?,?,?,?,?,?,?,?,?)',
      ).run(
        requestId,
        new Date().toISOString(),
        req.method,
        requestPath.slice(0, 512),
        res.statusCode,
        Math.round((performance.now() - started) * 100) / 100,
        (req.ip || '').slice(0, 100),
        actor.admin?.id || actor.user?.id || null,
        (req.get('user-agent') || '').replace(/[\x00-\x1f]/g, '').slice(0, 200),
      );
    });
    next();
  }
  function quota(coupleId: string | null) {
    if (!coupleId) return 0;
    const row = db.prepare('SELECT quotaMiB FROM couple_limits WHERE coupleId=?').get(coupleId);
    return Number(row?.quotaMiB ?? readSettings().defaultQuotaMiB) * 1024 * 1024;
  }
  function usage(coupleId: string) {
    return Number(
      db
        .prepare(
          'SELECT COALESCE(SUM(s.totalBytes),0) n FROM media m JOIN media_sizes s ON s.mediaId=m.id WHERE m.coupleId=?',
        )
        .get(coupleId)!.n,
    );
  }
  function prune() {
    const now = Date.now(),
      cutoff = new Date(now - readSettings().retentionDays * 86400_000).toISOString();
    for (const table of ['access_logs', 'server_logs', 'audit_logs']) {
      db.prepare(`DELETE FROM ${table} WHERE createdAt<?`).run(cutoff);
      db.exec(
        `DELETE FROM ${table} WHERE id IN (SELECT id FROM ${table} ORDER BY id DESC LIMIT -1 OFFSET 100000)`,
      );
    }
    db.prepare('DELETE FROM captchas WHERE expires<?').run(now);
    db.prepare('DELETE FROM email_codes WHERE expires<?').run(now);
    db.prepare('DELETE FROM admin_sessions WHERE expires<?').run(now);
  }
  log('info', 'server.started', { version: '2.0.0' });
  return {
    bootstrap,
    installPublic,
    installAdmin,
    consumeCaptcha,
    consumeEmail,
    verifyCode,
    registeredEmailAllowed,
    readSettings,
    publicSettings,
    access,
    log,
    quota,
    usage,
    prune,
    close: () => {
      closed = true;
    },
  };
}
