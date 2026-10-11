import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { HttpError } from './errors.js';
export const UPLOAD_CHUNK_BYTES = 1048576;
const partSchema = z
  .object({
    name: z.string().min(1).max(255),
    type: z
      .string()
      .regex(
        /^(image\/(jpeg|png|webp|avif|heic|heif)|video\/(mp4|quicktime|webm|3gpp|x-matroska))$/,
      ),
    size: z
      .number()
      .int()
      .positive()
      .max(20 * 1024 ** 3),
  })
  .strict();
export const uploadSchema = z
  .object({
    id: z.string().uuid(),
    files: z.array(partSchema).min(1).max(2),
    target: z.enum(['album', 'draft', 'avatar', 'ai-avatar']),
    title: z.string().trim().max(300).default(''),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => {
        const d = new Date(v);
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
      })
      .optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.files.length === 1 ||
      (v.files[0].type.startsWith('image/') && v.files[1].type.startsWith('video/')),
    '实况照片需要一张图片和一个视频',
  )
  .refine(
    (v) =>
      !['avatar', 'ai-avatar'].includes(v.target) ||
      (v.files.length === 1 && v.files[0].type.startsWith('image/')),
    '头像请选择图片',
  );
export type UploadSpec = z.infer<typeof uploadSchema>;
const outcomeSchema = z
  .object({
    capturedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    fallbackDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict();
export type UploadProgress = {
  phase: 'processing' | 'database';
  storage: 'sqlite' | 'postgres';
  databaseBytes: number;
  databaseTotal: number;
};
type Saved = UploadSpec & { owner: string; couple: string; updated: number; cancelled?: boolean };
// Only transport staging lives on disk. Publication and billable media stay in one DB transaction.
// Immutable chunks and fsynced manifests survive restarts, including an unavailable remote DB.
export class UploadSessions {
  private locks = new Map<string, Promise<unknown>>();
  private active = new Map<
    string,
    { couple: string; controller: AbortController; progress: UploadProgress }
  >();
  begin(owner: string, couple: string, id: string, storage: UploadProgress['storage']) {
    const controller = new AbortController();
    this.active.set(this.directory(owner, id), {
      couple,
      controller,
      progress: { phase: 'processing', storage, databaseBytes: 0, databaseTotal: 0 },
    });
    return controller.signal;
  }
  progress(owner: string, couple: string, id: string) {
    const entry = this.active.get(this.directory(owner, id));
    if (entry && entry.couple !== couple) throw new HttpError(409, '配对关系已改变');
    return entry ? { ...entry.progress } : undefined;
  }
  phase(owner: string, id: string, patch: Partial<UploadProgress>) {
    const entry = this.active.get(this.directory(owner, id));
    if (entry && !entry.controller.signal.aborted) Object.assign(entry.progress, patch);
  }
  end(owner: string, id: string) {
    this.active.delete(this.directory(owner, id));
  }
  private abort(owner: string, couple: string, id: string) {
    const entry = this.active.get(this.directory(owner, id));
    if (entry && entry.couple !== couple) throw new HttpError(409, '配对关系已改变');
    entry?.controller.abort(new HttpError(410, '上传已取消'));
  }
  async saveCleanup(owner: string, id: string, names: string[]) {
    await this.durable(
      join(this.directory(owner, id), 'cleanup.json'),
      JSON.stringify(names.filter(Boolean)),
    );
  }
  async cleanupNames(owner: string, id: string): Promise<string[]> {
    try {
      return z
        .array(
          z
            .string()
            .regex(
              /^[a-f0-9-]+\.(source|preview\.webp|preview\.mp4|thumb\.webp|avatar\.webp|avatar-thumb\.webp)$/,
            ),
        )
        .parse(JSON.parse(await readFile(join(this.directory(owner, id), 'cleanup.json'), 'utf8')));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }
  constructor(private root: string) {}
  directory(owner: string, id: string) {
    z.string().uuid().parse(id);
    return join(this.root, createHash('sha256').update(owner).digest('hex'), id);
  }
  private async serial<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prior = this.locks.get(key) || Promise.resolve();
    const next = prior.catch(() => {}).then(fn);
    this.locks.set(key, next);
    try {
      return await next;
    } finally {
      if (this.locks.get(key) === next) this.locks.delete(key);
    }
  }
  locked<T>(owner: string, id: string, fn: () => Promise<T>) {
    return this.serial(this.directory(owner, id), fn);
  }
  async durable(path: string, bytes: Buffer | string) {
    const temp = path + '.' + randomUUID(),
      file = await open(temp, 'wx', 0o600);
    try {
      await file.writeFile(bytes);
      await file.sync();
    } finally {
      await file.close();
    }
    try {
      await rename(temp, path);
      const d = await open(join(path, '..'), 'r');
      try {
        await d.sync();
      } finally {
        await d.close();
      }
    } finally {
      await rm(temp, { force: true });
    }
  }
  async get(owner: string, couple: string, id: string): Promise<Saved> {
    let saved: Saved;
    try {
      saved = JSON.parse(await readFile(join(this.directory(owner, id), 'session.json'), 'utf8'));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT')
        throw new HttpError(404, '上传任务不存在或已过期，请重新上传');
      throw e;
    }
    if (saved.owner !== owner || saved.couple !== couple)
      throw new HttpError(409, '账号或配对状态已改变');
    if (saved.cancelled) throw new HttpError(410, '上传任务已取消');
    return saved;
  }
  async create(owner: string, couple: string, spec: UploadSpec, quota: number) {
    return this.serial(createHash('sha256').update(owner).digest('hex') + ':create', () =>
      this.locked(owner, spec.id, async () => {
        const directory = this.directory(owner, spec.id);
        await mkdir(directory, { recursive: true });
        try {
          const old = await this.get(owner, couple, spec.id);
          const { owner: _o, couple: _c, updated: _u, cancelled: _x, ...identity } = old;
          if (JSON.stringify(identity) !== JSON.stringify(spec))
            throw new HttpError(409, '上传任务编号冲突');
          return this.status(old);
        } catch (e) {
          if (!(e instanceof HttpError) || e.status !== 404) throw e;
        }
        const parent = join(directory, '..');
        let reserved = 0,
          count = 0;
        for (const name of await readdir(parent)) {
          try {
            const s = JSON.parse(
              await readFile(join(parent, name, 'session.json'), 'utf8'),
            ) as Saved;
            if (Date.now() - s.updated >= 7 * 86400000) {
              await rm(join(parent, name), { recursive: true, force: true });
              continue;
            }
            if (!s.cancelled) {
              reserved += s.files.reduce((n, f) => n + f.size, 0);
              count++;
            }
          } catch {}
        }
        if (
          count >= 100 ||
          reserved + spec.files.reduce((n, f) => n + f.size, 0) > Math.max(quota, 64 * 1024 ** 2)
        )
          throw new HttpError(413, '待上传文件超出空间容量，请先处理现有任务');
        const saved = { ...spec, owner, couple, updated: Date.now() };
        await this.durable(join(directory, 'session.json'), JSON.stringify(saved));
        return this.status(saved);
      }),
    );
  }
  async status(saved: Saved) {
    const offsets: number[] = [];
    for (let part = 0; part < saved.files.length; part++) {
      let offset = 0;
      for (let index = 0; offset < saved.files[part].size; index++) {
        try {
          const info = await stat(join(this.directory(saved.owner, saved.id), `${part}-${index}`));
          const expected = Math.min(UPLOAD_CHUNK_BYTES, saved.files[part].size - offset);
          if (info.size !== expected) break;
          offset += expected;
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') break;
          throw e;
        }
      }
      offsets.push(offset);
    }
    return { id: saved.id, offsets, chunkBytes: UPLOAD_CHUNK_BYTES };
  }
  async chunk(
    owner: string,
    couple: string,
    id: string,
    part: number,
    index: number,
    bytes: Buffer,
    digest: string,
  ) {
    return this.locked(owner, id, async () => {
      if (!Buffer.isBuffer(bytes)) throw new HttpError(400, '请选择二进制上传分片');
      const saved = await this.get(owner, couple, id),
        file = saved.files[part];
      if (
        !file ||
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index * UPLOAD_CHUNK_BYTES >= file.size ||
        bytes.length !== Math.min(UPLOAD_CHUNK_BYTES, file.size - index * UPLOAD_CHUNK_BYTES)
      )
        throw new HttpError(422, '上传分片大小无效');
      if (
        !/^[a-f0-9]{64}$/.test(digest) ||
        createHash('sha256').update(bytes).digest('hex') !== digest
      )
        throw new HttpError(422, '上传分片校验失败');
      const path = join(this.directory(owner, id), `${part}-${index}`);
      try {
        if (
          createHash('sha256')
            .update(await readFile(path))
            .digest('hex') !== digest
        )
          throw new HttpError(409, '上传分片冲突');
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        await this.durable(path, bytes);
      }
      saved.updated = Date.now();
      await this.durable(join(this.directory(owner, id), 'session.json'), JSON.stringify(saved));
      return { id, index, bytes: bytes.length };
    });
  }
  async assemble(saved: Saved, signal?: AbortSignal): Promise<string[]> {
    const status = await this.status(saved);
    if (status.offsets.some((n, i) => n !== saved.files[i].size))
      throw new HttpError(409, '文件尚未上传完整');
    const result: string[] = [];
    try {
      for (let part = 0; part < saved.files.length; part++) {
        const path = join(this.directory(saved.owner, saved.id), 'input-' + randomUUID());
        result.push(path);
        const output = await open(path, 'wx', 0o600);
        try {
          for (
            let offset = 0, index = 0;
            offset < saved.files[part].size;
            offset += UPLOAD_CHUNK_BYTES, index++
          ) {
            signal?.throwIfAborted();
            await output.writeFile(
              await readFile(join(this.directory(saved.owner, saved.id), `${part}-${index}`)),
            );
          }
          await output.sync();
        } finally {
          await output.close();
        }
      }
      return result;
    } catch (e) {
      await Promise.all(result.map((p) => rm(p, { force: true })));
      throw e;
    }
  }
  async saveOutcome(owner: string, id: string, outcome: z.infer<typeof outcomeSchema>) {
    await this.durable(
      join(this.directory(owner, id), 'result.json'),
      JSON.stringify(outcomeSchema.parse(outcome)),
    );
  }
  async outcome(owner: string, id: string) {
    try {
      return outcomeSchema.parse(
        JSON.parse(await readFile(join(this.directory(owner, id), 'result.json'), 'utf8')),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }
  async release(owner: string, id: string) {
    const directory = this.directory(owner, id);
    try {
      // Retain a small receipt for seven days so lost responses/restarts preserve date notices.
      // It is returned only after the database proves this upload was committed.
      for (const name of await readdir(directory))
        if (name !== 'result.json') await rm(join(directory, name), { force: true });
      if (!(await this.outcome(owner, id))) await rm(directory, { recursive: true, force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  async cancel(
    owner: string,
    couple: string,
    id: string,
    committed: () => Promise<boolean>,
    clean: (names: string[]) => Promise<void> = async () => {},
  ) {
    this.abort(owner, couple, id);
    return this.locked(owner, id, async () => {
      if (await committed()) throw new HttpError(409, '上传已提交，不能取消；可在对应内容中操作');
      let saved: Saved;
      try {
        saved = await this.get(owner, couple, id);
      } catch (error) {
        if (error instanceof HttpError && error.status === 410) return;
        if (!(error instanceof HttpError) || error.status !== 404) throw error;
        saved = { id, owner, couple, updated: Date.now(), files: [], target: 'draft', title: '' };
        await mkdir(this.directory(owner, id), { recursive: true });
      }
      // Keep cleanup manifest and chunks until every deletion is acknowledged.
      await clean(await this.cleanupNames(owner, id));
      saved.cancelled = true;
      saved.updated = Date.now();
      await this.durable(join(this.directory(owner, id), 'session.json'), JSON.stringify(saved));
      for (const name of await readdir(this.directory(owner, id)))
        if (name !== 'session.json')
          await rm(join(this.directory(owner, id), name), { force: true });
    });
  }
  async cleanup() {
    await mkdir(this.root, { recursive: true });
    for (const owner of await readdir(this.root))
      for (const id of await readdir(join(this.root, owner))) {
        const path = join(this.root, owner, id);
        if (Date.now() - (await stat(path)).mtimeMs > 7 * 86400000)
          await rm(path, { recursive: true, force: true });
      }
  }
}
