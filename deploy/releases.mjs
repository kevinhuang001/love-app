import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { chmod, open, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
const base = 'https://github.com/kevinhuang001/love-app/releases/download/';
const api = 'https://api.github.com/repos/kevinhuang001/love-app/releases/latest';
async function get(url, request, timeout = 30_000) {
  const r = await request(url, {
    headers: { 'User-Agent': 'Love-Manager', Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(timeout),
  });
  if (!r.ok) throw new Error(`管理工具更新检查失败 (${r.status})`);
  return r;
}
export async function latestManager({ request = fetch, arch = process.arch } = {}) {
  const release = await (await get(api, request)).json();
  if (!/^v\d+\.\d+\.\d+$/.test(release.tag_name || '') || release.draft || release.prerelease)
    throw new Error('管理工具发布信息无效');
  const metadata = await (
    await get(base + release.tag_name + '/manager-release.json', request)
  ).json();
  const name = arch === 'x64' ? 'love-linux-x64' : arch === 'arm64' ? 'love-linux-arm64' : '';
  const asset = metadata.assets?.find((x) => x.name === name);
  if (
    !name ||
    !asset ||
    !/^[a-f0-9]{64}$/.test(asset.sha256) ||
    !/^[a-f0-9]{40}$/.test(metadata.source || '') ||
    'v' + metadata.version !== release.tag_name
  )
    throw new Error('发布中缺少当前架构的管理工具或校验信息');
  const files = [
    'compose.yml',
    'compose.postgres.yml',
    'compose.https.yml',
    'compose.certbot.yml',
    'compose.storage.yml',
    'Caddyfile',
    'deploy/certbot-proxy.sh',
    'deploy/certbot-renew.sh',
  ];
  if (
    !metadata.templates ||
    Object.keys(metadata.templates).length !== files.length ||
    files.some((n) => typeof metadata.templates[n] !== 'string')
  )
    throw new Error('发布中缺少完整部署模板');
  return {
    ...asset,
    source: metadata.source,
    version: metadata.version,
    templates: metadata.templates,
    url: base + release.tag_name + '/' + name,
  };
}
export async function installManager(
  release,
  destination,
  { request = fetch, onProgress = () => {} } = {},
) {
  const temp = dirname(destination) + '/.love-binary-' + randomUUID();
  try {
    const r = await get(release.url, request, 15 * 60_000),
      hash = createHash('sha256');
    let bytes = 0,
      reported = 0;
    await pipeline(
      Readable.fromWeb(r.body),
      new Transform({
        transform(chunk, _, next) {
          hash.update(chunk);
          bytes += chunk.length;
          if (bytes - reported >= 1048576) {
            reported = bytes;
            onProgress(bytes);
          }
          next(null, chunk);
        },
      }),
      createWriteStream(temp, { flags: 'wx', mode: 0o700 }),
    );
    if (hash.digest('hex') !== release.sha256) throw new Error('管理工具下载校验失败，原程序保留');
    if (release.bytes && bytes !== release.bytes)
      throw new Error('管理程序大小校验失败，原程序保留');
    await chmod(temp, 0o755);
    const f = await open(temp, 'r');
    try {
      await f.sync();
    } finally {
      await f.close();
    }
    await rename(temp, destination);
    const d = await open(dirname(destination), 'r');
    try {
      await d.sync();
    } finally {
      await d.close();
    }
  } finally {
    await rm(temp, { force: true });
  }
}
