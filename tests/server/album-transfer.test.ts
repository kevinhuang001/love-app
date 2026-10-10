import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import yauzl from 'yauzl';
import { readFile } from 'node:fs/promises';
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
test('album exports only portable photos and videos; grants require a current paired session; import API is removed', async (t) => {
  const s = await setup(t),
    a = await s.register('zipalice'),
    b = await s.register('zipbob');
  await s.api(a.token).post('/api/album/exports', {}).expect(409);
  await request(s.app).post('/api/album/exports').send({}).expect(401);
  await s.pair(a.token, b.token);
  const photo = await sharp({
    create: { width: 400, height: 300, channels: 3, background: '#395f50' },
  })
    .jpeg()
    .toBuffer();
  const videoPath = join(s.dir, 'video.mp4');
  assert.equal(
    spawnSync('ffmpeg', [
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=blue:s=160x120:d=1',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      videoPath,
    ]).status,
    0,
  );
  for (const [name, contentType, data] of [
    ['photo.jpg', 'image/jpeg', photo],
    ['video.mp4', 'video/mp4', await readFile(videoPath)],
  ] as const) {
    const media = (
      await request(s.app)
        .post('/api/media')
        .auth(a.token, { type: 'bearer' })
        .attach('file', data, { filename: name, contentType })
        .expect(201)
    ).body;
    await s
      .api(a.token)
      .post('/api/moments', { mediaId: media.id, title: name, date: '2025-06-15' })
      .expect(201);
  }
  const exported = (await s.api(b.token).post('/api/album/exports', {}).expect(200)).body;
  const response = await request(s.app).get(exported.url).buffer(true).parse(binary).expect(200);
  const entries = await unzip(response.body);
  assert.equal(entries.size, 2);
  assert.ok([...entries.keys()].some((n) => n.endsWith('.jpg')));
  assert.ok([...entries.keys()].some((n) => n.endsWith('.mp4')));
  assert.equal(
    [...entries.keys()].some((n) => n.endsWith('.json') || n.endsWith('.source')),
    false,
  );
  await request(s.app).get(exported.url.replace('signature=', 'signature=bad')).expect(403);
  await s.api(b.token).post('/api/album/imports', {}).expect(404);
  await s.api(a.token).delete('/api/pairing').expect(204);
  await request(s.app).get(exported.url).expect(403);
});
