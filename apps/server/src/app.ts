import { presence } from './presence.js';
import { today } from '@love/calendar';
import { readAlbum } from './album.js';
import { installAlbumTransfers } from './album-transfer.js';
import {
  anniversarySchema,
  todoSchema,
  relationshipSchema,
  aiProfileSchema,
  mentionsAI,
} from './schedules.js';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { createServer } from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createControl, type ControlOptions } from './control.js';
import { HttpError, fail } from './errors.js';
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
import { publishMediaDraft } from './media-drafts.js';
import { mediaReferences } from './media-cleanup.js';
import { processMedia } from './media.js';
import { syncMediaFiles, commitMedia, removeMediaFiles } from './media-storage.js';
import { CommitUncertainError } from './postgres.js';
import { MediaRepository } from './media-repository.js';
import { pipeline } from 'node:stream/promises';
import { notificationStreams } from './notifications.js';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import {
  aiConfigSchema,
  validateAIUrl,
  encryptKey,
  decryptKey,
  aiWorker,
  executeTool,
  tools as aiTools,
} from './ai.js';

type AuthRequest = Request & { user: User; sessionHash: string };
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
  email: user.email,
});
export type AppOptions = ControlOptions & {
  database?: string;
  databaseProvider?: 'sqlite' | 'postgres';
  databaseSchema?: string;
  uploads?: string;
  mediaSecret?: string;
  origins?: string[];
  production?: boolean;
  staticDir?: string;
};
export async function createApp(options: AppOptions = {}) {
  const db = await openDatabase({
    path: options.database || 'data/love.sqlite',
    provider: options.databaseProvider,
    schema: options.databaseSchema,
  });
  const uploads = resolve(options.uploads || 'data/media');
  mkdirSync(join(uploads, 'tmp'), { recursive: true });
  const mediaRepository = new MediaRepository(db, uploads);
  try {
    await mediaRepository.migrate();
  } catch (error) {
    await db.close();
    throw error;
  }
  await db.exec(
    'CREATE TABLE IF NOT EXISTS server_config(key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  );
  if (
    !options.mediaSecret &&
    !(await db.prepare("SELECT value FROM server_config WHERE key='mediaSecret'").get())
  )
    await db
      .prepare('INSERT INTO server_config VALUES(?,?)')
      .run('mediaSecret', randomBytes(32).toString('hex'));
  const secret =
    options.mediaSecret ||
    String(
      (await db.prepare("SELECT value FROM server_config WHERE key='mediaSecret'").get())!.value,
    );
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
  const http = createServer(app);
  http.requestTimeout = 0; // Large uploads have no fixed transfer deadline.
  const io = new Server(http, { cors: { origin }, maxHttpBufferSize: 16_384 });
  const control = await createControl(
    db,
    secret,
    { ...options, notificationConnections: () => streams.count() },
    (id) => {
      streams.closeUser(id);
      io.in(`user:${id}`).disconnectSockets(true);
    },
  );
  app.use(control.access);
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  // Public HTTP deployments must not upgrade assets to a TLS port that does not exist.
  // req.secure also handles HTTPS behind the explicitly configured trusted proxy.
  const securityHeaders = (secure: boolean) =>
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'blob:', 'data:', 'https:', ...(!secure ? ['http:'] : [])],
          mediaSrc: ["'self'", 'blob:', 'https:', ...(!secure ? ['http:'] : [])],
          connectSrc: secure
            ? ["'self'", 'https:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*']
            : ["'self'", 'https:', 'wss:', 'http:', 'ws:'],
          upgradeInsecureRequests: secure ? [] : null,
        },
      },
      crossOriginOpenerPolicy: secure,
      originAgentCluster: secure,
      strictTransportSecurity: secure,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    });
  const httpsHeaders = securityHeaders(true),
    httpHeaders = securityHeaders(false);
  app.use((req, res, next) => (req.secure ? httpsHeaders : httpHeaders)(req, res, next));
  app.use(cors({ origin }));
  app.use(express.json({ limit: '32kb' }));
  const lookup = async (
    token: string,
  ): Promise<{ user: User; hash: string; expires: number } | null> => {
    const hash = hashToken(token);
    const session = (await db
      .prepare('SELECT * FROM sessions WHERE hash=? AND expires>?')
      .get(hash, Date.now())) as { userId: string; expires: number } | undefined;
    const user = session
      ? ((await db.prepare('SELECT * FROM users WHERE id=?').get(session.userId)) as User)
      : undefined;
    return user && !user.disabled && user.verifiedAt && session
      ? { user, hash, expires: session.expires }
      : null;
  };
  const streams = notificationStreams(db, lookup);
  const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    const found = await lookup(req.headers.authorization?.replace(/^Bearer /, '') || '');
    if (!found) return next(new HttpError(401, '登录已过期，请重新登录'));
    Object.assign(req, { user: found.user, sessionHash: found.hash });
    next();
  };
  const couple = async (req: AuthRequest) => {
    const id = req.user.coupleId;
    if (
      !id ||
      Number((await db.prepare('SELECT COUNT(*) n FROM users WHERE coupleId=?').get(id))!.n) !== 2
    )
      fail(409, '请先与另一半配对');
    return id!;
  };
  const partner = async (user: User) =>
    user.coupleId
      ? ((await db
          .prepare('SELECT * FROM users WHERE coupleId=? AND id<>?')
          .get(user.coupleId, user.id)) as User | undefined)
      : undefined;
  const mediaView = async (id: string | null) => {
    if (!id) return null;
    let row = await db
      .prepare('SELECT id,kind,width,height,duration FROM media WHERE id=?')
      .get(id);
    if (!row) {
      const upload = await db.prepare('SELECT metadata FROM media_uploads WHERE id=?').get(id);
      if (upload) {
        const draft = JSON.parse(String(upload.metadata));
        row = {
          id,
          kind: draft.kind,
          width: draft.width,
          height: draft.height,
          duration: draft.duration,
        };
      }
    }
    if (!row) return null;
    const expires = Date.now() + 3_600_000;
    const url = (variant: string) =>
      `/api/media/${id}/${variant}?expires=${expires}&signature=${signMedia(secret, id, variant, expires)}`;
    return { ...row, thumbnailUrl: url('thumbnail'), previewUrl: url('preview') };
  };
  const messageView = async (row: Record<string, unknown>) => ({
    ...row,
    attachments: await Promise.all(
      (
        await db
          .prepare('SELECT mediaId FROM message_media WHERE messageId=? ORDER BY position')
          .all(row.id)
      ).map((item) => mediaView(String(item.mediaId))),
    ),
    assistant:
      row.role === 'assistant'
        ? {
            name: row.assistantName || '小爱',
            avatar: await mediaView(row.assistantAvatarMediaId as string | null),
          }
        : null,
  });
  const publicUser = async (user: User) => ({
    ...safeUser(user),
    avatar: await mediaView((user as User & { avatarMediaId?: string }).avatarMediaId || null),
  });
  const aiIdentity = async (user: User) => {
    const row = await db
      .prepare('SELECT name,avatarMediaId,enabled FROM couple_ai_settings WHERE coupleId=?')
      .get(user.coupleId);
    const avatarId =
      row?.avatarMediaId &&
      (await db
        .prepare('SELECT id FROM media WHERE id=? AND coupleId=?')
        .get(row.avatarMediaId, user.coupleId))
        ? String(row.avatarMediaId)
        : null;
    return {
      name: row?.name || '小爱',
      avatar: await mediaView(avatarId),
      enabled: Boolean(row?.enabled),
    };
  };
  const retainOriginal = async (coupleId: string) => {
    const settings = await db
      .prepare('SELECT retainOriginal FROM couple_media_settings WHERE coupleId=?')
      .get(coupleId);
    return settings ? Boolean(Number(settings.retainOriginal)) : true;
  };
  const profile = async (user: User) => {
    const counterpart = await partner(user);
    return {
      ai: user.coupleId ? await aiIdentity(user) : { name: '', avatar: null, enabled: false },
      user: await publicUser(user),
      partner: counterpart ? await publicUser(counterpart) : null,
      couple: user.coupleId
        ? {
            ...(await db.prepare('SELECT * FROM couples WHERE id=?').get(user.coupleId)),
            storageBytes: await control.usage(user.coupleId),
            quotaBytes: await control.quota(user.coupleId),
            retainOriginal: await retainOriginal(user.coupleId),
          }
        : null,
    };
  };
  const ownedMedia = async (id: string | undefined, req: AuthRequest) => {
    if (
      id &&
      !(await db
        .prepare(
          'SELECT id FROM media WHERE id=? AND coupleId=? AND ownerId=? UNION SELECT id FROM media_uploads WHERE id=? AND coupleId=? AND ownerId=?',
        )
        .get(id, await couple(req), req.user.id, id, await couple(req), req.user.id))
    )
      fail(403, '不能使用此媒体');
  };
  app.get('/api/health', (_req, res) =>
    res.json({
      status: 'ok',
      version: '2.9.0',
      notifications: 'local',
      database: db.provider,
    }),
  );
  const loginLimit = rateLimit({
    windowMs: 900_000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: '尝试过于频繁，请稍后重试' },
  });
  control.installPublic(app);
  control.installAdmin(app);
  for (const mode of ['register', 'login'])
    app.post(`/api/auth/${mode}`, loginLimit, async (req, res) => {
      const signup = mode === 'register';
      const value = signup
        ? credentials
            .extend({
              email: z.string().trim().toLowerCase().email().max(254),
              verificationId: z.string().uuid(),
              code: z.string().regex(/^\d{6}$/),
              invitationCode: z.string().trim().max(100).optional(),
            })
            .parse(req.body)
        : z
            .object({
              username: text.toLowerCase().min(3).max(254),
              password: z.string().min(1).max(128),
            })
            .parse(req.body);
      if (!signup) await control.consumeCaptcha(req, 'login');
      let user = (await db
        .prepare('SELECT * FROM users WHERE username=? OR email=?')
        .get(value.username, value.username)) as User | undefined;
      if (signup) {
        const registration = value as z.infer<typeof credentials> & {
          email: string;
          verificationId: string;
          code: string;
          invitationCode?: string;
        };
        await control.registeredEmailAllowed(registration.email);
        await control.checkInvitation(registration.invitationCode);
        if (user) fail(409, '此用户名已存在');
        const password = await hashPassword(value.password),
          id = randomUUID();
        await control.registeredEmailAllowed(registration.email);
        await control.consumeEmail(
          registration.email,
          'register',
          registration.verificationId,
          registration.code,
          async () => {
            await control.registeredEmailAllowed(registration.email);
            await control.consumeInvitation(registration.invitationCode);
            try {
              await db
                .prepare(
                  'INSERT INTO users(id,username,name,password,email,verifiedAt) VALUES(?,?,?,?,?,?)',
                )
                .run(
                  id,
                  value.username,
                  registration.name || value.username,
                  password,
                  registration.email,
                  new Date().toISOString(),
                );
            } catch {
              fail(409, '用户名或邮箱已存在');
            }
          },
        );
        user = (await db.prepare('SELECT * FROM users WHERE id=?').get(id)) as User;
        await control.log('info', 'account.registered', { userId: id });
      } else {
        if (!user || !(await verifyPassword(value.password, user.password))) {
          await control.log('warn', 'account.login.failed');
          fail(401, '用户名或密码错误');
        }
        const current = (await db.prepare('SELECT * FROM users WHERE id=?').get(user!.id)) as User;
        if (current.password !== user!.password) fail(401, '用户名或密码错误');
        if (current.disabled) fail(403, '此账号已停用，请联系管理员');
        if (!current.verifiedAt) fail(403, '请先完成邮箱验证');
        user = current;
      }
      const token = newToken();
      await db
        .prepare('INSERT INTO sessions VALUES(?,?,?)')
        .run(hashToken(token), user!.id, Date.now() + 30 * 86400_000);
      await db
        .prepare('UPDATE users SET lastLoginAt=? WHERE id=?')
        .run(new Date().toISOString(), user!.id);
      await control.log('info', 'account.login', { userId: user!.id });
      res.status(signup ? 201 : 200).json({ token, ...(await profile(user!)) });
    });
  app.get('/api/media/:id/:variant', async (req, res) => {
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
    let row = (await db.prepare('SELECT * FROM media WHERE id=?').get(id)) as
      Record<string, string> | undefined;
    let draft = false;
    if (!row) {
      const upload = await db.prepare('SELECT metadata FROM media_uploads WHERE id=?').get(id);
      if (upload) {
        row = JSON.parse(String(upload.metadata));
        draft = true;
      }
    }
    if (!row) fail(404, '媒体不存在');
    res
      .set('Cache-Control', 'private, max-age=300')
      .type(variant === 'thumbnail' || row!.kind === 'image' ? 'image/webp' : 'video/mp4');
    if (db.provider === 'sqlite') return res.sendFile(join(uploads, row![variant]));
    const name = row![variant],
      { bytes } = await mediaRepository.info(name, draft);
    res.set('Accept-Ranges', 'bytes');
    const ranges = req.range(bytes);
    if (ranges === -1) {
      res.set('Content-Range', `bytes */${bytes}`).status(416).end();
      return;
    }
    const range =
      Array.isArray(ranges) && ranges.type === 'bytes' && ranges.length === 1
        ? ranges[0]
        : undefined;
    const start = range?.start ?? 0,
      end = range?.end ?? bytes - 1;
    if (range) res.status(206).set('Content-Range', `bytes ${start}-${end}/${bytes}`);
    res.set('Content-Length', String(end - start + 1));
    if (req.method === 'HEAD') return res.end();
    try {
      await pipeline(mediaRepository.stream(name, start, end, draft), res);
    } catch (error) {
      if (!res.headersSent) throw error;
      res.destroy(error as Error);
    }
  });
  installAlbumTransfers({
    app,
    db,
    uploads,
    mediaRepository,
    secret,
    authenticate,
    control,
    changed: (id) => {
      io.to(`couple:${id}`).emit('moments:changed');
      io.to(`couple:${id}`).emit('profile:changed');
    },
  });
  app.use(
    '/api',
    authenticate,
    rateLimit({
      windowMs: 60_000,
      limit: 240,
      // Authentication already resolved the user. Shared networks must not
      // consume one combined allowance for every account behind the same IP.
      keyGenerator: (req) => (req as AuthRequest).user.id,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: '请求过于频繁' },
    }),
  );
  app.use('/api', async (req, _res, next) => {
    const personal = ['/me', '/me/avatar', '/auth/logout', '/pairing/invite', '/pairing/join'];
    if (!personal.includes(req.path)) {
      try {
        await couple(req as AuthRequest);
      } catch (error) {
        return next(error);
      }
    }
    next();
  });
  const route = (
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    handler: (req: AuthRequest, res: Response) => unknown,
  ) => app[method](path, (req, res) => handler(req as AuthRequest, res));
  route('get', '/api/me', async (req, res) => res.json(await profile(req.user)));
  route('patch', '/api/me', async (req, res) => {
    await executeTool(db, req.user.id, 'update_profile', req.body);
    io.to(`user:${req.user.id}`).emit('profile:changed');
    if (req.user.coupleId) io.to(`couple:${req.user.coupleId}`).emit('profile:changed');
    res.json(
      await profile((await db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) as User),
    );
  });
  route('post', '/api/auth/logout', async (req, res) => {
    await db.prepare('DELETE FROM sessions WHERE hash=?').run(req.sessionHash);
    streams.closeSession(req.sessionHash);
    io.in(`session:${req.sessionHash}`).disconnectSockets(true);
    res.sendStatus(204);
  });
  route('post', '/api/pairing/invite', async (req, res) => {
    if (req.user.coupleId) fail(409, '你已经配对');
    const code = randomBytes(6).toString('hex').toUpperCase();
    await db.prepare('DELETE FROM invites WHERE userId=?').run(req.user.id);
    await db
      .prepare('INSERT INTO invites VALUES(?,?,?)')
      .run(hashToken(code), req.user.id, Date.now() + 600_000);
    res.json({ code, expiresAt: Date.now() + 600_000 });
  });
  const broadcastPresence = presence(io, db);
  route('post', '/api/pairing/join', async (req, res) => {
    const { code } = z.object({ code: text.toUpperCase().regex(/^[0-9A-F]{12}$/) }).parse(req.body);
    const owner = await transaction(db, async () => {
      const invite = (await db
        .prepare('SELECT * FROM invites WHERE hash=? AND expires>?')
        .get(hashToken(code), Date.now())) as { userId: string } | undefined;
      if (!invite || invite.userId === req.user.id) fail(400, '邀请码无效或已过期');
      const from = (await db.prepare('SELECT * FROM users WHERE id=?').get(invite!.userId)) as User;
      const current = (await db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) as User;
      if (from.coupleId || current.coupleId) fail(409, '其中一人已经配对');
      const id = randomUUID();
      await db.prepare('INSERT INTO couples(id) VALUES(?)').run(id);
      await db
        .prepare('INSERT INTO couple_limits VALUES(?,?)')
        .run(id, (await control.readSettings()).defaultQuotaMiB);
      await db
        .prepare('UPDATE users SET coupleId=? WHERE id IN (?,?)')
        .run(id, from.id, req.user.id);
      await db.prepare('DELETE FROM invites WHERE userId IN (?,?)').run(from.id, req.user.id);
      return from.id;
    });
    for (const userId of [owner, req.user.id]) {
      const updated = (await db.prepare('SELECT * FROM users WHERE id=?').get(userId)) as User;
      io.in(`user:${userId}`).socketsJoin(`couple:${updated.coupleId}`);
      io.to(`user:${userId}`).emit('profile:changed');
    }
    await broadcastPresence(
      (await db.prepare('SELECT coupleId FROM users WHERE id=?').get(req.user.id))!
        .coupleId as string,
    );
    res.json(
      await profile((await db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) as User),
    );
  });
  route('delete', '/api/pairing', async (req, res) => {
    const id = await couple(req);
    const members = await transaction(db, async () => {
      const current = await db.prepare('SELECT coupleId FROM users WHERE id=?').get(req.user.id);
      if (current?.coupleId !== id) fail(409, '配对关系已改变');
      const rows = await db.prepare('SELECT id FROM users WHERE coupleId=?').all(id);
      await db.prepare('UPDATE users SET coupleId=NULL WHERE coupleId=?').run(id);
      return rows;
    });
    for (const member of members) streams.closeUser(String(member.id));
    io.to(`couple:${id}`).emit('profile:changed');
    io.in(`couple:${id}`).socketsLeave(`couple:${id}`);
    res.sendStatus(204);
  });
  route('patch', '/api/couple', async (req, res) => {
    const { startDate, startTime } = relationshipSchema.parse(req.body);
    await db
      .prepare('UPDATE couples SET startDate=?,startTime=? WHERE id=?')
      .run(startDate, startTime, await couple(req));
    io.to(`couple:${req.user.coupleId}`).emit('profile:changed');
    res.json({ startDate, startTime });
  });
  route('patch', '/api/couple/media-settings', async (req, res) => {
    const value = z.object({ retainOriginal: z.boolean() }).strict().parse(req.body);
    const id = await couple(req);
    await transaction(db, async () => {
      const current = await db
        .prepare('SELECT coupleId,disabled FROM users WHERE id=?')
        .get(req.user.id);
      if (current?.coupleId !== id || current.disabled) fail(409, '账号或配对状态已改变');
      await db
        .prepare(
          'INSERT INTO couple_media_settings(coupleId,retainOriginal) VALUES(?,?) ON CONFLICT(coupleId) DO UPDATE SET retainOriginal=excluded.retainOriginal',
        )
        .run(id, value.retainOriginal ? 1 : 0);
    });
    io.to(`couple:${id}`).emit('profile:changed');
    res.json(value);
  });
  const avatarUpload = multer({
    dest: join(uploads, 'tmp'),
    limits: { files: 1, fields: 0 },
  });
  app.post('/api/me/avatar', (req, res, next) =>
    avatarUpload.single('file')(req, res, async (error) => {
      const id = randomUUID(),
        preview = `${id}.avatar.webp`,
        thumbnail = `${id}.avatar-thumb.webp`;
      let committed = false;
      try {
        if (error) throw error;
        if (!req.file || !req.file.mimetype.startsWith('image/')) fail(400, '头像请选择有效图片');
        const image = sharp(req.file!.path, { limitInputPixels: false }).rotate();
        const [large, small] = await Promise.all([
          image.clone().resize(512, 512, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
          image.clone().resize(256, 256, { fit: 'cover' }).webp({ quality: 75 }).toBuffer(),
        ]);
        await Promise.all([
          writeFile(join(uploads, preview), large),
          writeFile(join(uploads, thumbnail), small),
        ]);
        const sizes = await syncMediaFiles(uploads, [preview, thumbnail]);
        await mediaRepository.stage([preview, thumbnail], sizes);
        const old = await commitMedia(
          db,
          async () =>
            Boolean(await db.prepare('SELECT mediaId FROM media_sizes WHERE mediaId=?').get(id)),
          async () => {
            const auth = await lookup(req.headers.authorization?.replace(/^Bearer /, '') || '');
            if (!auth) fail(401, '登录已过期');
            const previous = await db
              .prepare('SELECT * FROM media WHERE id=? AND coupleId IS NULL AND ownerId=?')
              .get(
                (auth!.user as User & { avatarMediaId?: string }).avatarMediaId || '',
                auth!.user.id,
              );
            await db
              .prepare('INSERT INTO media VALUES(?,?,?,?,?,?,?,?,?,?,?)')
              .run(
                id,
                null,
                auth!.user.id,
                'image',
                preview,
                preview,
                thumbnail,
                512,
                512,
                null,
                new Date().toISOString(),
              );
            await db
              .prepare('INSERT INTO media_sizes VALUES(?,?,?,?,?)')
              .run(id, 0, sizes[0], sizes[1], sizes[0] + sizes[1]);
            await mediaRepository.bind(id, [preview, thumbnail]);
            await db.prepare('UPDATE users SET avatarMediaId=? WHERE id=?').run(id, auth!.user.id);
            if (previous) {
              await db.prepare('DELETE FROM media_sizes WHERE mediaId=?').run(previous.id);
              await db.prepare('DELETE FROM media WHERE id=?').run(previous.id);
            }
            return previous;
          },
        );
        committed = true;
        if (old)
          await removeMediaFiles(
            [String(old.preview), String(old.thumbnail)].map((name) => join(uploads, name)),
          );
        if (db.provider === 'postgres')
          await removeMediaFiles([preview, thumbnail].map((name) => join(uploads, name)));
        if (req.file) await removeMediaFiles([req.file.path]);
        io.to(`user:${(req as AuthRequest).user.id}`).emit('profile:changed');
        if ((req as AuthRequest).user.coupleId)
          io.to(`couple:${(req as AuthRequest).user.coupleId}`).emit('profile:changed');
        res.status(201).json(await mediaView(id));
      } catch (err) {
        if (db.provider === 'postgres') await mediaRepository.discard([preview, thumbnail]);
        if (db.provider === 'postgres' || (!committed && !(err instanceof CommitUncertainError)))
          await removeMediaFiles([preview, thumbnail].map((name) => join(uploads, name)));
        if (req.file) await removeMediaFiles([req.file.path]);
        next(err instanceof HttpError ? err : new HttpError(422, '头像无法处理，请选择有效图片'));
      } finally {
        if (req.file) await removeMediaFiles([req.file.path]);
      }
    }),
  );
  route('get', '/api/notifications/stream', async (req, res) => await streams.open(req, res));
  route('get', '/api/messages', async (req, res) => {
    const before =
      req.query.before === undefined
        ? Number.MAX_SAFE_INTEGER
        : z.coerce.number().int().positive().parse(req.query.before);
    const rows = await db
      .prepare('SELECT * FROM messages WHERE coupleId=? AND id<? ORDER BY id DESC LIMIT 50')
      .all(await couple(req), before);
    res.json({
      items: await Promise.all(rows.reverse().map(messageView)),
      hasMore: rows.length === 50,
    });
  });
  route('post', '/api/messages', async (req, res) => {
    const value = z
      .object({
        clientId: z.string().uuid(),
        content: text.max(4000).default(''),
        mediaIds: z
          .array(z.string().uuid())
          .default([])
          .refine((ids) => new Set(ids).size === ids.length, '附件不能重复'),
      })
      .strict()
      .refine((v) => v.content || v.mediaIds.length, '消息不能为空')
      .parse(req.body);
    const coupleId = await couple(req);
    for (const id of value.mediaIds) await ownedMedia(id, req);
    const existing = await db
      .prepare('SELECT * FROM messages WHERE senderId=? AND clientId=?')
      .get(req.user.id, value.clientId);
    if (existing) {
      if (existing.coupleId !== coupleId) fail(409, '消息编号冲突');
      return res.json(await messageView(existing));
    }
    const recipient = (await partner(req.user)) || fail(409, '另一半已解除配对');
    const row = await transaction(db, async () => {
      const current = await lookup(req.headers.authorization?.replace(/^Bearer /, '') || '');
      if (!current || current.user.coupleId !== coupleId) fail(409, '账号或配对状态已改变');
      const existing = await db
        .prepare('SELECT * FROM messages WHERE senderId=? AND clientId=?')
        .get(req.user.id, value.clientId);
      if (existing) return existing;
      for (const mediaId of value.mediaIds) {
        await ownedMedia(mediaId, req);
        await publishMediaDraft(db, mediaId, req.user.id, coupleId);
      }
      const result = await db
        .prepare(
          'INSERT INTO messages(coupleId,senderId,clientId,content,createdAt) VALUES(?,?,?,?,?)',
        )
        .run(coupleId, req.user.id, value.clientId, value.content, new Date().toISOString());
      const id = Number(result.lastInsertRowid);
      for (const [position, mediaId] of value.mediaIds.entries())
        await db
          .prepare('INSERT INTO message_media(messageId,mediaId,position) VALUES(?,?,?)')
          .run(id, mediaId, position);
      if (mentionsAI(value.content, String((await aiIdentity(req.user)).name)))
        await db.prepare('INSERT INTO ai_jobs(messageId,userId) VALUES(?,?)').run(id, req.user.id);
      return (await db.prepare('SELECT * FROM messages WHERE id=?').get(id))!;
    });
    const result = await messageView(row);
    io.to(`couple:${coupleId}`).emit('message:new', result);
    await streams.flush();
    res.status(201).json(result);
  });
  route('post', '/api/messages/read', async (req, res) => {
    const { throughId } = z.object({ throughId: z.number().int().positive() }).parse(req.body);
    const coupleId = await couple(req),
      readAt = new Date().toISOString();
    await db
      .prepare(
        'UPDATE messages SET readAt=? WHERE coupleId=? AND senderId<>? AND id<=? AND readAt IS NULL',
      )
      .run(readAt, coupleId, req.user.id, throughId);
    io.to(`couple:${coupleId}`).emit('message:read', { throughId, readerId: req.user.id, readAt });
    res.sendStatus(204);
  });
  let processing = 0;
  const upload = multer({
    dest: join(uploads, 'tmp'),
    limits: { files: 1, fields: 0 },
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
    async (req, _res, next) => {
      try {
        const id = await couple(req as AuthRequest);
        if ((await control.usage(id)) >= (await control.quota(id)))
          fail(413, '两人空间存储已达到配额，请联系管理员');
        if (processing >= 2) fail(429, '正在处理其他媒体，请稍后重试');
        processing++;
        next();
      } catch (error) {
        next(error);
      }
    },
    (req, res, next) => {
      const controller = new AbortController();
      const abort = () => controller.abort(new Error('上传已取消'));
      const close = () => {
        if (!res.writableFinished) abort();
      };
      req.once('aborted', abort);
      res.once('close', close);
      if (req.aborted || res.destroyed) abort();
      const signal = controller.signal;
      upload.single('file')(req, res, async (error) => {
        let generatedFiles: string[] = [],
          committed = false;
        try {
          signal.throwIfAborted();
          if (error) throw error;
          if (!req.file) fail(400, '请选择支持的图片或视频');
          const keepOriginal = await retainOriginal((req as AuthRequest).user.coupleId!);
          const media = await processMedia(
            req.file!.path,
            req.file!.mimetype,
            uploads,
            keepOriginal,
            signal,
          );
          generatedFiles = [media.original, media.preview, media.thumbnail]
            .filter(Boolean)
            .map((name) => join(uploads, name));
          signal.throwIfAborted();
          const user = (await db
            .prepare('SELECT * FROM users WHERE id=?')
            .get((req as AuthRequest).user.id)) as User;
          if (!user || user.disabled || user.coupleId !== (req as AuthRequest).user.coupleId)
            fail(409, '配对关系已改变');
          const sizes = await syncMediaFiles(uploads, [
            media.original,
            media.preview,
            media.thumbnail,
          ]);
          const totalBytes = sizes.reduce((a, b) => a + b, 0);
          if (!Number.isSafeInteger(totalBytes)) fail(422, '媒体容量数据无效');
          // Reject known quota failures before copying large files into PostgreSQL.
          // The final transaction still rechecks capacity against concurrent uploads.
          if (
            db.provider === 'postgres' &&
            (await control.usage(user.coupleId!)) + totalBytes >
              (await control.quota(user.coupleId!))
          )
            fail(413, '两人空间存储已达到配额，请联系管理员');
          await mediaRepository.stage(
            [media.original, media.preview, media.thumbnail],
            sizes,
            false,
            signal,
          );
          signal.throwIfAborted();
          await commitMedia(
            db,
            async () =>
              Boolean(await db.prepare('SELECT id FROM media_uploads WHERE id=?').get(media.id)),
            async () => {
              signal.throwIfAborted();
              const current = await lookup(
                req.headers.authorization?.replace(/^Bearer /, '') || '',
              );
              if (!current || current.user.coupleId !== user.coupleId)
                fail(409, '账号或配对状态已改变');
              if ((await retainOriginal(user.coupleId!)) !== keepOriginal)
                fail(409, '媒体保存设置已改变，请重新上传');
              if (
                (await control.usage(user.coupleId!)) + totalBytes >
                (await control.quota(user.coupleId!))
              )
                fail(413, '两人空间存储已达到配额，请联系管理员');
              await db
                .prepare('INSERT INTO media_uploads VALUES(?,?,?,?,?)')
                .run(
                  media.id,
                  user.coupleId,
                  user.id,
                  JSON.stringify({ ...media, sizes, totalBytes, retainOriginal: keepOriginal }),
                  new Date().toISOString(),
                );
              signal.throwIfAborted();
            },
          );
          committed = true;
          if (db.provider === 'postgres') await removeMediaFiles(generatedFiles);
          res
            .status(201)
            .json({ ...(await mediaView(media.id)), capturedDate: media.capturedDate });
        } catch (err) {
          if (db.provider === 'postgres' && !committed && !(err instanceof CommitUncertainError))
            await mediaRepository.discard(
              generatedFiles.map((file) => file.slice(uploads.length + 1)),
            );
          if (db.provider === 'postgres' || (!committed && !(err instanceof CommitUncertainError)))
            await removeMediaFiles([...generatedFiles, ...(req.file ? [req.file.path] : [])]);
          if (!signal.aborted)
            next(
              err instanceof HttpError || err instanceof multer.MulterError
                ? err
                : new HttpError(422, '媒体无法解码，请确认文件完整且格式受支持'),
            );
        } finally {
          req.off('aborted', abort);
          res.off('close', close);
          processing--;
        }
      });
    },
  );
  route('delete', '/api/media/:id', async (req, res) => {
    await couple(req);
    const id = z.string().uuid().parse(req.params.id);
    let names: string[] = [];
    await db.transaction(async () => {
      const draft = await db
        .prepare('SELECT metadata FROM media_uploads WHERE id=? AND ownerId=?')
        .get(id, req.user.id);
      if (draft) {
        const media = JSON.parse(String(draft.metadata));
        names = [media.original, media.preview, media.thumbnail].filter(Boolean);
        if (
          names.some(
            (name) => name.includes('/') || name.includes('\\') || name === '.' || name === '..',
          )
        )
          fail(500, '媒体路径无效');
        await db.prepare('DELETE FROM media_uploads WHERE id=?').run(id);
        if (db.provider === 'postgres')
          for (const name of new Set(names))
            await db.prepare('DELETE FROM media_files WHERE name=? AND mediaId IS NULL').run(name);
        return;
      }
      const row = await db
        .prepare('SELECT * FROM media WHERE id=? AND ownerId=?')
        .get(id, req.user.id);
      if (!row) return;
      if ((await mediaReferences(db)).has(id)) fail(409, '此媒体已被回忆、聊天或头像使用');
      const candidates = [
        ...new Set([row.original, row.preview, row.thumbnail].filter(Boolean).map(String)),
      ];
      for (const name of candidates) {
        if (name.includes('/') || name.includes('\\') || name === '.' || name === '..')
          fail(500, '媒体路径无效');
        if (
          !(await db
            .prepare(
              'SELECT id FROM media WHERE id<>? AND (original=? OR preview=? OR thumbnail=?)',
            )
            .get(id, name, name, name))
        )
          names.push(name);
      }
      await db.prepare('DELETE FROM media_sizes WHERE mediaId=?').run(id);
      await db.prepare('DELETE FROM media WHERE id=?').run(id);
    });
    await removeMediaFiles(names.map((name) => join(uploads, name)));
    if (!res.headersSent) res.status(204).end();
  });
  route('get', '/api/moments', async (req, res) => {
    await couple(req);
    const result = await readAlbum(db, req.user, req.query);
    res.json({
      ...result,
      items: await Promise.all(
        result.items.map(async (row) => ({
          ...row,
          media: await mediaView(row.mediaId as string),
        })),
      ),
    });
  });
  route('post', '/api/moments', async (req, res) => {
    const value = z
      .object({
        title: text.max(300).default(''),
        mediaId: z.string().uuid(),
        date,
        clientId: z.string().uuid().optional(),
      })
      .parse(req.body);
    const coupleId = await couple(req),
      id = value.clientId || randomUUID();
    await commitMedia(
      db,
      async () =>
        Boolean(
          await db.prepare('SELECT id FROM moments WHERE id=? AND ownerId=?').get(id, req.user.id),
        ),
      async () => {
        const current = await lookup(req.headers.authorization?.replace(/^Bearer /, '') || '');
        if (!current || current.user.coupleId !== coupleId) fail(409, '账号或配对状态已改变');
        const existing = await db.prepare('SELECT * FROM moments WHERE id=?').get(id);
        if (existing) {
          if (
            existing.ownerId !== req.user.id ||
            existing.coupleId !== coupleId ||
            existing.mediaId !== value.mediaId ||
            existing.title !== value.title ||
            existing.date !== value.date
          )
            fail(409, '回忆编号冲突');
          return;
        }
        await ownedMedia(value.mediaId, req);
        await publishMediaDraft(db, value.mediaId, req.user.id, coupleId);
        await db
          .prepare(
            'INSERT INTO moments(id,coupleId,ownerId,title,mediaId,date) VALUES(?,?,?,?,?,?)',
          )
          .run(id, coupleId, req.user.id, value.title, value.mediaId, value.date);
      },
    );
    io.to(`couple:${coupleId}`).emit('moments:changed');
    res.status(201).json({ id });
  });
  route('patch', '/api/moments/:id', async (req, res) => {
    const value = z.object({ title: text.max(300), date }).parse(req.body);
    const result = await db
      .prepare('UPDATE moments SET title=?,date=? WHERE id=? AND coupleId=? AND ownerId=?')
      .run(value.title, value.date, String(req.params.id), await couple(req), req.user.id);
    if (!result.changes) fail(404, '回忆不存在或不是你发布的');
    io.to(`couple:${req.user.coupleId}`).emit('moments:changed');
    res.sendStatus(204);
  });
  route('delete', '/api/moments/:id', async (req, res) => {
    const result = await db
      .prepare('DELETE FROM moments WHERE id=? AND coupleId=? AND ownerId=?')
      .run(String(req.params.id), await couple(req), req.user.id);
    if (!result.changes) fail(404, '回忆不存在或不是你发布的');
    io.to(`couple:${req.user.coupleId}`).emit('moments:changed');
    res.sendStatus(204);
  });
  route('get', '/api/anniversaries', async (req, res) =>
    res.json(
      await db
        .prepare('SELECT * FROM anniversaries WHERE coupleId=? ORDER BY date,time')
        .all(await couple(req)),
    ),
  );
  route('post', '/api/anniversaries', async (req, res) => {
    const value = anniversarySchema.parse(req.body);
    const id = randomUUID(),
      coupleId = await couple(req);
    await db
      .prepare('INSERT INTO anniversaries(id,coupleId,title,date,time) VALUES(?,?,?,?,?)')
      .run(id, coupleId, value.title, value.date, value.time);
    io.to(`couple:${coupleId}`).emit('anniversaries:changed');
    res.status(201).json({ id });
  });
  route('patch', '/api/anniversaries/:id', async (req, res) => {
    await executeTool(db, req.user.id, 'update_anniversary', {
      ...req.body,
      id: String(req.params.id),
    });
    io.to(`couple:${req.user.coupleId}`).emit('anniversaries:changed');
    res.sendStatus(204);
  });
  route('get', '/api/todos', async (req, res) =>
    res.json(
      await db
        .prepare('SELECT * FROM todos WHERE coupleId=? ORDER BY date,time')
        .all(await couple(req)),
    ),
  );
  const changeTodo = async (
    req: AuthRequest,
    res: Response,
    tool: string,
    body: unknown,
    status = 204,
  ) => {
    await couple(req);
    try {
      const result = await executeTool(db, req.user.id, tool, body);
      io.to(`couple:${req.user.coupleId}`).emit('todos:changed');
      if (status === 204) res.sendStatus(204);
      else res.status(status).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) throw error;
      fail(404, (error as Error).message);
    }
  };
  route(
    'post',
    '/api/todos',
    async (req, res) => await changeTodo(req, res, 'create_todo', req.body, 201),
  );
  route(
    'patch',
    '/api/todos/:id',
    async (req, res) =>
      await changeTodo(req, res, 'update_todo', { ...req.body, id: String(req.params.id) }),
  );
  route(
    'post',
    '/api/todos/:id/completion',
    async (req, res) =>
      await changeTodo(req, res, 'complete_todo', { ...req.body, id: String(req.params.id) }),
  );
  route(
    'delete',
    '/api/todos/:id',
    async (req, res) => await changeTodo(req, res, 'delete_todo', { id: String(req.params.id) }),
  );
  route('patch', '/api/ai/profile', async (req, res) => {
    const value = aiProfileSchema.parse(req.body);
    await executeTool(db, req.user.id, 'update_ai_profile', value);
    io.to(`couple:${req.user.coupleId}`).emit('profile:changed');
    res.sendStatus(204);
  });
  route('get', '/api/ai/settings', async (req, res) => {
    const row = await db
      .prepare('SELECT baseUrl,model,enabled,secret FROM couple_ai_settings WHERE coupleId=?')
      .get(await couple(req));
    res.json(
      row
        ? {
            baseUrl: row.baseUrl,
            model: row.model,
            hasKey: Boolean(row.secret && decryptKey(String(row.secret), secret)),
            ...(await aiIdentity(req.user)),
          }
        : { baseUrl: '', model: '', hasKey: false, ...(await aiIdentity(req.user)) },
    );
  });
  route('post', '/api/ai/settings', async (req, res) => {
    const value = aiConfigSchema.parse(req.body);
    let baseUrl: string;
    try {
      baseUrl = validateAIUrl(value.baseUrl);
    } catch (err) {
      return fail(400, (err as Error).message);
    }
    const coupleId = await transaction(db, async () => {
      const id = await couple(req);
      const old = (await db
        .prepare('SELECT secret,baseUrl FROM couple_ai_settings WHERE coupleId=?')
        .get(id)) as { secret: string; baseUrl: string } | undefined;
      const encrypted =
        value.apiKey !== undefined
          ? encryptKey(value.apiKey, secret)
          : old?.baseUrl === baseUrl
            ? old.secret
            : encryptKey('', secret);
      await db
        .prepare(
          'INSERT INTO couple_ai_settings(coupleId,baseUrl,model,secret,enabled) VALUES(?,?,?,?,?) ON CONFLICT(coupleId) DO UPDATE SET baseUrl=excluded.baseUrl,model=excluded.model,secret=excluded.secret,enabled=excluded.enabled',
        )
        .run(id, baseUrl, value.model, encrypted, Number(value.enabled));
      return id;
    });
    io.to(`couple:${coupleId}`).emit('profile:changed');
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
  route('post', '/api/ai/tools/:name', async (req, res) => {
    const result = await executeTool(db, req.user.id, String(req.params.name), req.body);
    io.to(`couple:${req.user.coupleId}`).emit('profile:changed');
    io.to(`couple:${req.user.coupleId}`).emit('moments:changed');
    io.to(`couple:${req.user.coupleId}`).emit('anniversaries:changed');
    io.to(`couple:${req.user.coupleId}`).emit('todos:changed');
    res.json(result);
  });
  route('delete', '/api/anniversaries/:id', async (req, res) => {
    const result = await db
      .prepare('DELETE FROM anniversaries WHERE id=? AND coupleId=?')
      .run(String(req.params.id), await couple(req));
    if (!result.changes) fail(404, '纪念日不存在');
    io.to(`couple:${req.user.coupleId}`).emit('anniversaries:changed');
    res.sendStatus(204);
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: '接口不存在' }));
  if (options.staticDir) {
    app.use(express.static(resolve(options.staticDir)));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve(options.staticDir!, 'index.html')));
  }
  app.use(async (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError && error.status >= 400)
      await control.log(error.status >= 500 ? 'error' : 'warn', 'http.rejected', {
        path: _req.path.replace(/^(\/api\/album\/download)\/[^/]+$/, '$1/[redacted]'),
        status: error.status,
      });
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: '输入不符合要求', details: error.issues.map((issue) => issue.message) });
    if (error instanceof multer.MulterError)
      return res.status(400).json({ error: '上传格式无效，请只提交一个文件' });
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    await control.log('error', 'http.unexpected', {
      path: _req.path.replace(/^(\/api\/album\/download)\/[^/]+$/, '$1/[redacted]'),
      requestId: (_req as Request & { requestId?: string }).requestId,
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    res.status(500).json({ error: '服务暂时不可用' });
  });
  io.use(async (socket, next) => {
    try {
      const found = await lookup(String(socket.handshake.auth.token || ''));
      if (!found) return next(new Error('登录已过期'));
      socket.data = {
        userId: found.user.id,
        user: found.user,
        hash: found.hash,
        expires: found.expires,
        active: socket.handshake.auth.active !== false,
        lastReportedAt: Date.now(),
      };
      next();
    } catch {
      next(new Error('连接暂时不可用'));
    }
  });
  io.on('connection', (socket) => {
    try {
      // Install rooms and listeners synchronously before the client can send packets.
      const user = socket.data.user as User;
      void control.log('info', 'realtime.connected', { userId: user.id });
      socket.join(`user:${user.id}`);
      socket.join(`session:${socket.data.hash}`);
      if (user.coupleId) socket.join(`couple:${user.coupleId}`);
      const expiryTimer = setTimeout(
        () => socket.disconnect(true),
        Math.min(socket.data.expires - Date.now(), 2_147_483_647),
      );
      let lastTyping = 0;
      socket.use(async (_packet, next) => {
        try {
          (await lookupByHash(socket.data.hash)) ? next() : socket.disconnect(true);
        } catch {
          socket.disconnect(true);
        }
      });
      async function lookupByHash(hash: string) {
        return await db
          .prepare('SELECT hash FROM sessions WHERE hash=? AND expires>?')
          .get(hash, Date.now());
      }
      socket.on('presence:get', async () => {
        try {
          const current = await db.prepare('SELECT coupleId FROM users WHERE id=?').get(user.id);
          await broadcastPresence(current?.coupleId as string | null);
        } catch {
          socket.disconnect(true);
        }
      });
      socket.on('presence:set', async (value) => {
        if (typeof value?.active !== 'boolean') return;
        try {
          socket.data.active = value.active;
          socket.data.lastReportedAt = Date.now();
          const current = await db.prepare('SELECT coupleId FROM users WHERE id=?').get(user.id);
          await broadcastPresence(current?.coupleId as string | null);
        } catch {
          socket.disconnect(true);
        }
      });
      socket.on('typing', async () => {
        try {
          if (Date.now() - lastTyping < 1500) return;
          lastTyping = Date.now();
          const current = (await db.prepare('SELECT * FROM users WHERE id=?').get(user.id)) as User;
          if (current.coupleId)
            socket.to(`couple:${current.coupleId}`).emit('typing', { userId: user.id });
        } catch {
          socket.disconnect(true);
        }
      });
      socket.on('disconnect', async (reason) => {
        clearTimeout(expiryTimer);
        try {
          const current = await db.prepare('SELECT coupleId FROM users WHERE id=?').get(user.id);
          await broadcastPresence(current?.coupleId as string | null);
          await control.log('info', 'realtime.disconnected', { userId: user.id, reason });
        } catch {
          /* The application may already be shutting down. */
        }
      });
      void broadcastPresence(user.coupleId).catch(() => socket.disconnect(true));
    } catch {
      socket.disconnect(true);
    }
  });
  const worker = aiWorker({
    db,
    secret,
    uploads,
    mediaRepository,
    notify: async (id, row) => {
      io.to(`couple:${id}`).emit('message:new', await messageView(row));
      await streams.flush();
    },
    changed: (id, userId) => {
      io.to(`user:${userId}`).emit('profile:changed');
      for (const event of [
        'profile:changed',
        'moments:changed',
        'anniversaries:changed',
        'todos:changed',
      ])
        io.to(`couple:${id}`).emit(event);
    },
  });
  const presenceTimer = setInterval(() => {
    const pairs = new Set<string>();
    for (const room of io.sockets.adapter.rooms.keys())
      if (room.startsWith('couple:')) pairs.add(room.slice(7));
    for (const id of pairs) void broadcastPresence(id).catch(() => {});
  }, 5000);
  presenceTimer.unref();
  const pending = new Set<Promise<unknown>>();
  let closing = false;
  function track<T>(task: Promise<T>): Promise<T> {
    pending.add(task);
    void task.finally(() => pending.delete(task)).catch(() => {});
    return task;
  }
  const runAI = () => (closing ? Promise.resolve() : track(worker()));
  let lastPrune = 0;
  const timer = setInterval(() => {
    if (closing) return;
    void runAI().catch(() => control.log('error', 'ai.worker.failed'));
    void track(
      (async () => {
        await db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
        await db.prepare('DELETE FROM invites WHERE expires<?').run(Date.now());
        if (Date.now() - lastPrune > 60_000) {
          lastPrune = Date.now();
          await control.prune();
        }
      })(),
    ).catch(() => control.log('error', 'maintenance.failed'));
  }, 5000);
  timer.unref();
  return {
    app,
    http,
    io,
    db,
    mediaRepository,
    control,
    runAI,
    close: async () => {
      closing = true;
      clearInterval(presenceTimer);
      clearInterval(timer);
      await control.bootstrap.catch(() => {});
      streams.close();
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await Promise.allSettled([...pending]);
      await control.close();
      await db.close();
    },
  };
}
