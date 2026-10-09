import { createReadStream } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { registerMediaDirectory } from './media-drafts.js';
import type { DB } from './db.js';
import { HttpError } from './errors.js';
import { commitMedia, removeMediaFiles, syncMediaFiles } from './media-storage.js';
import { isTransientPostgresError, postgresSettings } from './postgres.js';

export const MEDIA_CHUNK_BYTES = 1024 * 1024;
export const postgresMediaSchema = `
CREATE TABLE IF NOT EXISTS media_files(
  name TEXT PRIMARY KEY, "mediaId" TEXT REFERENCES media(id) ON DELETE CASCADE,
  bytes BIGINT NOT NULL CHECK(bytes>0), sha256 TEXT NOT NULL,
  complete BIGINT NOT NULL DEFAULT 0 CHECK(complete IN (0,1)), "updatedAt" TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS media_files_owner ON media_files("mediaId");
CREATE TABLE IF NOT EXISTS media_chunks(
  name TEXT NOT NULL REFERENCES media_files(name) ON DELETE CASCADE,
  position BIGINT NOT NULL CHECK(position>=0), data BYTEA NOT NULL,
  PRIMARY KEY(name,position), CHECK(octet_length(data)>0 AND octet_length(data)<=1048576));
ALTER TABLE media_chunks ALTER COLUMN data SET STORAGE EXTERNAL;`;

export class MediaRepository {
  constructor(
    readonly db: DB,
    readonly directory: string,
  ) {
    registerMediaDirectory(db, directory);
  }
  private path(name: string) {
    if (!name || name !== basename(name)) throw new HttpError(500, '媒体文件路径无效');
    return join(this.directory, name);
  }
  // These staging operations are idempotent; retrying lost responses cannot add duplicate chunks.
  private async write(action: () => Promise<unknown>) {
    const settings = postgresSettings();
    for (let attempt = 0; ; attempt++) {
      try {
        return await action();
      } catch (error) {
        if (!isTransientPostgresError(error) || attempt + 1 >= settings.attempts) throw error;
        await delay(Math.min(settings.retryDelay * 2 ** attempt, 60000));
      }
    }
  }
  async stage(names: string[], sizes: number[], transactional = false, signal?: AbortSignal) {
    const write = (action: () => Promise<unknown>) => {
      signal?.throwIfAborted();
      return transactional
        ? action()
        : this.write(async () => {
            signal?.throwIfAborted();
            return action();
          });
    };
    if (this.db.provider !== 'postgres') return;
    for (const [i, name] of names.entries()) {
      if (!name || names.indexOf(name) !== i) continue;
      const file = await open(this.path(name), 'r');
      try {
        await write(() =>
          this.db
            .prepare(
              'INSERT INTO media_files(name,bytes,sha256,complete,updatedAt) VALUES(?,?,?,0,?) ON CONFLICT(name) DO NOTHING',
            )
            .run(name, sizes[i], '', new Date().toISOString()),
        );
        const existing = await this.db
          .prepare('SELECT mediaId,complete,bytes FROM media_files WHERE name=?')
          .get(name);
        if (existing?.mediaId || existing?.complete) throw new HttpError(409, '媒体文件编号已存在');
        const hash = createHash('sha256');
        let position = 0,
          total = 0;
        const buffer = Buffer.allocUnsafe(MEDIA_CHUNK_BYTES);
        while (true) {
          signal?.throwIfAborted();
          let length = 0;
          while (length < buffer.length) {
            const part = await file.read(buffer, length, buffer.length - length, total + length);
            if (!part.bytesRead) break;
            length += part.bytesRead;
          }
          if (!length) break;
          const data = Buffer.from(buffer.subarray(0, length));
          hash.update(data);
          const index = position++;
          await write(() =>
            this.db
              .prepare(
                'WITH saved AS (INSERT INTO media_chunks(name,position,data) VALUES(?,?,?) ON CONFLICT(name,position) DO UPDATE SET data=excluded.data RETURNING name) UPDATE media_files SET updatedAt=? WHERE name=?',
              )
              .run(name, index, data, new Date().toISOString(), name),
          );
          total += length;
        }
        if (total !== sizes[i] || (await file.stat()).size !== total)
          throw new HttpError(422, '媒体写入不完整，未计入容量');
        const digest = hash.digest('hex');
        await write(() =>
          this.db
            .prepare(
              'UPDATE media_files SET sha256=?,complete=1,updatedAt=? WHERE name=? AND mediaId IS NULL',
            )
            .run(digest, new Date().toISOString(), name),
        );
      } finally {
        await file.close();
      }
    }
  }
  // Called in the SAME short transaction as media metadata and quota rows.
  async bind(mediaId: string, names: string[]) {
    if (this.db.provider !== 'postgres') return;
    for (const name of new Set(names.filter(Boolean))) {
      const result = await this.db
        .prepare('UPDATE media_files SET mediaId=? WHERE name=? AND complete=1 AND mediaId IS NULL')
        .run(mediaId, name);
      if (result.changes !== 1) throw new HttpError(503, '媒体未完整写入数据库，上传未提交');
    }
  }
  async discard(names: string[]) {
    if (this.db.provider !== 'postgres') return;
    for (const name of new Set(names.filter(Boolean))) {
      try {
        await this.db.prepare('DELETE FROM media_files WHERE name=? AND mediaId IS NULL').run(name);
      } catch {
        console.error('Uncommitted database media cleanup deferred');
      }
    }
  }
  async info(name: string, draft = false): Promise<{ bytes: number; sha256?: string }> {
    this.path(name);
    if (this.db.provider === 'sqlite') return { bytes: (await stat(this.path(name))).size };
    const row = await this.db
      .prepare(
        'SELECT bytes,sha256 FROM media_files WHERE name=? AND complete=1' +
          (draft ? '' : ' AND mediaId IS NOT NULL'),
      )
      .get(name);
    if (!row) throw new HttpError(404, '媒体内容不存在');
    return { bytes: Number(row.bytes), sha256: String(row.sha256) };
  }
  stream(name: string, start = 0, end?: number, draft = false): Readable {
    this.path(name);
    if (this.db.provider === 'sqlite')
      return createReadStream(this.path(name), { start, ...(end !== undefined ? { end } : {}) });
    const db = this.db,
      repository = this;
    return Readable.from(
      (async function* () {
        const size = (await repository.info(name, draft)).bytes,
          last = end ?? size - 1;
        if (start < 0 || last >= size || last < start) throw new HttpError(416, '媒体读取范围无效');
        const firstChunk = Math.floor(start / MEDIA_CHUNK_BYTES),
          lastChunk = Math.floor(last / MEDIA_CHUNK_BYTES);
        for (let position = firstChunk; position <= lastChunk; position++) {
          const row = await db
            .prepare('SELECT data FROM media_chunks WHERE name=? AND position=?')
            .get(name, position);
          const data = row?.data as unknown as Buffer;
          if (!Buffer.isBuffer(data)) throw new HttpError(500, '媒体内容不完整');
          const expected = Math.min(MEDIA_CHUNK_BYTES, size - position * MEDIA_CHUNK_BYTES);
          if (data.length !== expected) throw new HttpError(500, '媒体分块大小无效');
          yield data.subarray(
            Math.max(0, start - position * MEDIA_CHUNK_BYTES),
            Math.min(data.length, last - position * MEDIA_CHUNK_BYTES + 1),
          );
        }
      })(),
      { objectMode: false },
    );
  }
  async read(name: string) {
    const parts: Buffer[] = [];
    for await (const part of this.stream(name)) parts.push(Buffer.from(part));
    return Buffer.concat(parts);
  }
  async digest(name: string) {
    const info = await this.info(name);
    if (info.sha256) return { ...info, sha256: info.sha256 };
    const hash = createHash('sha256');
    for await (const part of this.stream(name)) hash.update(part);
    return { ...info, sha256: hash.digest('hex') };
  }
  async migrate() {
    if (this.db.provider !== 'postgres') return;
    // Stale unbound chunks have no quota rows or public media references. Active uploads
    // refresh their lease each chunk; startup never deletes recently staged data.
    await this.db
      .prepare('DELETE FROM media_files WHERE mediaId IS NULL AND updatedAt<?')
      .run(new Date(Date.now() - 86400000).toISOString());
    let after = '';
    while (true) {
      const rows = await this.db
        .prepare('SELECT id,original,preview,thumbnail FROM media WHERE id>? ORDER BY id LIMIT 50')
        .all(after);
      if (!rows.length) break;
      for (const row of rows) {
        const names = [
          ...new Set([row.original, row.preview, row.thumbnail].filter(Boolean).map(String)),
        ];
        const complete = async () => {
          for (const name of names) {
            const saved = await this.db
              .prepare('SELECT bytes FROM media_files WHERE name=? AND mediaId=? AND complete=1')
              .get(name, row.id);
            if (!saved) return false;
          }
          return true;
        };
        if (!(await complete()))
          await commitMedia(this.db, complete, async () => {
            // Serialize upgrade across app instances. Files are kept until all variants commit.
            if (await complete()) return;
            for (const name of names) {
              const saved = await this.db
                .prepare('SELECT mediaId,complete FROM media_files WHERE name=?')
                .get(name);
              if (saved?.mediaId === row.id && saved.complete) continue;
              await this.db
                .prepare('DELETE FROM media_files WHERE name=? AND mediaId IS NULL')
                .run(name);
              const [size] = await syncMediaFiles(this.directory, [name]);
              await this.stage([name], [size], true);
              await this.bind(String(row.id), [name]);
            }
          });
        await removeMediaFiles(names.map((name) => this.path(name)));
      }
      after = String(rows.at(-1)!.id);
    }
  }
}
