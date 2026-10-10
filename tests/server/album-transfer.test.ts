import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import archiver from 'archiver';
import yauzl from 'yauzl';
import { readdir, readFile, stat, writeFile, truncate } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { setup } from './support.js';
const binary = (
  response: NodeJS.ReadableStream,
  done: (error: Error | null, body?: Buffer) => void,
) => {
  const chunks: Buffer[] = [];
  response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  response.on('end', () => done(null, Buffer.concat(chunks)));
  response.on('error', done);
};
async function unzip(buffer: Buffer) {
  return new Promise<Map<string, Buffer>>((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error) return reject(error);
      const output = new Map<string, Buffer>();
      zip!.on('error', reject);
      zip!.on('end', () => resolve(output));
      zip!.on('entry', (entry) =>
        zip!.openReadStream(entry, (error, stream) => {
          if (error) return reject(error);
          const chunks: Buffer[] = [];
          stream!.on('data', (chunk) => chunks.push(chunk));
          stream!.on('error', reject);
          stream!.on('end', () => {
            output.set(entry.fileName, Buffer.concat(chunks));
            zip!.readEntry();
          });
        }),
      );
      zip!.readEntry();
    });
  });
}
async function zip(files: Map<string, Buffer>) {
  const output = archiver('zip', { store: true }),
    chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    output.on('data', (chunk) => chunks.push(chunk));
    output.on('end', () => resolve(Buffer.concat(chunks)));
    output.on('error', reject);
  });
  for (const [name, data] of files) output.append(data, { name });
  await output.finalize();
  return complete;
}
test('photo ZIP is portable JPEG; full ZIP round-trips dates, descriptions, video and originals, obeys pair policy and is idempotent', async (t) => {
  const s = await setup(t),
    a = await s.register('album_a'),
    b = await s.register('album_b'),
    c = await s.register('album_c'),
    d = await s.register('album_d');
  await s.api(a.token).post('/api/album/exports', { format: 'archive' }).expect(409);
  await request(s.app).post('/api/album/exports').send({ format: 'archive' }).expect(401);
  await s.pair(a.token, b.token);
  await s.pair(c.token, d.token);
  const photo = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: '#264d40' },
  })
    .jpeg()
    .toBuffer();
  const upload = async (token: string, data: Buffer, filename: string, type: string) =>
    (
      await request(s.app)
        .post('/api/media')
        .auth(token, { type: 'bearer' })
        .attach('file', data, { filename, contentType: type })
        .expect(201)
    ).body;
  const image = await upload(a.token, photo, 'photo.jpg', 'image/jpeg');
  await s
    .api(a.token)
    .post('/api/moments', { title: '同一天的中文描述', mediaId: image.id, date: '2024-02-29' })
    .expect(201);
  await upload(a.token, photo, 'chat-only.jpg', 'image/jpeg'); // Unattached/chat media must not leak into album export.
  const videoPath = join(s.dir, 'sample.mp4');
  assert.equal(
    spawnSync('ffmpeg', [
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=blue:s=320x240:d=1',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      videoPath,
    ]).status,
    0,
  );
  const video = await upload(b.token, await readFile(videoPath), 'movie.mp4', 'video/mp4');
  await s
    .api(b.token)
    .post('/api/moments', { title: '视频回忆', mediaId: video.id, date: '2025-08-17' })
    .expect(201);
  const photoGrant = (
    await s.api(b.token).post('/api/album/exports', { format: 'pictures' }).expect(200)
  ).body;
  const photos = await unzip(
    (await request(s.app).get(photoGrant.url).buffer(true).parse(binary).expect(200)).body,
  );
  assert.equal(photos.size, 1);
  const [name, data] = [...photos][0];
  assert.match(name, /^2024-02-29-\d+\.jpg$/);
  assert.equal((await sharp(data).metadata()).format, 'jpeg');
  const grant = (await s.api(a.token).post('/api/album/exports', { format: 'archive' }).expect(200))
    .body;
  const archive = (await request(s.app).get(grant.url).buffer(true).parse(binary).expect(200))
    .body as Buffer;
  const files = await unzip(archive),
    manifest = JSON.parse(files.get('manifest.json')!.toString());
  assert.equal(manifest.media.length, 2);
  assert.equal(manifest.moments.length, 2);
  assert.ok(manifest.media.every((m: any) => m.original));
  assert.ok(!JSON.stringify(manifest).includes('password'));
  assert.equal(files.size, 7);
  await request(s.app)
    .get(grant.url.replace(/signature=[^&]+/, 'signature=bad'))
    .expect(403);
  const importZip = (token: string, bytes: Buffer) =>
    request(s.app)
      .post('/api/album/imports')
      .auth(token, { type: 'bearer' })
      .attach('file', bytes, { filename: 'album.zip', contentType: 'application/zip' });
  await s.api(c.token).patch('/api/couple/media-settings', { retainOriginal: false }).expect(200);
  const result = await importZip(c.token, archive).expect(201);
  assert.equal(result.body.imported, 2);
  const rows = (await s.api(d.token).get('/api/moments').expect(200)).body.items;
  assert.deepEqual(
    rows.map((row: any) => [row.date, row.title]),
    [
      ['2025-08-17', '视频回忆'],
      ['2024-02-29', '同一天的中文描述'],
    ],
  );
  assert.ok(rows.every((row: any) => row.ownerId === c.user.id));
  let bytes = 0;
  for (const row of rows) {
    const m = (await s.db.prepare('SELECT * FROM media WHERE id=?').get(row.mediaId))!;
    assert.equal(m.original, '');
    const size = (await s.db
      .prepare('SELECT * FROM media_sizes WHERE mediaId=?')
      .get(row.mediaId))!;
    assert.equal(size.originalBytes, 0);
    const actual =
      (await s.mediaRepository.info(String(m.preview)).then((info) => ({ size: info.bytes })))
        .size +
      (await s.mediaRepository.info(String(m.thumbnail)).then((info) => ({ size: info.bytes })))
        .size;
    assert.equal(size.totalBytes, actual);
    bytes += actual;
    await request(s.app).get(row.media.previewUrl).set('Range', 'bytes=0-19').expect(206);
  }
  assert.equal((await s.api(c.token).get('/api/me')).body.couple.storageBytes, bytes);
  const duplicate = await importZip(d.token, archive).expect(200);
  assert.equal(duplicate.body.alreadyImported, true);
  assert.equal(duplicate.body.imported, 0);
  assert.equal((await s.api(d.token).get('/api/moments')).body.total, 2);
  assert.equal((await readdir(join(s.dir, 'media', 'tmp'))).length, 0);
  await s.api(c.token).delete('/api/pairing').expect(204);
  await importZip(c.token, archive).expect(409);
  await s.api(a.token).post('/api/auth/logout', {}).expect(204);
  await request(s.app).get(grant.url).expect(403);
});
test('quota, corrupt hashes, unsafe paths and non-backup ZIPs fail atomically and remove staging files', async (t) => {
  const s = await setup(t),
    a = await s.register('safe_a'),
    b = await s.register('safe_b');
  await s.pair(a.token, b.token);
  const image = (
    await request(s.app)
      .post('/api/media')
      .auth(a.token, { type: 'bearer' })
      .attach(
        'file',
        await sharp({ create: { width: 100, height: 100, channels: 3, background: 'red' } })
          .jpeg()
          .toBuffer(),
        { filename: 'photo.jpg', contentType: 'image/jpeg' },
      )
      .expect(201)
  ).body;
  await s
    .api(a.token)
    .post('/api/moments', { title: '保留', mediaId: image.id, date: '2024-03-01' })
    .expect(201);
  const grant = (await s.api(a.token).post('/api/album/exports', { format: 'archive' })).body;
  const original = (await request(s.app).get(grant.url).buffer(true).parse(binary)).body;
  const files = await unzip(original),
    importZip = (bytes: Buffer) =>
      request(s.app)
        .post('/api/album/imports')
        .auth(b.token, { type: 'bearer' })
        .attach('file', bytes, { filename: 'album.zip', contentType: 'application/zip' });
  const before = (await readdir(join(s.dir, 'media'))).sort();
  const pairId = (await s.api(a.token).get('/api/me')).body.couple.id;
  await s
    .api(s.adminToken)
    .patch(`/api/admin/couples/${pairId}/quota`, { quotaMiB: 0 })
    .expect(204);
  await importZip(original).expect(413);
  await s
    .api(s.adminToken)
    .patch(`/api/admin/couples/${pairId}/quota`, { quotaMiB: 1024 })
    .expect(204);
  const manifest = JSON.parse(files.get('manifest.json')!.toString());
  const preview = manifest.media[0].preview.path;
  const corrupt = new Map(files);
  corrupt.set(preview, Buffer.alloc(files.get(preview)!.length));
  await importZip(await zip(corrupt)).expect(400);
  const unsafe = new Map(files);
  manifest.media[0].preview.path = '../outside';
  unsafe.set('manifest.json', Buffer.from(JSON.stringify(manifest)));
  await importZip(await zip(unsafe)).expect(400);
  await importZip(await zip(new Map([['photo.jpg', Buffer.from('photo')]]))).expect(400);
  assert.equal((await s.api(a.token).get('/api/moments')).body.total, 1);
  assert.equal((await s.db.prepare('SELECT count(*) n FROM album_imports').get())!.n, 0);
  assert.deepEqual((await readdir(join(s.dir, 'media'))).sort(), before);
  assert.equal((await readdir(join(s.dir, 'media', 'tmp'))).length, 0);
});
test('uploads accept pictures beyond former file/pixel caps and video beyond five minutes', async (t) => {
  const s = await setup(t),
    a = await s.register('large_a'),
    b = await s.register('large_b');
  await s.pair(a.token, b.token);
  await s.api(a.token).patch('/api/couple/media-settings', { retainOriginal: false }).expect(200);
  const large = join(s.dir, 'large.jpg');
  await writeFile(
    large,
    await sharp({ create: { width: 7500, height: 7000, channels: 3, background: '#264d40' } })
      .jpeg()
      .toBuffer(),
  );
  await truncate(large, 100 * 1024 * 1024 + 1);
  const photo = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', large, { contentType: 'image/jpeg' })
    .expect(201);
  assert.equal(photo.body.width, 7500);
  assert.equal(photo.body.height, 7000);
  const movie = join(s.dir, 'long.mp4');
  assert.equal(
    spawnSync('ffmpeg', [
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=blue:s=32x32:r=1:d=301',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      movie,
    ]).status,
    0,
  );
  const video = await request(s.app)
    .post('/api/media')
    .auth(b.token, { type: 'bearer' })
    .attach('file', movie, { contentType: 'video/mp4' })
    .expect(201);
  assert.ok(video.body.duration > 300);
  assert.equal((await readdir(join(s.dir, 'media', 'tmp'))).length, 0);
});
