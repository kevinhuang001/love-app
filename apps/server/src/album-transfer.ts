import { MediaRepository } from './media-repository.js';
import type { Express, Request, RequestHandler } from 'express';
import { Readable } from 'node:stream';
import archiver from 'archiver';
import sharp from 'sharp';
import { z } from 'zod';
import { type DB, type User } from './db.js';
import { fail } from './errors.js';
import { signMedia, validSignature } from './security.js';
type Auth = Request & { user: User; sessionHash: string };
export function installAlbumTransfers({
  app,
  db,
  mediaRepository,
  secret,
  authenticate,
}: {
  app: Express;
  db: DB;
  mediaRepository: MediaRepository;
  secret: string;
  authenticate: RequestHandler;
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
  app.post('/api/album/exports', authenticate, async (req, res) => {
    const auth = req as Auth,
      coupleId = await activePair(auth.user);
    const id = Buffer.from(
      JSON.stringify({ userId: auth.user.id, sessionHash: auth.sessionHash, coupleId }),
    ).toString('base64url');
    const expires = Date.now() + 20 * 60_000;
    res.json({
      url: `/api/album/download/${id}?expires=${expires}&signature=${signMedia(secret, id, 'album', expires)}`,
      filename: `Love-album-${new Date().toISOString().slice(0, 10)}.zip`,
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
        })
        .strict()
        .parse(JSON.parse(Buffer.from(id, 'base64url').toString()));
      const user = await db
        .prepare(
          'SELECT u.* FROM sessions s JOIN users u ON u.id=s.userId WHERE s.hash=? AND s.expires>? AND u.id=? AND u.disabled=0',
        )
        .get(grant.sessionHash, Date.now(), grant.userId);
      if (!user || !user.verifiedAt || user.coupleId !== grant.coupleId)
        fail(403, '导出链接已失效或配对关系已改变');
      await activePair(user as User);
      const rows = await db
        .prepare(
          'SELECT m.date,m.id AS momentId,media.* FROM moments m JOIN media ON media.id=m.mediaId AND media.coupleId=m.coupleId WHERE m.coupleId=? ORDER BY m.date,m.id',
        )
        .all(grant.coupleId);
      res
        .set('Content-Type', 'application/zip')
        .set(
          'Content-Disposition',
          `attachment; filename="Love-album-${new Date().toISOString().slice(0, 10)}.zip"`,
        )
        .set('Cache-Control', 'no-store');
      archive = archiver('zip', { zlib: { level: 0 } });
      archive.on('error', (error) => {
        if (res.headersSent) res.destroy(error);
        else next(error);
      });
      res.on('close', () => archive?.abort());
      archive.pipe(res);
      let index = 0;
      for (const item of rows) {
        const base = `${item.date}-${String(++index).padStart(5, '0')}`;
        if (item.kind !== 'video') {
          const photo = Readable.from(
            (async function* () {
              const data = await mediaRepository.read(
                String(item.kind === 'live' ? item.thumbnail : item.preview),
              );
              yield await sharp(data, { limitInputPixels: false }).jpeg({ quality: 92 }).toBuffer();
            })(),
            { objectMode: false },
          );
          archive.append(photo, { name: `${base}.jpg` });
        }
        if (item.kind === 'video' || item.kind === 'live')
          archive.append(mediaRepository.stream(String(item.preview)), { name: `${base}.mp4` });
      }
      await archive.finalize();
    } catch (error) {
      archive?.abort();
      if (res.headersSent) res.destroy(error as Error);
      else next(error);
    }
  });
}
