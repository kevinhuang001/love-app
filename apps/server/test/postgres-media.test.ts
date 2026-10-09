import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { setup } from './support.js';
import { createApp } from '../src/app.js';
import { MEDIA_CHUNK_BYTES } from '../src/media-repository.js';
import { PostgresUnavailableError } from '../src/postgres.js';

const pgOnly = { skip: !process.env.TEST_DATABASE_URL };
test(
  'PostgreSQL stores complete binary media transactionally, retries lost chunk acknowledgements and serves cross-chunk ranges',
  pgOnly,
  async (t) => {
    const s = await setup(t),
      a = await s.register('blob_a'),
      b = await s.register('blob_b');
    await s.pair(a.token, b.token);
    const pairId = (await s.api(a.token).get('/api/me')).body.couple.id;
    const image = await sharp(randomBytes(1600 * 1600 * 3), {
      raw: { width: 1600, height: 1600, channels: 3 },
    })
      .png()
      .toBuffer();
    const prepare = s.db.prepare.bind(s.db);
    let interrupted = false;
    const mock = t.mock.method(s.db, 'prepare', (sql: string) => {
      const statement = prepare(sql);
      if (!sql.startsWith('WITH saved AS')) return statement;
      return {
        ...statement,
        run: async (...values: unknown[]) => {
          assert.equal(
            await s.control.usage(pairId),
            0,
            'staged bytes must not be billed before final commit',
          );
          const value = await statement.run(...values);
          if (!interrupted) {
            interrupted = true;
            throw new PostgresUnavailableError(
              Object.assign(new Error('lost chunk ACK'), { code: 'ECONNRESET' }),
            );
          }
          return value;
        },
      };
    });
    const uploaded = await request(s.app)
      .post('/api/media')
      .auth(a.token, { type: 'bearer' })
      .attach('file', image, { filename: 'random.png', contentType: 'image/png' })
      .expect(201);
    mock.mock.restore();
    assert.equal(interrupted, true);
    assert.equal(await s.control.usage(pairId), 0);
    await s
      .api(a.token)
      .post('/api/moments', { mediaId: uploaded.body.id, title: 'published', date: '2026-10-09' })
      .expect(201);
    const row = (await s.db.prepare('SELECT * FROM media WHERE id=?').get(uploaded.body.id))!;
    assert.deepEqual(await s.mediaRepository.read(String(row.original)), image);
    assert.equal((await readdir(join(s.dir, 'media'))).filter((name) => name !== 'tmp').length, 0);
    assert.equal(
      (await s.db.prepare('SELECT COUNT(*) n FROM media_files WHERE mediaId=?').get(row.id))!.n,
      3,
    );
    const total = (await s.db
      .prepare('SELECT SUM(bytes) n FROM media_files WHERE mediaId=?')
      .get(row.id))!.n;
    assert.equal(await s.control.usage(pairId), total);
    const preview = await s.mediaRepository.read(String(row.preview));
    assert.ok(preview.length > MEDIA_CHUNK_BYTES, 'fixture must span multiple database chunks');
    const start = MEDIA_CHUNK_BYTES - 31,
      end = MEDIA_CHUNK_BYTES + 37;
    const range = await request(s.app)
      .get(uploaded.body.previewUrl)
      .set('Range', `bytes=${start}-${end}`)
      .expect(206);
    assert.equal(range.headers['content-range'], `bytes ${start}-${end}/${preview.length}`);
    assert.deepEqual(range.body, preview.subarray(start, end + 1));
    const suffix = await request(s.app)
      .get(uploaded.body.previewUrl)
      .set('Range', 'bytes=-17')
      .expect(206);
    assert.deepEqual(suffix.body, preview.subarray(-17));
    await request(s.app)
      .get(uploaded.body.previewUrl)
      .set('Range', `bytes=${preview.length}-`)
      .expect(416);
    const head = await request(s.app).head(uploaded.body.previewUrl).expect(200);
    assert.equal(Number(head.headers['content-length']), preview.length);
    assert.equal(
      (await s.mediaRepository.info(String(row.original))).sha256,
      createHash('sha256').update(image).digest('hex'),
    );
    // Replacing a personal avatar removes its old chunks through FK cascades.
    const avatar = async () =>
      (
        await request(s.app)
          .post('/api/me/avatar')
          .auth(a.token, { type: 'bearer' })
          .attach('file', image, { filename: 'avatar.png', contentType: 'image/png' })
          .expect(201)
      ).body;
    const old = await avatar(),
      fresh = await avatar();
    assert.notEqual(old.id, fresh.id);
    assert.equal(
      (await s.db.prepare('SELECT COUNT(*) n FROM media_files WHERE mediaId=?').get(old.id))!.n,
      0,
    );
    assert.equal(
      (await s.db.prepare('SELECT COUNT(*) n FROM media_files WHERE mediaId=?').get(fresh.id))!.n,
      2,
    );
    assert.equal(await s.control.usage(pairId), total, 'personal avatars are outside pair quota');
    // An empty media volume and a fresh app instance recover everything from PostgreSQL.
    await rm(join(s.dir, 'media'), { recursive: true, force: true });
    const schema = (await s.db.prepare('SELECT current_schema() value').get())!.value as string;
    const reopened = await createApp({
      database: process.env.TEST_DATABASE_URL,
      databaseSchema: schema,
      uploads: join(s.dir, 'empty-media'),
      mediaSecret: 'test-secret-at-least-thirty-two-chars',
      adminCredentials: { username: 'admin_master', password: 'admin-test-password-123' },
    });
    try {
      await reopened.control.bootstrap;
      await request(reopened.app).get(uploaded.body.previewUrl).expect(200);
      await request(reopened.app).get(fresh.previewUrl).expect(200);
      assert.deepEqual(await readdir(join(s.dir, 'empty-media')), ['tmp']);
      assert.equal(await reopened.control.usage(pairId), total);
    } finally {
      await reopened.close();
    }
  },
);

test(
  'existing PostgreSQL disk media migrates all variants atomically and deletes source files only after commit',
  pgOnly,
  async (t) => {
    const s = await setup(t),
      a = await s.register('migrate_a'),
      b = await s.register('migrate_b');
    await s.pair(a.token, b.token);
    const image = await sharp({
      create: { width: 640, height: 480, channels: 3, background: '#426554' },
    })
      .png()
      .toBuffer();
    const media = (
      await request(s.app)
        .post('/api/media')
        .auth(a.token, { type: 'bearer' })
        .attach('file', image, { filename: 'legacy.png', contentType: 'image/png' })
        .expect(201)
    ).body;
    const row = (await s.db.prepare('SELECT * FROM media WHERE id=?').get(media.id))!;
    const names = [row.original, row.preview, row.thumbnail].map(String),
      data = await Promise.all(names.map((name) => s.mediaRepository.read(name)));
    await s.db.prepare('DELETE FROM media_files WHERE mediaId=?').run(media.id);
    for (let i = 0; i < names.length; i++) await writeFile(join(s.dir, 'media', names[i]), data[i]);
    const prepare = s.db.prepare.bind(s.db);
    let writes = 0;
    const mock = t.mock.method(s.db, 'prepare', (sql: string) => {
      const statement = prepare(sql);
      return sql.startsWith('WITH saved AS')
        ? {
            ...statement,
            run: async (...values: unknown[]) => {
              if (++writes === 2) throw new Error('injected migration failure');
              return statement.run(...values);
            },
          }
        : statement;
    });
    await assert.rejects(s.mediaRepository.migrate(), /injected migration failure/);
    mock.mock.restore();
    assert.equal(
      (await s.db.prepare('SELECT COUNT(*) n FROM media_files WHERE mediaId=?').get(media.id))!.n,
      0,
    );
    for (const name of names) assert.ok((await readdir(join(s.dir, 'media'))).includes(name));
    await s.mediaRepository.migrate();
    for (let i = 0; i < names.length; i++)
      assert.deepEqual(await s.mediaRepository.read(names[i]), data[i]);
    assert.deepEqual(await readdir(join(s.dir, 'media')), ['tmp']);
    await request(s.app).get(media.previewUrl).expect(200);
  },
);
