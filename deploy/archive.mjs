import tar from 'tar-stream';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
export async function packBackup(directory, destination) {
  const pack = tar.pack();
  const output = pipeline(
    pack,
    createGzip(),
    createWriteStream(destination, { flags: 'wx', mode: 0o600 }),
  );
  // Attach a rejection handler immediately while the archive producer is still running.
  output.catch(() => {});
  try {
    const names = [
      'love.sqlite',
      'manifest.json',
      ...(await readdir(join(directory, 'media'))).map((n) => 'media/' + n),
    ];
    for (const name of names) {
      const path = join(directory, name),
        info = await stat(path);
      await new Promise((resolve, reject) => {
        const entry = pack.entry({ name, size: info.size, mode: 0o600 }, (error) =>
          error ? reject(error) : resolve(),
        );
        pipeline(createReadStream(path), entry).catch(reject);
      });
    }
    pack.finalize();
    await output;
  } catch (error) {
    pack.destroy(error);
    await output.catch(() => {});
    throw error;
  }
}
