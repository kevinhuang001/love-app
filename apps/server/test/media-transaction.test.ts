import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { open, writeFile, symlink, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { setup } from './support.js';
import { commitMedia, syncMediaFiles } from '../src/media-storage.js';
import { CommitUncertainError } from '../src/postgres.js';
import { HttpError } from '../src/errors.js';
import type { DB } from '../src/db.js';

test('disk durability rejects missing, empty and symlink files before any database work', async (t) => {
  const s = await setup(t),
    dir = join(s.dir, 'media');
  await writeFile(join(dir, 'valid.webp'), Buffer.from('file-content'));
  await writeFile(join(dir, 'empty.webp'), Buffer.alloc(0));
  await symlink(join(dir, 'valid.webp'), join(dir, 'link.webp'));
  assert.deepEqual(await syncMediaFiles(dir, ['', 'valid.webp', 'valid.webp']), [0, 12, 12]);
  for (const name of ['empty.webp', 'missing.webp', 'link.webp', '../valid.webp'])
    await assert.rejects(syncMediaFiles(dir, [name]));
});
test('upload disk sync failure and quota insert failure leave no files or billable records', async (t) => {
  const s = await setup(t),
    a = await s.register('disk_a'),
    b = await s.register('disk_b');
  await s.pair(a.token, b.token);
  const pairId = (await s.api(a.token).get('/api/me')).body.couple.id;
  const image = await sharp({
    create: { width: 200, height: 200, channels: 3, background: '#456255' },
  })
    .png()
    .toBuffer();
  const upload = () =>
    request(s.app)
      .post('/api/media')
      .auth(a.token, { type: 'bearer' })
      .attach('file', image, { filename: 'photo.png', contentType: 'image/png' });
  const handle = await open(join(s.dir, 'probe'), 'w');
  const prototype = Object.getPrototypeOf(handle),
    sync = prototype.sync;
  await handle.close();
  let syncCalls = 0;
  const failSync = t.mock.method(prototype, 'sync', async function () {
    syncCalls++;
    throw new Error('ENOSPC: injected disk failure');
  });
  await upload().expect(422);
  failSync.mock.restore();
  assert.equal(syncCalls, 1);
  assert.equal(await s.control.usage(pairId), 0);
  assert.deepEqual(await readdir(join(s.dir, 'media')), ['tmp']);
  const prepare = s.db.prepare.bind(s.db);
  const failInsert = t.mock.method(s.db, 'prepare', (sql: string) => {
    const statement = prepare(sql);
    return sql.startsWith('INSERT INTO media_sizes')
      ? {
          ...statement,
          run: async () => {
            throw new HttpError(503, 'injected storage write failure');
          },
        }
      : statement;
  });
  await upload().expect(503);
  failInsert.mock.restore();
  assert.equal(await s.control.usage(pairId), 0);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM media').get())!.n, 0);
  assert.deepEqual(await readdir(join(s.dir, 'media')), ['tmp']);
  const checkSync = t.mock.method(
    prototype,
    'sync',
    async function (this: Awaited<ReturnType<typeof open>>) {
      assert.equal(await s.control.usage(pairId), 0);
      return sync.call(this);
    },
  );
  const result = await upload().expect(201);
  checkSync.mock.restore();
  const row = (await s.db.prepare('SELECT * FROM media WHERE id=?').get(result.body.id))!;
  const measured = (
    await Promise.all(
      ['original', 'preview', 'thumbnail'].map((key) =>
        s.mediaRepository.info(String(row[key])).then((info) => ({ size: info.bytes })),
      ),
    )
  ).reduce((sum, info) => sum + info.size, 0);
  assert.equal(await s.control.usage(pairId), measured);
});
test('lost COMMIT response reconciles storage proof without executing mutations again', async () => {
  for (const committed of [true, false]) {
    let transactions = 0,
      actions = 0,
      proofs = 0;
    const db = {
      async transaction<T>(action: () => Promise<T>) {
        transactions++;
        const value = await action();
        if (transactions === 1) throw new CommitUncertainError(new Error('connection lost'));
        return value;
      },
    } as DB;
    const result = commitMedia(
      db,
      async () => {
        proofs++;
        return committed;
      },
      async () => {
        actions++;
        return 'media-id';
      },
    );
    if (committed) assert.equal(await result, 'media-id');
    else
      await assert.rejects(
        result,
        (err: HttpError) => err.status === 503 && !(err instanceof CommitUncertainError),
      );
    assert.equal(actions, 1);
    assert.equal(proofs, 1);
    assert.equal(transactions, 2);
  }
  let transactions = 0;
  const uncertain = new CommitUncertainError(new Error('offline'));
  const db = {
    async transaction<T>(action: () => Promise<T>) {
      if (++transactions === 1) {
        await action();
        throw uncertain;
      }
      throw new Error('database still offline');
    },
  } as DB;
  await assert.rejects(
    commitMedia(
      db,
      async () => false,
      async () => 'media-id',
    ),
    (err) => err === uncertain,
  );
});

test('media retries a rolled-back PostgreSQL mutation but never repeats a confirmed commit', async (t) => {
  const before = process.env.PG_RETRY_DELAY_MS;
  process.env.PG_RETRY_DELAY_MS = '0';
  t.after(() => {
    if (before === undefined) delete process.env.PG_RETRY_DELAY_MS;
    else process.env.PG_RETRY_DELAY_MS = before;
  });
  let transactions = 0,
    actions = 0;
  const db = {
    provider: 'postgres',
    async transaction<T>(action: () => Promise<T>) {
      transactions++;
      const result = await action();
      if (transactions < 3) throw Object.assign(new Error('deadlock rollback'), { code: '40P01' });
      return result;
    },
  } as DB;
  assert.equal(
    await commitMedia(
      db,
      async () => false,
      async () => {
        actions++;
        return 'same-id';
      },
    ),
    'same-id',
  );
  assert.equal(actions, 3);
  assert.equal(transactions, 3);
});

test('a real committed upload with a lost acknowledgement returns its original media and bills exactly once', async (t) => {
  const s = await setup(t),
    a = await s.register('ack_a'),
    b = await s.register('ack_b');
  await s.pair(a.token, b.token);
  const pairId = (await s.api(a.token).get('/api/me')).body.couple.id;
  const original = s.db.transaction.bind(s.db);
  let transactions = 0;
  const wrapped = t.mock.method(s.db, 'transaction', async (action: () => Promise<unknown>) => {
    const result = await original(action);
    if (++transactions === 1)
      throw new CommitUncertainError(
        Object.assign(new Error('lost acknowledgement'), { code: 'ECONNRESET' }),
      );
    return result;
  });
  const image = await sharp({
    create: { width: 240, height: 160, channels: 3, background: '#446155' },
  })
    .png()
    .toBuffer();
  const uploaded = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', image, { filename: 'photo.png', contentType: 'image/png' })
    .expect(201);
  wrapped.mock.restore();
  assert.equal(transactions, 2);
  assert.equal(
    (await s.db.prepare('SELECT COUNT(*) n FROM media WHERE coupleId=?').get(pairId))!.n,
    1,
  );
  const sizes = (await s.db
    .prepare('SELECT totalBytes FROM media_sizes WHERE mediaId=?')
    .get(uploaded.body.id))!;
  assert.equal(await s.control.usage(pairId), sizes.totalBytes);
  assert.equal(
    (await readdir(join(s.dir, 'media'))).filter((name) => name !== 'tmp').length,
    s.db.provider === 'postgres' ? 0 : 3,
  );
  await request(s.app).get(uploaded.body.previewUrl).expect(200);
});
