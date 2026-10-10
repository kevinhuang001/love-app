import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { setup } from './support.js';
import { motionVideoLength } from '../../apps/server/src/motion-photo.js';

const binary = (res: NodeJS.ReadableStream, done: (error: Error | null, body?: Buffer) => void) => {
  const parts: Buffer[] = [];
  res.on('data', (p) => parts.push(Buffer.from(p)));
  res.on('end', () => done(null, Buffer.concat(parts)));
  res.on('error', done);
};
test('Motion Photo metadata recognizes standard and legacy exports and rejects invalid offsets', () => {
  assert.equal(
    motionVideoLength(
      '<Container:Item Item:Semantic="MotionPhoto" Item:Mime="video/mp4" Item:Length="1234"/>',
    ),
    1234,
  );
  assert.equal(motionVideoLength('<rdf:Description GCamera:MicroVideoOffset="4321"/>'), 4321);
  assert.equal(
    motionVideoLength('<rdf:Description Camera:MotionPhoto="0" Camera:MicroVideoOffset="4321"/>'),
    null,
  );
  assert.equal(
    motionVideoLength('<rdf:Description Camera:MicroVideoOffset="9007199254740993"/>'),
    null,
  );
});
test('Android embedded video and Apple paired originals retain playback, quotas and portable exports', async (t) => {
  const s = await setup(t),
    a = await s.register('livealice'),
    b = await s.register('livebob');
  await s.pair(a.token, b.token);
  const videoPath = join(s.dir, 'sample.mov');
  assert.equal(
    spawnSync('ffmpeg', [
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=green:s=160x120:d=1',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      videoPath,
    ]).status,
    0,
  );
  const mov = await readFile(videoPath);
  const mp4Path = join(s.dir, 'sample.mp4');
  assert.equal(
    spawnSync('ffmpeg', ['-nostdin', '-y', '-i', videoPath, '-c', 'copy', mp4Path]).status,
    0,
  );
  const mp4 = await readFile(mp4Path);
  const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:Camera="http://ns.google.com/photos/1.0/camera/" xmlns:Item="http://ns.google.com/photos/1.0/container/item/" Camera:MotionPhoto="1"><Container:Item xmlns:Container="http://ns.google.com/photos/1.0/container/" Item:Semantic="MotionPhoto" Item:Mime="video/mp4" Item:Length="${mp4.length}" /></rdf:Description></rdf:RDF></x:xmpmeta>`;
  const photo = await sharp({
    create: { width: 600, height: 400, channels: 3, background: '#245347' },
  })
    .withExif({ IFD2: { DateTimeOriginal: '2025:06:15 12:00:00' } })
    .withXmp(xmp)
    .jpeg()
    .toBuffer();
  const uploads = [];
  for (const mode of ['android', 'apple', 'heic']) {
    const apple = mode !== 'android';
    const heic = mode === 'heic';
    if (heic)
      await s
        .api(a.token)
        .patch('/api/couple/media-settings', { retainOriginal: false })
        .expect(200);
    const upload = request(s.app)
      .post('/api/media')
      .auth(a.token, { type: 'bearer' })
      .attach(
        'file',
        heic
          ? await readFile(new URL('../fixtures/live-photo.heic', import.meta.url))
          : apple
            ? photo
            : Buffer.concat([photo, mp4]),
        {
          filename: heic ? 'IMG_0001.heic' : 'IMG_0001.jpg',
          contentType: heic ? 'image/heic' : 'image/jpeg',
        },
      );
    if (apple)
      upload.attach('liveVideo', mov, { filename: 'IMG_0001.mov', contentType: 'video/quicktime' });
    const media = (await upload.expect(201)).body;
    uploads.push(media);
    assert.equal(media.kind, 'live');
    assert.equal(media.capturedDate, heic ? null : '2025-06-15');
    if (heic) {
      assert.equal(media.width, 64);
      assert.equal(media.height, 48);
    }
    const still = await request(s.app).get(media.previewUrl).expect(200);
    assert.equal((await sharp(still.body).metadata()).format, 'webp');
    await request(s.app).get(media.motionUrl).set('Range', 'bytes=0-99').expect(206);
    await s
      .api(a.token)
      .post('/api/moments', {
        mediaId: media.id,
        title: apple ? 'Apple' : 'Android',
        date: '2025-06-15',
      })
      .expect(201);
  }
  const album = (await s.api(b.token).get('/api/moments?type=image')).body;
  assert.equal(album.total, 3);
  await s
    .api(b.token)
    .patch(`/api/moments/${album.items[0].id}`, { title: 'partner edit', date: '2025-06-15' })
    .expect(204);
  const exported = (await s.api(a.token).post('/api/album/exports', {}).expect(200)).body;
  const archive = await request(s.app).get(exported.url).buffer(true).parse(binary).expect(200);
  assert.equal(archive.body.subarray(0, 2).toString(), 'PK');
  await s.api(b.token).post('/api/album/imports', {}).expect(404);
  assert.equal(
    (await readdir(join(s.dir, 'media'))).some(
      (n) => n.includes('motion-input') || n.includes('paired-source'),
    ),
    false,
  );
});
