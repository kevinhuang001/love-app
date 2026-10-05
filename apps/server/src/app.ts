import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { createServer } from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { Server } from 'socket.io';
import { z } from 'zod';
import { openDatabase, transaction, type User } from './db.js';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  newToken,
  signMedia,
  validSignature,
} from './security.js';
import { processMedia } from './media.js';
import { pushWorker, type PushSender } from './push.js';
import {
  initializeAI,
  aiConfigSchema,
  validateAIUrl,
  encryptKey,
  aiWorker,
  executeTool,
  tools as aiTools,
} from './ai.js';

type AuthRequest = Request & { user: User; sessionHash: string };
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
const text = z.string().trim();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(value);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }, '日期无效');
const credentials = z.object({
  username: text.toLowerCase().regex(/^[a-z0-9_]{3,24}$/),
  password: z.string().min(8).max(128),
  name: text.min(1).max(40).optional(),
});
const safeUser = (user: User) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  coupleId: user.coupleId,
});
export type AppOptions = {
  database?: string;
  uploads?: string;
  mediaSecret?: string;
  origins?: string[];
  pushSender?: PushSender;
  production?: boolean;
  staticDir?: string;
};
export function createApp(options: AppOptions = {}) {
  const db = openDatabase(options.database || 'data/love.sqlite');
  initializeAI(db);
  const uploads = resolve(options.uploads || 'data/media');
  mkdirSync(join(uploads, 'tmp'), { recursive: true });
  db.exec('CREATE TABLE IF NOT EXISTS server_config(key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  if (
    !options.mediaSecret &&
    !db.prepare("SELECT value FROM server_config WHERE key='mediaSecret'").get()
  )
    db.prepare('INSERT INTO server_config VALUES(?,?)').run(
      'mediaSecret',
      randomBytes(32).toString('hex'),
    );
  const secret =
    options.mediaSecret ||
    String(db.prepare("SELECT value FROM server_config WHERE key='mediaSecret'").get()!.value);
  const origins = options.origins || [
    'http://localhost:5173',
    'https://localhost',
    'capacitor://localhost',
  ];
  const origin = (
    value: string | undefined,
    callback: (err: Error | null, allowed?: boolean) => void,
  ) => callback(null, !value || origins.includes(value));
  const app = express();
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
          mediaSrc: ["'self'", 'blob:', 'https:'],
          connectSrc: ["'self'", 'https:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors({ origin }));
  app.use(express.json({ limit: '32kb' }));
  const http = createServer(app);
  const io = new Server(http, { cors: { origin }, maxHttpBufferSize: 16_384 });
  const lookup = (token: string): { user: User; hash: string; expires: number } | null => {
    const hash = hashToken(token);
    const session = db
      .prepare('SELECT * FROM sessions WHERE hash=? AND expires>?')
      .get(hash, Date.now()) as { userId: string; expires: number } | undefined;
    const user = session
      ? (db.prepare('SELECT * FROM users WHERE id=?').get(session.userId) as User)
      : undefined;
    return user && session ? { user, hash, expires: session.expires } : null;
  };
  const authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const found = lookup(req.headers.authorization?.replace(/^Bearer /, '') || '');
    if (!found) return next(new HttpError(401, '登录已过期，请重新登录'));
    Object.assign(req, { user: found.user, sessionHash: found.hash });
    next();
  };
  const couple = (req: AuthRequest) => req.user.coupleId || fail(409, '请先与另一半配对');
  const partner = (user: User) =>
    user.coupleId
      ? (db
          .prepare('SELECT * FROM users WHERE coupleId=? AND id<>?')
          .get(user.coupleId, user.id) as User | undefined)
      : undefined;
  const mediaView = (id: string | null) => {
    if (!id) return null;
    const row = db.prepare('SELECT id,kind,width,height,duration FROM media WHERE id=?').get(id);
    if (!row) return null;
    const expires = Date.now() + 3_600_000;
    const url = (variant: string) =>
      `/api/media/${id}/${variant}?expires=${expires}&signature=${signMedia(secret, id, variant, expires)}`;
    return { ...row, thumbnailUrl: url('thumbnail'), previewUrl: url('preview') };
  };
  const messageView = (row: Record<string, unknown>) => ({
    ...row,
    media: mediaView(row.mediaId as string | null),
  });
  const publicUser = (user: User) => ({
    ...safeUser(user),
    avatar: mediaView((user as User & { avatarMediaId?: string }).avatarMediaId || null),
  });
  const profile = (user: User) => ({
    user: publicUser(user),
    partner: partner(user) ? publicUser(partner(user)!) : null,
    couple: user.coupleId
      ? db.prepare('SELECT * FROM couples WHERE id=?').get(user.coupleId)
      : null,
  });
  const ownedMedia = (id: string | undefined, req: AuthRequest) => {
    if (
      id &&
      !db
        .prepare('SELECT id FROM media WHERE id=? AND coupleId=? AND ownerId=?')
        .get(id, couple(req), req.user.id)
    )
      fail(403, '不能使用此媒体');
  };
  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', version: '2.0.0', pushConfigured: Boolean(options.pushSender) }),
  );
  const loginLimit = rateLimit({
    windowMs: 900_000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: '尝试过于频繁，请稍后重试' },
  });
  for (const mode of ['register', 'login'])
    app.post(`/api/auth/${mode}`, loginLimit, async (req, res) => {
      const value = credentials.parse(req.body);
      let user = db.prepare('SELECT * FROM users WHERE username=?').get(value.username) as
        User | undefined;
      if (mode === 'register') {
        if (user) fail(409, '此用户名已存在');
        const password = await hashPassword(value.password);
        user = {
          id: randomUUID(),
          username: value.username,
          name: value.name || value.username,
          password,
          coupleId: null,
        };
        try {
          db.prepare('INSERT INTO users(id,username,name,password) VALUES(?,?,?,?)').run(
            user.id,
            user.username,
            user.name,
            password,
          );
        } catch {
          fail(409, '此用户名已存在');
        }
      } else if (!user || !(await verifyPassword(value.password, user.password)))
        fail(401, '用户名或密码错误');
      const token = newToken();
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
        hashToken(token),
        user!.id,
        Date.now() + 30 * 86400_000,
      );
      res.status(mode === 'register' ? 201 : 200).json({ token, ...profile(user!) });
    });
  app.get('/api/media/:id/:variant', (req, res) => {
    const { id, variant } = req.params;
    const expires = Number(req.query.expires),
      signature = String(req.query.signature || '');
    if (
      !['thumbnail', 'preview'].includes(variant) ||
      !Number.isSafeInteger(expires) ||
      expires <= Date.now() ||
      expires > Date.now() + 3_600_000 ||
      !validSignature(signature, signMedia(secret, id, variant, expires))
    )
      fail(403, '媒体链接已过期');
    const row = db.prepare('SELECT * FROM media WHERE id=?').get(id) as
      Record<string, string> | undefined;
    if (!row) fail(404, '媒体不存在');
    res
      .set('Cache-Control', 'private, max-age=300')
      .type(variant === 'thumbnail' || row!.kind === 'image' ? 'image/webp' : 'video/mp4');
    res.sendFile(join(uploads, row![variant]));
  });
  app.use(
    '/api',
    authenticate,
    rateLimit({
      windowMs: 60_000,
      limit: 240,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: '请求过于频繁' },
    }),
  );
  const route = (
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    handler: (req: AuthRequest, res: Response) => unknown,
  ) => app[method](path, (req, res) => handler(req as AuthRequest, res));
  route('get', '/api/me', (req, res) => res.json(profile(req.user)));
  route('patch', '/api/me', (req, res) => {
    executeTool(db, req.user.id, 'update_profile', req.body);
    io.to(`user:${req.user.id}`).emit('profile:changed');
    if (req.user.coupleId) io.to(`couple:${req.user.coupleId}`).emit('profile:changed');
    res.json(profile(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id) as User));
  });
  route('post', '/api/auth/logout', (req, res) => {
    const { deviceToken } = z.object({ deviceToken: z.string().optional() }).parse(req.body);
    transaction(db, () => {
      db.prepare('DELETE FROM sessions WHERE hash=?').run(req.sessionHash);
      if (deviceToken)
        db.prepare('DELETE FROM devices WHERE token=? AND userId=?').run(deviceToken, req.user.id);
    });
    io.in(`session:${req.sessionHash}`).disconnectSockets(true);
    res.sendStatus(204);
  });
  route('post', '/api/pairing/invite', (req, res) => {
    if (req.user.coupleId) fail(409, '你已经配对');
    const code = randomBytes(6).toString('hex').toUpperCase();
    db.prepare('DELETE FROM invites WHERE userId=?').run(req.user.id);
    db.prepare('INSERT INTO invites VALUES(?,?,?)').run(
      hashToken(code),
      req.user.id,
      Date.now() + 600_000,
    );
    res.json({ code, expiresAt: Date.now() + 600_000 });
  });
  route('post', '/api/pairing/join', (req, res) => {
    const { code } = z.object({ code: text.toUpperCase().regex(/^[0-9A-F]{12}$/) }).parse(req.body);
    const owner = transaction(db, () => {
      const invite = db
        .prepare('SELECT * FROM invites WHERE hash=? AND expires>?')
        .get(hashToken(code), Date.now()) as { userId: string } | undefined;
      if (!invite || invite.userId === req.user.id) fail(400, '邀请码无效或已过期');
      const from = db.prepare('SELECT * FROM users WHERE id=?').get(invite!.userId) as User;
      const current = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id) as User;
      if (from.coupleId || current.coupleId) fail(409, '其中一人已经配对');
      const id = randomUUID();
      db.prepare('INSERT INTO couples(id) VALUES(?)').run(id);
      db.prepare('UPDATE users SET coupleId=? WHERE id IN (?,?)').run(id, from.id, req.user.id);
      db.prepare('DELETE FROM invites WHERE userId IN (?,?)').run(from.id, req.user.id);
      return from.id;
    });
    for (const userId of [owner, req.user.id]) {
      const updated = db.prepare('SELECT * FROM users WHERE id=?').get(userId) as User;
      io.in(`user:${userId}`).socketsJoin(`couple:${updated.coupleId}`);
      io.to(`user:${userId}`).emit('profile:changed');
    }
    res.json(profile(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id) as User));
  });
  route('delete', '/api/pairing', (req, res) => {
    const id = couple(req);
    db.prepare('UPDATE users SET coupleId=NULL WHERE coupleId=?').run(id);
    io.to(`couple:${id}`).emit('profile:changed');
    io.in(`couple:${id}`).socketsLeave(`couple:${id}`);
    res.sendStatus(204);
  });
  route('patch', '/api/couple', (req, res) => {
    const { startDate } = z.object({ startDate: date }).parse(req.body);
    db.prepare('UPDATE couples SET startDate=? WHERE id=?').run(startDate, couple(req));
    io.to(`couple:${req.user.coupleId}`).emit('profile:changed');
    res.json({ startDate });
  });
  route('get', '/api/messages', (req, res) => {
    const before =
      req.query.before === undefined
        ? Number.MAX_SAFE_INTEGER
        : z.coerce.number().int().positive().parse(req.query.before);
    const rows = db
      .prepare('SELECT * FROM messages WHERE coupleId=? AND id<? ORDER BY id DESC LIMIT 50')
      .all(couple(req), before);
    res.json({ items: rows.reverse().map(messageView), hasMore: rows.length === 50 });
  });
  route('post', '/api/messages', (req, res) => {
    const value = z
      .object({
        clientId: z.string().uuid(),
        content: text.max(4000).default(''),
        mediaId: z.string().uuid().optional(),
      })
      .refine((v) => v.content || v.mediaId, '消息不能为空')
      .parse(req.body);
    const coupleId = couple(req);
    ownedMedia(value.mediaId, req);
    const existing = db
      .prepare('SELECT * FROM messages WHERE senderId=? AND clientId=?')
      .get(req.user.id, value.clientId);
    if (existing) {
      if (existing.coupleId !== coupleId) fail(409, '消息编号冲突');
      return res.json(messageView(existing));
    }
    const recipient = partner(req.user) || fail(409, '另一半已解除配对');
    const row = transaction(db, () => {
      const result = db
        .prepare(
          'INSERT INTO messages(coupleId,senderId,clientId,content,mediaId,createdAt) VALUES(?,?,?,?,?,?)',
        )
        .run(
          coupleId,
          req.user.id,
          value.clientId,
          value.content,
          value.mediaId || null,
          new Date().toISOString(),
        );
      const id = Number(result.lastInsertRowid);
      db.prepare('INSERT INTO push_jobs(messageId,recipientId,nextAt) VALUES(?,?,?)').run(
        id,
        recipient.id,
        Date.now(),
      );
      if (/(^|\s)@ai(?:\s|$)/i.test(value.content))
        db.prepare('INSERT INTO ai_jobs(messageId,userId) VALUES(?,?)').run(id, req.user.id);
      return db.prepare('SELECT * FROM messages WHERE id=?').get(id)!;
    });
    const result = messageView(row);
    io.to(`couple:${coupleId}`).emit('message:new', result);
    res.status(201).json(result);
  });
  route('post', '/api/messages/read', (req, res) => {
    const { throughId } = z.object({ throughId: z.number().int().positive() }).parse(req.body);
    const coupleId = couple(req),
      readAt = new Date().toISOString();
    db.prepare(
      'UPDATE messages SET readAt=? WHERE coupleId=? AND senderId<>? AND id<=? AND readAt IS NULL',
    ).run(readAt, coupleId, req.user.id, throughId);
    io.to(`couple:${coupleId}`).emit('message:read', { throughId, readerId: req.user.id, readAt });
    res.sendStatus(204);
  });
  let processing = 0;
  const upload = multer({
    dest: join(uploads, 'tmp'),
    limits: { fileSize: 100 * 1024 * 1024, files: 1, fields: 0 },
    fileFilter: (_req, file, cb) =>
      cb(
        null,
        /^(image\/(jpeg|png|webp|avif|heic|heif)|video\/(mp4|quicktime|webm|3gpp|x-matroska))$/.test(
          file.mimetype,
        ),
      ),
  });
  app.post(
    '/api/media',
    (req, _res, next) => {
      try {
        if (processing >= 2) fail(429, '正在处理其他媒体，请稍后重试');
        processing++;
        next();
      } catch (error) {
        next(error);
      }
    },
    (req, res, next) =>
      upload.single('file')(req, res, async (error) => {
        try {
          if (error) throw error;
          if (!req.file) fail(400, '请选择支持的图片或视频');
          const media = await processMedia(req.file!.path, req.file!.mimetype, uploads);
          const user = db
            .prepare('SELECT * FROM users WHERE id=?')
            .get((req as AuthRequest).user.id) as User;
          if (user.coupleId !== (req as AuthRequest).user.coupleId) fail(409, '配对关系已改变');
          db.prepare('INSERT INTO media VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(
            media.id,
            user.coupleId!,
            user.id,
            media.kind,
            media.original,
            media.preview,
            media.thumbnail,
            media.width || null,
            media.height || null,
            media.duration,
            new Date().toISOString(),
          );
          res.status(201).json(mediaView(media.id));
        } catch (err) {
          next(
            err instanceof HttpError || err instanceof multer.MulterError
              ? err
              : new HttpError(422, '媒体无法处理，请确认格式、文件大小和视频时长'),
          );
        } finally {
          processing--;
        }
      }),
  );
  route('get', '/api/moments', (req, res) => {
    const rows = db
      .prepare('SELECT * FROM moments WHERE coupleId=? ORDER BY date DESC LIMIT 200')
      .all(couple(req));
    res.json(rows.map((row) => ({ ...row, media: mediaView(row.mediaId as string) })));
  });
  route('post', '/api/moments', (req, res) => {
    const value = z
      .object({ title: text.max(300).default(''), mediaId: z.string().uuid(), date })
      .parse(req.body);
    const coupleId = couple(req);
    ownedMedia(value.mediaId, req);
    const id = randomUUID();
    db.prepare('INSERT INTO moments VALUES(?,?,?,?,?,?)').run(
      id,
      coupleId,
      req.user.id,
      value.title,
      value.mediaId,
      value.date,
    );
    io.to(`couple:${coupleId}`).emit('moments:changed');
    res.status(201).json({ id });
  });
  route('patch', '/api/moments/:id', (req, res) => {
    const value = z.object({ title: text.max(300), date }).parse(req.body);
    const result = db
      .prepare('UPDATE moments SET title=?,date=? WHERE id=? AND coupleId=? AND ownerId=?')
      .run(value.title, value.date, String(req.params.id), couple(req), req.user.id);
    if (!result.changes) fail(404, '回忆不存在或不是你发布的');
    io.to(`couple:${req.user.coupleId}`).emit('moments:changed');
    res.sendStatus(204);
  });
  route('delete', '/api/moments/:id', (req, res) => {
    const result = db
      .prepare('DELETE FROM moments WHERE id=? AND coupleId=? AND ownerId=?')
      .run(String(req.params.id), couple(req), req.user.id);
    if (!result.changes) fail(404, '回忆不存在或不是你发布的');
    io.to(`couple:${req.user.coupleId}`).emit('moments:changed');
    res.sendStatus(204);
  });
  route('get', '/api/anniversaries', (req, res) =>
    res.json(
      db.prepare('SELECT * FROM anniversaries WHERE coupleId=? ORDER BY date').all(couple(req)),
    ),
  );
  route('post', '/api/anniversaries', (req, res) => {
    const value = z
      .object({ title: text.min(1).max(80), date, yearly: z.boolean().default(true) })
      .parse(req.body);
    const id = randomUUID(),
      coupleId = couple(req);
    db.prepare('INSERT INTO anniversaries VALUES(?,?,?,?,?)').run(
      id,
      coupleId,
      value.title,
      value.date,
      Number(value.yearly),
    );
    io.to(`couple:${coupleId}`).emit('anniversaries:changed');
    res.status(201).json({ id });
  });
  route('patch', '/api/anniversaries/:id', (req, res) => {
    executeTool(db, req.user.id, 'update_anniversary', { ...req.body, id: String(req.params.id) });
    io.to(`couple:${req.user.coupleId}`).emit('anniversaries:changed');
    res.sendStatus(204);
  });
  route('get', '/api/ai/settings', (req, res) => {
    const row = db
      .prepare('SELECT baseUrl,model,enabled,secret FROM ai_settings WHERE userId=?')
      .get(req.user.id);
    res.json(
      row
        ? {
            baseUrl: row.baseUrl,
            model: row.model,
            enabled: Boolean(row.enabled),
            hasKey: Boolean(row.secret),
          }
        : { baseUrl: '', model: '', enabled: false, hasKey: false },
    );
  });
  route('post', '/api/ai/settings', (req, res) => {
    const value = aiConfigSchema.parse(req.body);
    let baseUrl: string;
    try {
      baseUrl = validateAIUrl(value.baseUrl);
    } catch (err) {
      return fail(400, (err as Error).message);
    }
    const old = db
      .prepare('SELECT secret,baseUrl FROM ai_settings WHERE userId=?')
      .get(req.user.id) as { secret: string; baseUrl: string } | undefined;
    const encrypted =
      value.apiKey !== undefined
        ? encryptKey(value.apiKey, secret)
        : old?.baseUrl === baseUrl
          ? old.secret
          : encryptKey('', secret);
    db.prepare(
      'INSERT INTO ai_settings VALUES(?,?,?,?,?) ON CONFLICT(userId) DO UPDATE SET baseUrl=excluded.baseUrl,model=excluded.model,secret=excluded.secret,enabled=excluded.enabled',
    ).run(req.user.id, baseUrl, value.model, encrypted, Number(value.enabled));
    res.sendStatus(204);
  });
  route('get', '/api/ai/tools', (_req, res) =>
    res.json({
      tools: aiTools,
      mediaUpload: {
        method: 'POST',
        path: '/api/media',
        encoding: 'multipart/form-data',
        field: 'file',
      },
    }),
  );
  route('post', '/api/ai/tools/:name', (req, res) => {
    const result = executeTool(db, req.user.id, String(req.params.name), req.body);
    io.to(`couple:${req.user.coupleId}`).emit('profile:changed');
    io.to(`couple:${req.user.coupleId}`).emit('moments:changed');
    io.to(`couple:${req.user.coupleId}`).emit('anniversaries:changed');
    res.json(result);
  });
  route('delete', '/api/anniversaries/:id', (req, res) => {
    const result = db
      .prepare('DELETE FROM anniversaries WHERE id=? AND coupleId=?')
      .run(String(req.params.id), couple(req));
    if (!result.changes) fail(404, '纪念日不存在');
    io.to(`couple:${req.user.coupleId}`).emit('anniversaries:changed');
    res.sendStatus(204);
  });
  route('post', '/api/devices', (req, res) => {
    const { token } = z.object({ token: z.string().min(20).max(4096) }).parse(req.body);
    db.prepare(
      'INSERT INTO devices VALUES(?,?,?) ON CONFLICT(token) DO UPDATE SET userId=excluded.userId,updatedAt=excluded.updatedAt',
    ).run(token, req.user.id, Date.now());
    res.sendStatus(204);
  });
  route('delete', '/api/devices', (req, res) => {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    db.prepare('DELETE FROM devices WHERE token=? AND userId=?').run(token, req.user.id);
    res.sendStatus(204);
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: '接口不存在' }));
  if (options.staticDir) {
    app.use(express.static(resolve(options.staticDir)));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve(options.staticDir!, 'index.html')));
  }
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: '输入不符合要求', details: error.issues.map((issue) => issue.message) });
    if (error instanceof multer.MulterError)
      return res.status(413).json({ error: '文件超出限制，最大 100 MB' });
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    console.error(error);
    res.status(500).json({ error: '服务暂时不可用' });
  });
  io.use((socket, next) => {
    const found = lookup(String(socket.handshake.auth.token || ''));
    if (!found) return next(new Error('登录已过期'));
    socket.data = { userId: found.user.id, hash: found.hash, expires: found.expires };
    next();
  });
  io.on('connection', (socket) => {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(socket.data.userId) as User;
    socket.join(`user:${user.id}`);
    socket.join(`session:${socket.data.hash}`);
    if (user.coupleId) socket.join(`couple:${user.coupleId}`);
    const expiryTimer = setTimeout(
      () => socket.disconnect(true),
      Math.min(socket.data.expires - Date.now(), 2_147_483_647),
    );
    let lastTyping = 0;
    socket.use((_packet, next) => {
      lookupByHash(socket.data.hash) ? next() : socket.disconnect(true);
    });
    function lookupByHash(hash: string) {
      return db
        .prepare('SELECT hash FROM sessions WHERE hash=? AND expires>?')
        .get(hash, Date.now());
    }
    socket.on('typing', () => {
      if (Date.now() - lastTyping < 1500) return;
      lastTyping = Date.now();
      const current = db.prepare('SELECT * FROM users WHERE id=?').get(user.id) as User;
      if (current.coupleId)
        socket.to(`couple:${current.coupleId}`).emit('typing', { userId: user.id });
    });
    socket.on('disconnect', () => clearTimeout(expiryTimer));
  });
  const tick = pushWorker(db, options.pushSender);
  const runAI = aiWorker({
    db,
    secret,
    notify: (id, row) => io.to(`couple:${id}`).emit('message:new', messageView(row)),
    changed: (id, userId) => {
      io.to(`user:${userId}`).emit('profile:changed');
      for (const event of ['profile:changed', 'moments:changed', 'anniversaries:changed'])
        io.to(`couple:${id}`).emit(event);
    },
  });
  const timer = setInterval(() => {
    void tick();
    void runAI();
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    db.prepare('DELETE FROM invites WHERE expires<?').run(Date.now());
  }, 5000);
  timer.unref();
  return {
    app,
    http,
    io,
    db,
    tick,
    runAI,
    close: async () => {
      clearInterval(timer);
      await new Promise<void>((resolve) => io.close(() => resolve()));
      db.close();
    },
  };
}
