import test from 'node:test';
import assert from 'node:assert/strict';
import { checkUpdate } from './check-update.mjs';
const digest = 'sha256:' + 'a'.repeat(64),
  config = 'sha256:' + 'b'.repeat(64),
  child = 'sha256:' + 'c'.repeat(64);
function registry({ single = false, status = 200 } = {}) {
  const calls = [];
  const request = async (url, options) => {
    calls.push(url);
    assert.ok(options.signal);
    if (url.includes('/token?')) return new Response(JSON.stringify({ token: 'fixture-only' }));
    assert.equal(options.headers.Authorization, 'Bearer fixture-only');
    if (url.endsWith('/latest'))
      return new Response(
        JSON.stringify(
          single
            ? { config: { digest: config } }
            : { manifests: [{ platform: { os: 'linux', architecture: 'amd64' }, digest: child }] },
        ),
        { status, headers: { 'docker-content-digest': digest } },
      );
    assert.ok(url.endsWith('/' + child));
    return new Response(JSON.stringify({ config: { digest: config } }));
  };
  return { request, calls };
}
test('registry compares native config digest without downloading layers; pins the multi-platform digest only when changed', async () => {
  const r = registry();
  assert.equal(await checkUpdate(config, { ...r, arch: 'x64' }), '');
  assert.equal(
    await checkUpdate('sha256:' + 'd'.repeat(64), { ...r, arch: 'x64' }),
    'ghcr.io/kevinhuang001/love-app@' + digest,
  );
  assert.ok(r.calls.every((url) => !url.includes('/blobs/')));
  assert.equal(await checkUpdate(config, { ...registry({ single: true }) }), '');
});
test('registry errors and missing architectures are errors, never reported as up to date', async () => {
  await assert.rejects(checkUpdate(config, { ...registry({ status: 503 }), arch: 'x64' }), /503/);
  await assert.rejects(checkUpdate(config, { ...registry(), arch: 'arm64' }), /设备架构/);
});
