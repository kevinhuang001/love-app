import test from 'node:test';
import assert from 'node:assert/strict';
import {
  latestImage,
  isCurrentImage,
  obsoleteImages,
  imageRepository as repo,
} from '../../manager/registry.mjs';
const digest = 'sha256:' + 'a'.repeat(64),
  child = 'sha256:' + 'b'.repeat(64),
  config = 'sha256:' + 'c'.repeat(64),
  revision = 'd'.repeat(40);
function registry({ status = 200, arch = 'amd64' } = {}) {
  const calls = [];
  return {
    calls,
    request: async (url, options) => {
      calls.push(url);
      assert.ok(options.signal);
      if (url.includes('/token?')) return Response.json({ token: 'fixture' });
      assert.equal(options.headers.Authorization, 'Bearer fixture');
      if (url.endsWith('/latest'))
        return Response.json(
          { manifests: [{ platform: { os: 'linux', architecture: arch }, digest: child }] },
          { status, headers: { 'docker-content-digest': digest } },
        );
      if (url.endsWith('/' + child)) return Response.json({ config: { digest: config } });
      if (url.endsWith('/' + config))
        return Response.json({
          config: { Labels: { 'org.opencontainers.image.revision': revision } },
        });
      throw new Error('unexpected URL ' + url);
    },
  };
}
test('registry retrieves only native platform metadata, including tested source revision', async () => {
  const r = registry(),
    remote = await latestImage({ ...r, arch: 'x64' });
  assert.deepEqual(remote, {
    digest,
    platformDigest: child,
    configDigest: config,
    revision,
    version: '',
    image: repo + '@' + digest,
  });
  assert.equal(r.calls.length, 4);
  assert.ok(!r.calls.some((x) => x.includes('/layers/')));
  const arm = await latestImage({ ...registry({ arch: 'arm64' }), arch: 'arm64' });
  assert.equal(arm.platformDigest, child);
});
test('same config, root manifest, platform manifest or repository digest are all current', async () => {
  const remote = await latestImage({ ...registry(), arch: 'x64' });
  for (const Id of [digest, child, config]) assert.ok(isCurrentImage({ Id }, remote));
  assert.ok(isCurrentImage({ Id: 'other', RepoDigests: [repo + '@' + digest] }, remote));
  assert.ok(!isCurrentImage({ Id: 'other', RepoDigests: ['other/repo@' + digest] }, remote));
});
test('same source rebuilt with changed metadata does not incorrectly offer an application update', async () => {
  const remote = await latestImage({ ...registry(), arch: 'x64' });
  assert.ok(
    isCurrentImage(
      { Id: 'different', Config: { Labels: { 'org.opencontainers.image.revision': revision } } },
      remote,
    ),
  );
  assert.ok(
    !isCurrentImage(
      {
        Id: 'different',
        Config: { Labels: { 'org.opencontainers.image.revision': 'e'.repeat(40) } },
      },
      remote,
    ),
  );
  assert.ok(
    !isCurrentImage(
      { Id: 'different', Config: { Labels: { 'org.opencontainers.image.revision': '' } } },
      { ...remote, revision: '' },
    ),
  );
});
test('failed registry requests and missing architectures are errors, never false update results', async () => {
  await assert.rejects(latestImage({ ...registry({ status: 503 }), arch: 'x64' }), /503/);
  await assert.rejects(latestImage({ ...registry(), arch: 'arm64' }), /设备架构/);
});
test('old image selection protects current image and never selects database or other project images', () => {
  const current = { Id: child, RepoDigests: [repo + '@' + digest] };
  const images = [
    current,
    { Id: 'alias', RepoDigests: [repo + '@' + digest] },
    { Id: 'old-tag', RepoTags: [repo + ':rollback-old'] },
    { Id: 'old-digest', RepoDigests: [repo + '@sha256:old'] },
    {
      Id: 'dangling',
      Config: {
        Labels: { 'org.opencontainers.image.source': 'https://github.com/kevinhuang001/love-app' },
      },
    },
    { Id: 'pg', RepoTags: ['postgres:18-alpine'] },
    { Id: 'other', RepoTags: ['other/love-app:latest'] },
  ];
  assert.deepEqual(
    obsoleteImages(images, current).map((x) => x.Id),
    ['old-tag', 'old-digest', 'dangling'],
  );
});
