import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { setup } from './support.js';

test('media retention belongs to the pair, rejects unpaired access and starts fresh after re-pairing', async (t) => {
  const s = await setup(t);
  const a = await s.register('retaina'),
    b = await s.register('retainb');
  const c = await s.register('retainc'),
    d = await s.register('retaind');
  await s.api(a.token).patch('/api/couple/media-settings', { retainOriginal: false }).expect(409);
  await s.pair(a.token, b.token);
  await s.pair(c.token, d.token);
  assert.equal((await s.api(b.token).get('/api/me')).body.couple.retainOriginal, true);
  await s.api(a.token).patch('/api/couple/media-settings', { retainOriginal: false }).expect(200);
  assert.equal((await s.api(b.token).get('/api/me')).body.couple.retainOriginal, false);
  assert.equal((await s.api(c.token).get('/api/me')).body.couple.retainOriginal, true);
  await s.api(b.token).patch('/api/couple/media-settings', { retainOriginal: 'false' }).expect(400);
  await s
    .api(b.token)
    .patch('/api/couple/media-settings', { retainOriginal: true, coupleId: 'other' })
    .expect(400);
  await s.api(b.token).patch('/api/couple/media-settings', { retainOriginal: true }).expect(200);
  assert.equal((await s.api(a.token).get('/api/me')).body.couple.retainOriginal, true);
  await s.api(a.token).patch('/api/couple/media-settings', { retainOriginal: false }).expect(200);
  await s.api(a.token).delete('/api/pairing').expect(204);
  await s.pair(a.token, b.token);
  assert.equal((await s.api(a.token).get('/api/me')).body.couple.retainOriginal, true);
});

test('compressed-only images and videos retain capture dates, previews, playback and accurate quotas without source files', async (t) => {
  const s = await setup(t);
  const a = await s.register('compressed'),
    b = await s.register('compact');
  await s.pair(a.token, b.token);
  await s.api(b.token).patch('/api/couple/media-settings', { retainOriginal: false }).expect(200);
  const photo = await sharp({
    create: { width: 2400, height: 1600, channels: 3, background: '#47665b' },
  })
    .withExif({ IFD2: { DateTimeOriginal: '2024:02:29 12:13:14' } })
    .jpeg()
    .toBuffer();
  const image = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', photo, { filename: 'camera.jpg', contentType: 'image/jpeg' })
    .expect(201);
  assert.equal(image.body.capturedDate, '2024-02-29');
  const preview = await request(s.app).get(image.body.previewUrl).expect(200);
  const info = await sharp(preview.body).metadata();
  assert.equal(info.format, 'webp');
  assert.ok(info.width! <= 1600);
  await request(s.app).get(image.body.thumbnailUrl).expect(200);
  const videoPath = join(s.dir, 'capture.mp4');
  assert.equal(
    spawnSync('ffmpeg', [
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=blue:s=640x360:d=1',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-metadata',
      'creation_time=2024-02-29T16:05:00Z',
      videoPath,
    ]).status,
    0,
  );
  const video = await request(s.app)
    .post('/api/media')
    .auth(b.token, { type: 'bearer' })
    .attach('file', await readFile(videoPath), { filename: 'camera.mp4', contentType: 'video/mp4' })
    .expect(201);
  assert.equal(video.body.capturedDate, '2024-03-01');
  const range = await request(s.app)
    .get(video.body.previewUrl)
    .set('Range', 'bytes=0-99')
    .expect(206);
  assert.match(range.headers['content-type'], /video\/mp4/);
  await request(s.app).get(video.body.thumbnailUrl).expect(200);
  let actualBytes = 0;
  for (const id of [image.body.id, video.body.id]) {
    const row = (await s.db.prepare('SELECT * FROM media WHERE id=?').get(id))!;
    const sizes = (await s.db.prepare('SELECT * FROM media_sizes WHERE mediaId=?').get(id))!;
    assert.equal(row.original, '');
    assert.equal(sizes.originalBytes, 0);
    const previewBytes = (
      await s.mediaRepository.info(String(row.preview)).then((info) => ({ size: info.bytes }))
    ).size;
    const thumbnailBytes = (
      await s.mediaRepository.info(String(row.thumbnail)).then((info) => ({ size: info.bytes }))
    ).size;
    assert.equal(sizes.totalBytes, previewBytes + thumbnailBytes);
    actualBytes += previewBytes + thumbnailBytes;
  }
  assert.equal(
    (await readdir(join(s.dir, 'media'))).filter((name) => name.endsWith('.source')).length,
    0,
  );
  assert.equal((await readdir(join(s.dir, 'media', 'tmp'))).length, 0);
  assert.equal((await s.api(a.token).get('/api/me')).body.couple.storageBytes, actualBytes);
  await s.api(a.token).patch('/api/couple/media-settings', { retainOriginal: true }).expect(200);
  const retained = await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', photo, { filename: 'retained.jpg', contentType: 'image/jpeg' })
    .expect(201);
  const source = (await s.db
    .prepare('SELECT original FROM media WHERE id=?')
    .get(retained.body.id))!;
  assert.deepEqual(await s.mediaRepository.read(String(source.original)), photo);
  await request(s.app)
    .post('/api/media')
    .auth(a.token, { type: 'bearer' })
    .attach('file', Buffer.from('not an image'), {
      filename: 'broken.jpg',
      contentType: 'image/jpeg',
    })
    .expect(422);
  assert.equal((await readdir(join(s.dir, 'media', 'tmp'))).length, 0);
});
