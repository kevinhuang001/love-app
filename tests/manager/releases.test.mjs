import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { installManager, latestManager } from '../../manager/releases.mjs';
const templates = Object.fromEntries(
  [
    'compose.yml',
    'compose.postgres.yml',
    'compose.https.yml',
    'compose.certbot.yml',
    'compose.storage.yml',
    'Caddyfile',
    'deploy/certbot-proxy.sh',
    'deploy/certbot-renew.sh',
  ].map((name) => [name, 'fixture-template:' + name]),
);

const digest = (data) => createHash('sha256').update(data).digest('hex');
const binary = Buffer.from('new-standalone-manager');
const compressed = execFileSync('xz', ['--compress', '--stdout'], { input: binary });
function metadata(arch = 'x64') {
  const name = 'love-linux-' + arch;
  return {
    version: '2.10.2',
    source: 'a'.repeat(40),
    templates,
    assets: [
      {
        name,
        sha256: digest(binary),
        bytes: binary.length,
        download: {
          name: name + '.xz',
          compression: 'xz',
          sha256: digest(compressed),
          bytes: compressed.length,
        },
      },
    ],
  };
}
async function release(info = metadata(), arch = 'x64') {
  return latestManager({
    arch,
    request: async (url) =>
      Response.json(url.endsWith('/releases/latest') ? { tag_name: 'v2.10.2' } : info),
  });
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'love-xz-update-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const destination = join(directory, 'love');
  await writeFile(destination, 'previous-manager');
  await writeFile(join(directory, '.env'), 'deployment-secret');
  return { directory, destination };
}
for (const arch of ['x64', 'arm64']) {
  test(`updater selects the pinned ${arch} XZ asset, verifies both files and replaces only the executable`, async (t) => {
    const f = await fixture(t);
    const latest = await release(metadata(arch), arch);
    await installManager(latest, f.destination, {
      request: async (url) => {
        assert.equal(
          url,
          `https://github.com/kevinhuang001/love-app/releases/download/v2.10.2/love-linux-${arch}.xz`,
        );
        return new Response(compressed);
      },
    });
    assert.deepEqual(await readFile(f.destination), binary);
    assert.equal((await stat(f.destination)).mode & 0o777, 0o755);
    assert.equal(await readFile(join(f.directory, '.env'), 'utf8'), 'deployment-secret');
    assert.deepEqual((await readdir(f.directory)).sort(), ['.env', 'love']);
  });
}
for (const mode of [
  'corrupt-download',
  'download-size',
  'truncated-xz',
  'wrong-binary',
  'binary-size',
  'oversized-binary',
]) {
  test(`update failure ${mode} preserves the executable and removes compressed and extracted temporary files`, async (t) => {
    const f = await fixture(t);
    const latest = await release();
    let body = compressed;
    if (mode === 'corrupt-download') body = Buffer.from('corrupt');
    if (mode === 'download-size') latest.download.bytes++;
    if (mode === 'truncated-xz') {
      body = compressed.subarray(0, compressed.length - 12);
      latest.download.sha256 = digest(body);
      latest.download.bytes = body.length;
    }
    if (mode === 'wrong-binary') latest.sha256 = '0'.repeat(64);
    if (mode === 'binary-size') latest.bytes++;
    if (mode === 'oversized-binary') latest.bytes--;
    await assert.rejects(
      installManager(latest, f.destination, { request: async () => new Response(body) }),
      /原程序保留/,
    );
    assert.equal(await readFile(f.destination, 'utf8'), 'previous-manager');
    assert.equal(await readFile(join(f.directory, '.env'), 'utf8'), 'deployment-secret');
    assert.deepEqual((await readdir(f.directory)).sort(), ['.env', 'love']);
  });
}
for (const patch of [
  { compression: 'zip' },
  { name: '../unexpected.xz' },
  { sha256: 'invalid' },
  { bytes: 0 },
  { bytes: -1 },
  { bytes: 1.5 },
]) {
  test('invalid XZ metadata is rejected: ' + JSON.stringify(patch), async () => {
    const info = metadata();
    Object.assign(info.assets[0].download, patch);
    await assert.rejects(release(info), /压缩包发布信息无效/);
  });
}
test('older raw-only release metadata remains usable for updates', async (t) => {
  const info = metadata();
  delete info.assets[0].download;
  const latest = await release(info);
  assert.equal(latest.download, undefined);
  const f = await fixture(t);
  await installManager(latest, f.destination, {
    request: async (url) => {
      assert.ok(url.endsWith('/love-linux-x64'));
      return new Response(binary);
    },
  });
  assert.deepEqual(await readFile(f.destination), binary);
});

test('a missing xz tool gives an actionable error and preserves the executable', async (t) => {
  const f = await fixture(t);
  const latest = await release();
  const previousPath = process.env.PATH;
  try {
    process.env.PATH = f.directory;
    await assert.rejects(
      installManager(latest, f.destination, { request: async () => new Response(compressed) }),
      /缺少 xz.*原程序保留/,
    );
  } finally {
    process.env.PATH = previousPath;
  }
  assert.equal(await readFile(f.destination, 'utf8'), 'previous-manager');
  assert.deepEqual((await readdir(f.directory)).sort(), ['.env', 'love']);
});
