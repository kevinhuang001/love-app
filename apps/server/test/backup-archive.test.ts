import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGzip, zstdDecompressSync } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import tar from 'tar-stream';
import {
  packBackup,
  verifyBackupDirectory,
  digestFile,
  BACKUP_COMPRESSION_LEVEL,
} from '../src/backup-archive.js';
import { extractBackup } from '../src/database-backup.js';

test('Zstandard level 15 streams a large archive losslessly and detects truncation and checksum corruption', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'love-zstd-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = join(root, 'data');
  await mkdir(join(data, 'media'), { recursive: true });
  await writeFile(join(data, 'love.sqlite'), Buffer.from('sqlite fixture'));
  await writeFile(join(data, 'manifest.json'), '{}');
  const media = join(data, 'media', 'large.mp4');
  const output = createWriteStream(media);
  const block = Buffer.alloc(1024 * 1024, 'streamed-media-fixture');
  for (let i = 0; i < 24; i++) {
    if (!output.write(block)) await new Promise<void>((resolve) => output.once('drain', resolve));
  }
  await new Promise<void>((resolve) => output.end(resolve));
  const archive = join(root, 'data.tar.zst');
  await packBackup(data, archive);
  const bytes = await readFile(archive);
  assert.equal(BACKUP_COMPRESSION_LEVEL, 15);
  assert.deepEqual(bytes.subarray(0, 4), Buffer.from([0x28, 0xb5, 0x2f, 0xfd]));
  assert.ok(bytes[4] & 4, 'Zstandard frame checksum is enabled');
  assert.ok(bytes.length < 1024 * 1024, 'repetitive fixture compresses effectively');
  // Independent native decoder checks the stream, while extraction checks tar contents.
  assert.ok(zstdDecompressSync(bytes).length > 24 * 1024 * 1024);
  const extracted = join(root, 'out');
  await extractBackup(archive, extracted);
  assert.equal(await digestFile(join(extracted, 'media', 'large.mp4')), await digestFile(media));
  assert.deepEqual(
    await readFile(join(extracted, 'love.sqlite')),
    await readFile(join(data, 'love.sqlite')),
  );
  for (const corrupt of [bytes.subarray(0, bytes.length - 5), Buffer.from(bytes)]) {
    if (corrupt.length === bytes.length) corrupt[corrupt.length - 1] ^= 1;
    const bad = join(root, createHash('sha256').update(corrupt).digest('hex') + '.zst');
    await writeFile(bad, corrupt);
    await assert.rejects(extractBackup(bad, bad + '-out'));
  }
});

test('current extractor rejects gzip; outer dispatcher identifies one verified archive', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'love-gzip-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pack = tar.pack(),
    archive = join(root, 'data.tar.gz');
  const output = pipeline(pack, createGzip(), createWriteStream(archive));
  pack.entry({ name: 'love.sqlite' }, 'sqlite');
  pack.entry({ name: 'manifest.json' }, '{}');
  pack.finalize();
  await output;
  await writeFile(join(root, 'deployment.env'), 'private');
  const writeSums = async (names: string[]) =>
    writeFile(
      join(root, 'SHA256SUMS'),
      (
        await Promise.all(
          names.map(async (name) => `${await digestFile(join(root, name))}  ${name}`),
        )
      ).join('\n') + '\n',
    );
  await writeSums(['deployment.env', 'data.tar.gz']);
  assert.equal(await verifyBackupDirectory(root), 'data.tar.gz');
  await assert.rejects(extractBackup(archive, join(root, 'out')), /版本迁移入口/);
  await writeFile(join(root, 'data.tar.zst'), 'not-an-archive');
  await writeSums(['deployment.env', 'data.tar.gz', 'data.tar.zst']);
  await assert.rejects(verifyBackupDirectory(root), /唯一/);
  await writeSums(['deployment.env']);
  await assert.rejects(verifyBackupDirectory(root));
  await writeSums(['deployment.env', 'data.tar.gz', 'data.tar.gz']);
  await assert.rejects(verifyBackupDirectory(root));
  await writeSums(['deployment.env', 'data.tar.gz']);
  await writeFile(archive, 'changed');
  await assert.rejects(verifyBackupDirectory(root), /校验失败/);
  await assert.rejects(extractBackup(archive, join(root, 'invalid')), /Zstandard/);
  await symlink('data.tar.gz', join(root, 'linked.gz'));
  await writeFile(join(root, 'SHA256SUMS'), '0'.repeat(64) + '  ../linked.gz\n');
  await assert.rejects(verifyBackupDirectory(root), /清单无效/);
});
