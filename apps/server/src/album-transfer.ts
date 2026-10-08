import type { Express, Request, Response, RequestHandler } from 'express';
import { randomUUID, createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { spawn } from 'node:child_process';
import archiver from 'archiver';
import yauzl, { type ZipFile, type Entry } from 'yauzl';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { validSolarDate } from '@love/calendar';
import { type DB, type User, transaction } from './db.js';
import { fail, HttpError } from './errors.js';
import { signMedia, validSignature } from './security.js';

type Auth = Request & { user: User; sessionHash: string };
type Control = {
  usage: (id: string) => Promise<number>;
  quota: (id: string | null) => Promise<number>;
};
const fileSchema = z
  .object({
    path: z.string().regex(/^media\/[a-f0-9-]{36}\.(source|preview\.(webp|mp4)|thumb\.webp)$/),
    bytes: z.number().int().nonnegative().safe(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
const manifestSchema = z
  .object({
    format: z.literal('love-album'),
    version: z.literal(1),
    exportedAt: z.iso.datetime(),
    media: z.array(
      z
        .object({
          id: z.string().uuid(),
          kind: z.enum(['image', 'video']),
          width: z.number().int().positive().nullable(),
          height: z.number().int().positive().nullable(),
          duration: z.number().positive().nullable(),
          createdAt: z.iso.datetime(),
          original: fileSchema.nullable(),
          preview: fileSchema,
          thumbnail: fileSchema,
        })
        .strict(),
    ),
    moments: z.array(
      z
        .object({
          mediaId: z.string().uuid(),
          title: z.string().max(300),
          date: z.string().refine(validSolarDate),
          createdAt: z.iso.datetime(),
          author: z.string().max(40),
        })
        .strict(),
    ),
  })
  .strict();
type Manifest = z.infer<typeof manifestSchema>;
async function checksum(path: string) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
const openZip = (path: string) =>
  new Promise<ZipFile>((resolve, reject) =>
    yauzl.open(
      path,
      { lazyEntries: true, autoClose: false, strictFileNames: true, validateEntrySizes: true },
      (error, zip) => (error ? reject(error) : resolve(zip!)),
    ),
  );
const zipStream = (zip: ZipFile, entry: Entry) =>
  new Promise<NodeJS.ReadableStream>((resolve, reject) =>
    zip.openReadStream(entry, (error, stream) => (error ? reject(error) : resolve(stream!))),
  );
async function entries(zip: ZipFile) {
  return new Promise<Map<string, Entry>>((resolve, reject) => {
    const files = new Map<string, Entry>();
    zip.once('error', reject);
    zip.once('end', () => resolve(files));
    zip.on('entry', (entry: Entry) => {
      if (
        files.has(entry.fileName) ||
        entry.generalPurposeBitFlag & 1 ||
        ((entry.externalFileAttributes >>> 16) & 0o170000) === 0o120000
      ) {
        reject(new HttpError(400, '导入包包含重复文件、加密文件或符号链接'));
        zip.close();
        return;
      }
      files.set(entry.fileName, entry);
      zip.readEntry();
    });
    zip.readEntry();
  });
}
async function inspectVideo(path: string) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(
      'ffprobe',
      ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    );
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      try {
        if (code !== 0) throw new Error('视频预览无效');
        resolve(JSON.parse(output));
      } catch (error) {
        reject(error);
      }
    });
  });
}
export function installAlbumTransfers({
  app,
  db,
  uploads,
  secret,
  authenticate,
  control,
  changed,
}: {
  app: Express;
  db: DB;
  uploads: string;
  secret: string;
  authenticate: RequestHandler;
  control: Control;
  changed: (id: string) => void;
}) {
  const activePair = async (user: User) => {
    if (
      !user.coupleId ||
      Number(
        (
          await db
            .prepare('SELECT COUNT(*) n FROM users WHERE coupleId=? AND disabled=0')
            .get(user.coupleId)
        )?.n,
      ) !== 2
    )
      fail(409, '请先与另一半配对');
    return user.coupleId!;
  };
  const validSession = async (userId: string, sessionHash: string, coupleId: string) => {
    const user = await db
      .prepare(
        'SELECT u.* FROM sessions s JOIN users u ON u.id=s.userId WHERE s.hash=? AND s.expires>? AND u.id=? AND u.disabled=0',
      )
      .get(sessionHash, Date.now(), userId);
    if (!user || !user.verifiedAt || user.coupleId !== coupleId)
      fail(403, '导出链接已失效或配对关系已改变');
    await activePair(user as User);
  };
  app.post('/api/album/exports', authenticate, async (req, res) => {
    const auth = req as Auth,
      format = z.enum(['pictures', 'archive']).parse(req.body.format);
    const coupleId = await activePair(auth.user);
    const id = Buffer.from(
      JSON.stringify({ userId: auth.user.id, sessionHash: auth.sessionHash, coupleId, format }),
    ).toString('base64url');
    const expires = Date.now() + 20 * 60_000;
    res.json({
      url: `/api/album/download/${id}?expires=${expires}&signature=${signMedia(secret, id, 'album', expires)}`,
      filename: `Love-${format === 'pictures' ? 'photos' : 'album'}-${new Date().toISOString().slice(0, 10)}.zip`,
    });
  });
  app.get('/api/album/download/:id', async (req, res, next) => {
    let archive: ReturnType<typeof archiver> | undefined;
    try {
      const id = String(req.params.id),
        expires = Number(req.query.expires);
      if (
        id.length > 1500 ||
        !Number.isSafeInteger(expires) ||
        expires <= Date.now() ||
        expires > Date.now() + 20 * 60_000 ||
        !validSignature(String(req.query.signature || ''), signMedia(secret, id, 'album', expires))
      )
        fail(403, '导出链接已过期');
      const grant = z
        .object({
          userId: z.string().uuid(),
          sessionHash: z.string().regex(/^[a-f0-9]{64}$/),
          coupleId: z.string().uuid(),
          format: z.enum(['pictures', 'archive']),
        })
        .strict()
        .parse(JSON.parse(Buffer.from(id, 'base64url').toString()));
      await validSession(grant.userId, grant.sessionHash, grant.coupleId);
      const rows = await db
        .prepare(
          'SELECT m.*,u.name AS author FROM moments m JOIN users u ON u.id=m.ownerId WHERE m.coupleId=? ORDER BY m.date,m.id',
        )
        .all(grant.coupleId);
      const media = new Map<string, Record<string, unknown>>();
      for (const row of rows) {
        const item = await db
          .prepare('SELECT * FROM media WHERE id=? AND coupleId=?')
          .get(row.mediaId, grant.coupleId);
        if (!item) fail(409, '相册文件不完整，请重新导出');
        if (grant.format === 'archive' || item!.kind === 'image')
          media.set(String(item!.id), item!);
      }
      const manifest: Manifest = {
        format: 'love-album',
        version: 1,
        exportedAt: new Date().toISOString(),
        media: [],
        moments: rows.map((row) => ({
          mediaId: String(row.mediaId),
          title: String(row.title),
          date: String(row.date),
          createdAt: String(row.createdAt),
          author: String(row.author),
        })),
      };
      if (grant.format === 'archive') {
        for (const item of media.values()) {
          const describe = async (variant: string) => {
            const name = String(item[variant]);
            if (!name) return null;
            if (!/^[a-f0-9-]{36}\.(source|preview\.(webp|mp4)|thumb\.webp)$/.test(name))
              fail(409, '相册媒体文件名无效');
            const path = join(uploads, name);
            return {
              path: `media/${name}`,
              bytes: (await stat(path)).size,
              sha256: await checksum(path),
            };
          };
          manifest.media.push({
            id: String(item.id),
            kind: item.kind as 'image' | 'video',
            width: item.width as number | null,
            height: item.height as number | null,
            duration: item.duration as number | null,
            createdAt: String(item.createdAt),
            original: await describe('original'),
            preview: (await describe('preview'))!,
            thumbnail: (await describe('thumbnail'))!,
          });
        }
      }
      await validSession(grant.userId, grant.sessionHash, grant.coupleId);
      res
        .set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' })
        .attachment(
          `Love-${grant.format === 'pictures' ? 'photos' : 'album'}-${new Date().toISOString().slice(0, 10)}.zip`,
        );
      archive = archiver('zip', { store: true });
      archive.on('error', (error) => {
        if (!res.headersSent) next(error);
        else res.destroy(error);
      });
      archive.on('warning', (error) => archive?.emit('error', error));
      res.once('close', () => {
        if (!res.writableFinished) archive?.abort();
      });
      archive.pipe(res);
      if (grant.format === 'archive') {
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
        for (const item of manifest.media)
          for (const file of [item.original, item.preview, item.thumbnail])
            if (file) archive.file(join(uploads, file.path.slice(6)), { name: file.path });
      } else {
        let index = 0;
        for (const row of rows) {
          const item = media.get(String(row.mediaId));
          if (!item) continue;
          // Portable JPEGs open in ordinary photo viewers, independent of the Love backup format.
          const photo = sharp(join(uploads, String(item.preview)), {
            limitInputPixels: false,
          }).jpeg({ quality: 92 });
          archive.append(photo, { name: `${row.date}-${String(++index).padStart(5, '0')}.jpg` });
        }
      }
      await archive.finalize();
    } catch (error) {
      archive?.abort();
      if (res.headersSent) res.destroy(error as Error);
      else next(error);
    }
  });
  const upload = multer({ dest: join(uploads, 'tmp'), limits: { files: 1, fields: 0 } });
  const importing = new Set<string>();
  app.post('/api/album/imports', authenticate, async (req, res, next) => {
    let pairId = '';
    try {
      pairId = await activePair((req as Auth).user);
      if (importing.has(pairId)) fail(429, '两人空间正在导入，请等待完成');
      importing.add(pairId);
    } catch (error) {
      next(error);
      return;
    }
    upload.single('file')(req, res, async (error) => {
      let zip: ZipFile | undefined,
        workspace = '',
        committed = false;
      let failure: unknown,
        status = 201,
        result = { imported: 0, alreadyImported: false };
      const moved: string[] = [];
      try {
        importWork: {
          if (error) throw error;
          if (!req.file) fail(400, '请选择 Love 相册导出 ZIP');
          const auth = req as Auth,
            digest = await checksum(req.file!.path);
          await validSession(auth.user.id, auth.sessionHash, pairId);
          if (
            await db
              .prepare('SELECT digest FROM album_imports WHERE coupleId=? AND digest=?')
              .get(pairId, digest)
          ) {
            status = 200;
            result = { imported: 0, alreadyImported: true };
            break importWork;
          }
          const setting = await db
            .prepare('SELECT retainOriginal FROM couple_media_settings WHERE coupleId=?')
            .get(pairId);
          const keepOriginal = !setting || Boolean(Number(setting.retainOriginal));
          zip = await openZip(req.file!.path);
          const files = await entries(zip);
          const manifestEntry = files.get('manifest.json');
          if (!manifestEntry) fail(400, '此 ZIP 不包含可导入的相册清单，请使用完整相册导出');
          workspace = await mkdtemp(join(uploads, 'tmp', 'album-import-'));
          await pipeline(
            await zipStream(zip, manifestEntry!),
            createWriteStream(join(workspace, 'manifest.json'), { flags: 'wx' }),
          );
          const manifest = manifestSchema.parse(
            JSON.parse(await readFile(join(workspace, 'manifest.json'), 'utf8')),
          );
          const ids = new Set<string>(),
            expected = new Map<string, { file: z.infer<typeof fileSchema>; retained: boolean }>();
          let totalBytes = 0;
          for (const item of manifest.media) {
            if (ids.has(item.id)) fail(400, '相册清单包含重复媒体');
            ids.add(item.id);
            if (
              item.preview.path !==
                `media/${item.id}.preview.${item.kind === 'image' ? 'webp' : 'mp4'}` ||
              item.thumbnail.path !== `media/${item.id}.thumb.webp` ||
              (item.original && item.original.path !== `media/${item.id}.source`)
            )
              fail(400, '相册媒体路径与类型不匹配');
            for (const file of [item.original, item.preview, item.thumbnail]) {
              if (!file) continue;
              const entry = files.get(file.path);
              if (!entry || entry.uncompressedSize !== file.bytes || expected.has(file.path))
                fail(400, '相册文件缺失、重复或大小不匹配');
              const retained = file !== item.original || keepOriginal;
              expected.set(file.path, { file, retained });
              if (retained) totalBytes += file.bytes;
            }
          }
          if (!Number.isSafeInteger(totalBytes)) fail(400, '相册容量数据无效');
          if (
            files.size !== expected.size + 1 ||
            manifest.moments.some((item) => !ids.has(item.mediaId)) ||
            [...ids].some((id) => !manifest.moments.some((item) => item.mediaId === id))
          )
            fail(400, '相册清单包含未引用或未知文件');
          if ((await control.usage(pairId)) + totalBytes > (await control.quota(pairId)))
            fail(413, '两人空间剩余容量不足，请联系管理员');
          for (const [path, { file, retained }] of expected) {
            const stream = await zipStream(zip, files.get(path)!);
            const hash = createHash('sha256');
            let actual = 0;
            stream.on('data', (chunk) => {
              hash.update(chunk);
              actual += chunk.length;
            });
            await pipeline(
              stream,
              retained
                ? createWriteStream(join(workspace, path.slice(6)), { flags: 'wx' })
                : new Writable({
                    write(_chunk, _encoding, done) {
                      done();
                    },
                  }),
            );
            if (actual !== file.bytes || hash.digest('hex') !== file.sha256)
              fail(400, '相册文件校验失败，导入未保存');
          }
          const remapped = new Map<
            string,
            { id: string; original: string; preview: string; thumbnail: string }
          >();
          for (const item of manifest.media) {
            const thumb = await sharp(join(workspace, item.thumbnail.path.slice(6)), {
              limitInputPixels: false,
            }).metadata();
            if (thumb.format !== 'webp') fail(400, '相册缩略图无效');
            if (item.kind === 'image') {
              const image = await sharp(join(workspace, item.preview.path.slice(6)), {
                limitInputPixels: false,
              }).metadata();
              if (image.format !== 'webp') fail(400, '相册图片预览无效');
            } else {
              const info = await inspectVideo(join(workspace, item.preview.path.slice(6)));
              const streams = info.streams as { codec_type: string; codec_name: string }[];
              if (!streams?.some((s) => s.codec_type === 'video' && s.codec_name === 'h264'))
                fail(400, '相册视频预览无效');
            }
            const id = randomUUID(),
              mapped = {
                id,
                original: '',
                preview: `${id}.preview.${item.kind === 'image' ? 'webp' : 'mp4'}`,
                thumbnail: `${id}.thumb.webp`,
              };
            for (const variant of ['original', 'preview', 'thumbnail'] as const) {
              const file = item[variant];
              if (!file || (variant === 'original' && !keepOriginal)) continue;
              const name = variant === 'original' ? `${id}.source` : mapped[variant];
              mapped[variant] = name;
              const destination = join(uploads, name);
              moved.push(destination);
              await rename(join(workspace, file.path.slice(6)), destination);
            }
            remapped.set(item.id, mapped);
          }
          await transaction(db, async () => {
            await validSession(auth.user.id, auth.sessionHash, pairId);
            const current = await db
              .prepare('SELECT retainOriginal FROM couple_media_settings WHERE coupleId=?')
              .get(pairId);
            if ((!current || Boolean(Number(current.retainOriginal))) !== keepOriginal)
              fail(409, '媒体保存设置已改变，请重新导入');
            if ((await control.usage(pairId)) + totalBytes > (await control.quota(pairId)))
              fail(413, '两人空间剩余容量不足，请联系管理员');
            for (const item of manifest.media) {
              const mapped = remapped.get(item.id)!;
              await db
                .prepare('INSERT INTO media VALUES(?,?,?,?,?,?,?,?,?,?,?)')
                .run(
                  mapped.id,
                  pairId,
                  auth.user.id,
                  item.kind,
                  mapped.original,
                  mapped.preview,
                  mapped.thumbnail,
                  item.width,
                  item.height,
                  item.duration,
                  item.createdAt,
                );
              const originalBytes = keepOriginal ? item.original?.bytes || 0 : 0;
              await db
                .prepare('INSERT INTO media_sizes VALUES(?,?,?,?,?)')
                .run(
                  mapped.id,
                  originalBytes,
                  item.preview.bytes,
                  item.thumbnail.bytes,
                  originalBytes + item.preview.bytes + item.thumbnail.bytes,
                );
            }
            for (const item of manifest.moments)
              await db
                .prepare(
                  'INSERT INTO moments(id,coupleId,ownerId,title,mediaId,date,createdAt) VALUES(?,?,?,?,?,?,?)',
                )
                .run(
                  randomUUID(),
                  pairId,
                  auth.user.id,
                  item.title,
                  remapped.get(item.mediaId)!.id,
                  item.date,
                  item.createdAt,
                );
            await db
              .prepare('INSERT INTO album_imports(coupleId,digest) VALUES(?,?)')
              .run(pairId, digest);
          });
          committed = true;
          changed(pairId);
          result = { imported: manifest.moments.length, alreadyImported: false };
        }
      } catch (err) {
        if (!committed) await Promise.all(moved.map((path) => rm(path, { force: true })));
        failure =
          err instanceof HttpError || err instanceof z.ZodError || err instanceof multer.MulterError
            ? err
            : new HttpError(400, '导入包无法读取或媒体已损坏，未保存任何回忆');
      } finally {
        zip?.close();
        await Promise.all(
          [req.file?.path, workspace]
            .filter(Boolean)
            .map((path) => rm(path!, { force: true, recursive: true })),
        );
        importing.delete(pairId);
      }
      if (failure) next(failure);
      else res.status(status).json(result);
    });
  });
}
