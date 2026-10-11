import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  ].map((n) => [n, 'fixture']),
);
const script = Buffer.from('#!/usr/bin/env node\nconsole.log("fixture");');
const digest = (data) => createHash('sha256').update(data).digest('hex');
const metadata = () => ({
  version: '2.11.0',
  runtime: 'node24',
  source: 'a'.repeat(40),
  templates,
  assets: [{ name: 'love-manager.mjs', sha256: digest(script), bytes: script.length }],
});
const release = (info = metadata(), arch = 'x64') =>
  latestManager({
    arch,
    request: async (url) =>
      Response.json(url.endsWith('/releases/latest') ? { tag_name: 'v2.11.0' } : info),
  });
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'love-js-update-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const destination = join(directory, 'love');
  await writeFile(destination, 'old-manager');
  await writeFile(join(directory, '.env'), 'secret');
  return { directory, destination };
}
for (const arch of ['x64', 'arm64'])
  test(`same Node JS update on ${arch} verifies checksum and preserves deployment`, async (t) => {
    const f = await fixture(t),
      latest = await release(metadata(), arch);
    await installManager(latest, f.destination, {
      request: async (url) => {
        assert.ok(url.endsWith('/v2.11.0/love-manager.mjs'));
        return new Response(script);
      },
    });
    assert.deepEqual(await readFile(f.destination), script);
    assert.equal((await stat(f.destination)).mode & 0o777, 0o755);
    assert.equal(await readFile(join(f.directory, '.env'), 'utf8'), 'secret');
    assert.deepEqual((await readdir(f.directory)).sort(), ['.env', 'love']);
  });
for (const mode of ['corrupt', 'truncated', 'size'])
  test(`failed JS update ${mode} retains installed manager`, async (t) => {
    const f = await fixture(t),
      latest = await release();
    if (mode === 'size') latest.bytes++;
    const body =
      mode === 'corrupt'
        ? Buffer.from('bad')
        : mode === 'truncated'
          ? script.subarray(0, 8)
          : script;
    await assert.rejects(
      installManager(latest, f.destination, { request: async () => new Response(body) }),
      /原程序保留/,
    );
    assert.equal(await readFile(f.destination, 'utf8'), 'old-manager');
    assert.deepEqual((await readdir(f.directory)).sort(), ['.env', 'love']);
  });
for (const patch of [{ name: '../bad.mjs' }, { sha256: 'invalid' }, { bytes: 0 }, { bytes: 1.5 }])
  test('invalid JS metadata is rejected ' + JSON.stringify(patch), async () => {
    const info = metadata();
    Object.assign(info.assets[0], patch);
    await assert.rejects(release(info), /校验信息/);
  });
test('a native-only release is rejected with an installation action', async () => {
  const info = metadata();
  info.assets[0].name = 'love-linux-x64';
  await assert.rejects(release(info), /重新运行安装命令/);
});
