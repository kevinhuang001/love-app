import { createHash } from 'node:crypto';
import { constants, createReadStream, createWriteStream } from 'node:fs';
import { lstat, open, readFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Writable, Transform } from 'node:stream';
import { createZstdCompress, createZstdDecompress, constants as zlib } from 'node:zlib';
import tar from 'tar-stream';

export const BACKUP_COMPRESSION_LEVEL = 15;
export async function digestFile(path: string) {
  const hash = createHash('sha256');
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    for await (const part of handle.createReadStream({ autoClose: false })) hash.update(part);
  } finally {
    await handle.close();
  }
  return hash.digest('hex');
}

// Filename selection is authenticated by the outer checksum list; never guess between
// two archives or follow a symlink. Legacy gzip and current Zstandard share this entry.
export async function verifyBackupDirectory(directory: string, archiveNames: readonly string[]) {
  const entries = new Set<string>();
  for (const line of (await readFile(join(directory, 'SHA256SUMS'), 'utf8')).trim().split('\n')) {
    const match = line.match(/^([a-f0-9]{64}) [ *]([^\r\n]+)$/);
    if (!match || !['deployment.env', ...archiveNames].includes(match[2]) || entries.has(match[2]))
      throw new Error('备份校验清单无效');
    const path = join(directory, match[2]);
    if (!(await lstat(path)).isFile() || (await digestFile(path)) !== match[1])
      throw new Error(`备份校验失败：${match[2]}`);
    entries.add(match[2]);
  }
  const archives = archiveNames.filter((name) => entries.has(name));
  if (!entries.has('deployment.env') || archives.length !== 1 || entries.size !== 2)
    throw new Error('备份校验清单必须包含部署配置和唯一的数据归档');
  return archives[0];
}

// The ordinary import path understands only the current archive encoding.
export async function extractCurrentBackup(archive: string, directory: string) {
  const handle = await open(archive, constants.O_RDONLY | constants.O_NOFOLLOW);
  const header = Buffer.alloc(4);
  try {
    await handle.read(header, 0, 4, 0);
  } finally {
    await handle.close();
  }
  if (!header.equals(Buffer.from([0x28, 0xb5, 0x2f, 0xfd])))
    throw new Error('归档必须使用 Zstandard');
  await extractTarArchive(archive, directory, createZstdDecompress());
}

// Extract into a private empty directory. No links or special files are accepted, including
// ignored entries: a malicious archive cannot affect the deployment or its backups.
export async function extractTarArchive(archive: string, directory: string, decoder: Transform) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await mkdir(join(directory, 'media'), { recursive: true, mode: 0o700 });
  const extract = tar.extract(),
    seen = new Set<string>();
  extract.on('entry', (header, stream, next) => {
    stream.on('error', () => {});
    void (async () => {
      const path = header.name.replace(/^\.\//, '').replace(/\/$/, '');
      if (['.', './'].includes(header.name) && header.type === 'directory') {
        stream.resume();
        next();
        return;
      }
      if (
        !path ||
        path.startsWith('/') ||
        path.includes('\\') ||
        /[\x00-\x1f]/.test(path) ||
        path.split('/').some((p) => p === '..' || !p) ||
        !['file', 'directory'].includes(header.type)
      )
        throw new Error('备份包含不安全路径、链接或特殊文件');
      if (header.type === 'directory') {
        stream.resume();
        next();
        return;
      }
      if (seen.has(path)) throw new Error('备份包含重复文件');
      seen.add(path);
      const wanted =
        ['love.sqlite', 'manifest.json'].includes(path) ||
        (path.startsWith('media/') && path.split('/').length === 2);
      if (!wanted) {
        stream.resume();
        stream.once('end', next);
        return;
      }
      const output = join(directory, path);
      await mkdir(dirname(output), { recursive: true, mode: 0o700 });
      await pipeline(stream, createWriteStream(output, { flags: 'wx', mode: 0o600 }));
      next();
    })().catch((error) => {
      stream.destroy(error);
      extract.destroy(error);
    });
  });
  await pipeline(createReadStream(archive), decoder, extract);
  if (!(await lstat(join(directory, 'love.sqlite')).catch(() => null)))
    throw new Error('备份不包含 SQLite 数据快照');
}

export async function packBackup(directory: string, destination: string | Writable) {
  return packTarArchive(
    directory,
    destination,
    createZstdCompress({
      params: {
        [zlib.ZSTD_c_compressionLevel]: BACKUP_COMPRESSION_LEVEL,
        [zlib.ZSTD_c_checksumFlag]: 1,
      },
    }),
  );
}

export async function packTarArchive(
  directory: string,
  destination: string | Writable,
  encoder: Transform,
) {
  const pack = tar.pack();
  const output = pipeline(
    pack,
    encoder,
    typeof destination === 'string'
      ? createWriteStream(destination, { flags: 'wx', mode: 0o600 })
      : destination,
  );
  output.catch(() => {});
  try {
    const names = [
      'love.sqlite',
      'manifest.json',
      ...(await readdir(join(directory, 'media'))).sort().map((name) => 'media/' + name),
    ];
    for (const name of names) {
      const path = join(directory, name),
        info = await lstat(path);
      if (!info.isFile()) throw new Error('备份包含链接或非普通文件');
      await new Promise<void>((resolve, reject) => {
        const entry = pack.entry({ name, size: info.size, mode: 0o600 }, (error) =>
          error ? reject(error) : resolve(),
        );
        pipeline(createReadStream(path), entry).catch(reject);
      });
    }
    pack.finalize();
    await output;
  } catch (error) {
    pack.destroy(error instanceof Error ? error : new Error(String(error)));
    await output.catch(() => {});
    throw error;
  }
}
