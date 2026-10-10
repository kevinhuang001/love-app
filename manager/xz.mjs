import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export async function extractManagerXZ(archive, destination, { sha256, bytes }) {
  const child = spawn('xz', ['--decompress', '--stdout', '--', archive], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, XZ_OPT: '', XZ_DEFAULTS: '' },
  });
  let detail = '';
  child.stderr.on('data', (chunk) => {
    detail = (detail + chunk.toString()).slice(-2048);
  });
  const complete = new Promise((resolve, reject) => {
    child.once('error', (error) =>
      reject(
        new Error(
          error.code === 'ENOENT'
            ? '缺少 xz，请安装 xz-utils（Debian/Ubuntu）或 xz 后重试，原程序保留'
            : '管理程序解压失败，原程序保留：' + error.message,
        ),
      ),
    );
    child.once('close', (code) =>
      code === 0 ? resolve() : reject(new Error('管理程序解压失败，原程序保留：' + detail.trim())),
    );
  });
  const hash = createHash('sha256');
  let size = 0;
  try {
    await Promise.all([
      complete,
      pipeline(
        child.stdout,
        new Transform({
          transform(chunk, _, next) {
            size += chunk.length;
            if (size > bytes) return next(new Error('解压后的管理程序大小校验失败，原程序保留'));
            hash.update(chunk);
            next(null, chunk);
          },
        }),
        createWriteStream(destination, { flags: 'wx', mode: 0o700 }),
      ),
    ]);
    if (size !== bytes || hash.digest('hex') !== sha256)
      throw new Error('解压后的管理程序校验失败，原程序保留');
  } finally {
    if (child.exitCode === null) child.kill();
  }
}
