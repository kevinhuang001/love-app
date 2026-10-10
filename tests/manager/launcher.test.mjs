import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { Manager } from '../../manager/manager.mjs';
import { imageRepository as repo } from '../../manager/registry.mjs';
import { installManager } from '../../manager/releases.mjs';
import { parseDeploymentEnv } from '../../manager/setup.mjs';
const old = '1'.repeat(40),
  latest = '2'.repeat(40),
  digest = 'sha256:' + 'a'.repeat(64),
  platform = 'sha256:' + 'b'.repeat(64),
  config = 'sha256:' + 'c'.repeat(64);
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
  ].map((x) => [x, 'new-template:' + x]),
);
async function fixture(
  t,
  { updated = false, managerUpdated = false, fail = '', sameRevision = false, sync = true } = {},
) {
  const directory = await mkdtemp(join(tmpdir(), 'love-native-manager-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const current = {
    Id: 'sha256:' + 'd'.repeat(64),
    Architecture: 'amd64',
    RepoTags: [repo + ':previous'],
    Config: { Labels: { 'org.opencontainers.image.revision': updated ? old : latest } },
  };
  const remoteRevision = sameRevision ? old : latest;
  if (!updated) current.RepoDigests = [repo + '@' + digest];
  let deployed = current;
  const calls = [],
    notes = [];
  const binary = Buffer.from('verified-binary');
  const binaryHash = createHash('sha256').update(binary).digest('hex');
  const image = repo + '@sha256:' + 'e'.repeat(64),
    executable = join(directory, 'love');
  await writeFile(executable, 'old-binary');
  await writeFile(
    join(directory, '.env'),
    `LOVE_IMAGE='${image}'\nLOVE_DATABASE='external'\nCOMPOSE_PROJECT_NAME='love-fixture'\nMEDIA_SIGNING_SECRET='private-fixture-secret-of-more-than-32-characters'\nDATABASE_URL='postgresql://private:private@db/love'\n`,
  );
  await writeFile(join(directory, 'compose.yml'), 'old-template');
  const ui = {
    isCancel: (x) => typeof x === 'symbol',
    log: { error: (x) => notes.push(x) },
    select: async (p) => (p.options.some((x) => x.value === 'skip') ? 'skip' : 'continue'),
    confirm: async () => true,
  };
  const run = async (a) => {
    calls.push(a);
    if (a[0] === 'ps') return 'container';
    if (a[0] === 'container')
      return JSON.stringify([
        {
          Image: deployed.Id,
          State: { Running: true, Health: { Status: 'healthy' } },
          Config: {
            Image: image,
            Labels: {
              'com.docker.compose.project': 'love-fixture',
              'com.docker.compose.service': 'love',
              'com.docker.compose.oneoff': 'False',
            },
          },
        },
      ]);
    if (a[0] === 'image' && a[1] === 'inspect') {
      if (a[2] === 'unrelated')
        return JSON.stringify([{ Id: 'unrelated', RepoTags: ['postgres:18-alpine'] }]);
      if (a[2] === current.Id) return JSON.stringify([current]);
      return JSON.stringify([deployed]);
    }
    if (a[0] === 'image' && a[1] === 'ls') return [deployed.Id, current.Id, 'unrelated'].join('\n');
    if (a[0] === 'compose') {
      if (a.includes('ps')) return 'container';
      if (a.includes('up') && a.includes('--pull') && a.includes('missing')) {
        if (fail === 'health') throw new Error('fixture-health-failed');
        deployed = {
          Id: config,
          Architecture: 'amd64',
          RepoDigests: [repo + '@' + digest],
          Config: { Labels: { 'org.opencontainers.image.revision': latest } },
        };
      }
      return '';
    }
    if (a[0] === 'pull' && fail === 'pull') throw new Error('fixture-pull-failed');
    return '';
  };
  const request = async (url) => {
    if (url.includes('/token?')) return Response.json({ token: 'fixture' });
    if (url.endsWith('/manifests/latest'))
      return Response.json(
        { manifests: [{ platform: { os: 'linux', architecture: 'amd64' }, digest: platform }] },
        { headers: { 'docker-content-digest': digest } },
      );
    if (url.endsWith('/manifests/' + platform))
      return Response.json({ config: { digest: config } });
    if (url.endsWith('/blobs/' + config))
      return Response.json({
        config: {
          Labels: {
            'org.opencontainers.image.revision': remoteRevision,
            'org.opencontainers.image.version': sync ? '2.9.0' : '2.9.1',
          },
        },
      });
    if (url.endsWith('/releases/latest'))
      return Response.json({ tag_name: 'v2.9.0', draft: false, prerelease: false });
    if (url.endsWith('/manager-release.json'))
      return Response.json({
        version: '2.9.0',
        source: sync ? remoteRevision : old,
        assets: [{ name: 'love-linux-x64', sha256: binaryHash }],
        templates,
      });
    if (url.endsWith('/love-linux-x64'))
      return new Response(fail === 'binary' ? Buffer.from('corrupt') : binary);
    throw new Error('unexpected request ' + url);
  };
  const manager = new Manager({
    directory,
    executable,
    version: managerUpdated ? '2.8.1' : '2.9.0',
    source: managerUpdated ? old : remoteRevision,
    templates,
    ui,
    run,
    request,
    log: (x) => notes.push(x),
  });
  await manager.reload();
  return { manager, directory, executable, calls, notes, current, ui, image };
}
test('unchanged versions do not pull, stop, back up or replace the manager; old image cleanup is scoped', async (t) => {
  const f = await fixture(t);
  await f.manager.update();
  assert.match(f.notes.join('\n'), /均为最新/);
  assert.ok(!f.calls.some((a) => a[0] === 'pull' || a.includes('up') || a.includes('stop')));
  assert.equal(await readFile(f.executable, 'utf8'), 'old-binary');
  assert.ok(!f.calls.some((a) => a[0] === 'run' || a.includes('--force') || a.includes('prune')));
  assert.ok(!f.calls.some((a) => a.includes('rm') && a.includes('unrelated')));
});
test('rebuilding unchanged source does not falsely offer an update', async (t) => {
  const f = await fixture(t, { updated: true, sameRevision: true });
  await f.manager.update();
  assert.match(f.notes.join('\n'), /均为最新/);
  assert.ok(!f.calls.some((a) => a[0] === 'pull'));
});
test('image and manager updates are detected separately; manager-only update needs no helper container', async (t) => {
  const f = await fixture(t, { managerUpdated: true });
  await f.manager.update();
  assert.equal(await readFile(f.executable, 'utf8'), 'verified-binary');
  assert.ok(f.manager.needsReload);
  assert.ok(
    !f.calls.some(
      (a) => a[0] === 'pull' || a[0] === 'run' || a.includes('stop') || a.includes('up'),
    ),
  );
});
test('successful image update verifies health before removing old Love images and preserves deployment settings', async (t) => {
  const f = await fixture(t, { updated: true, managerUpdated: true });
  await f.manager.update();
  const health = f.calls.findIndex((a) => a.includes('up') && a.includes('--wait'));
  const cleanup = f.calls.findIndex((a) => a[0] === 'image' && a[1] === 'rm');
  assert.ok(health >= 0 && cleanup > health);
  assert.ok(f.calls.some((a) => a[0] === 'pull' && a[1] === repo + '@' + digest));
  assert.ok(
    f.calls.every((a) => !['run', 'create', 'build'].includes(a[0]) && !a.includes('--force')),
  );
  const env = await readFile(join(f.directory, '.env'), 'utf8');
  assert.match(env, /postgresql:\/\/private:private@db\/love/);
  assert.match(env, new RegExp(digest));
  assert.equal(await readFile(join(f.directory, 'compose.yml'), 'utf8'), templates['compose.yml']);
});
test('a failed download preserves config and templates without creating rollback artifacts', async (t) => {
  const f = await fixture(t, { updated: true, fail: 'pull' });
  const env = await readFile(join(f.directory, '.env'), 'utf8');
  await assert.rejects(f.manager.update(), /镜像下载失败/);
  assert.equal(await readFile(join(f.directory, '.env'), 'utf8'), env);
  assert.equal(await readFile(join(f.directory, 'compose.yml'), 'utf8'), 'old-template');
  assert.ok(!f.calls.some((a) => a[0] === 'tag' || (a[0] === 'image' && a[1] === 'rm')));
});
test('health failure retains new version configuration and does not switch back to the old image', async (t) => {
  const f = await fixture(t, { updated: true, fail: 'health' });
  const before = { ...f.manager.config };
  await assert.rejects(f.manager.update(), /不自动回滚/);
  const after = parseDeploymentEnv(await readFile(join(f.directory, '.env'), 'utf8'));
  assert.equal(after.LOVE_IMAGE, repo + '@' + digest);
  assert.deepEqual({ ...after, LOVE_IMAGE: before.LOVE_IMAGE }, before);
  assert.equal(await readFile(join(f.directory, 'compose.yml'), 'utf8'), templates['compose.yml']);
  assert.ok(
    !f.calls.some(
      (a) => a[0] === 'tag' || a.includes('never') || (a[0] === 'image' && a[1] === 'rm'),
    ),
  );
  assert.equal(f.calls.filter((a) => a[0] === 'compose' && a.includes('up')).length, 1);
});
test('a failed image download does not start or recreate the unchanged application', async (t) => {
  const f = await fixture(t, { updated: true, fail: 'pull' });
  await assert.rejects(f.manager.update(), /镜像下载失败/);
  assert.ok(
    !f.calls.some(
      (args) =>
        args[0] === 'compose' &&
        ['up', 'stop', 'start', 'restart'].some((command) => args.includes(command)),
    ),
  );
});
test('old image cleanup preserves every tag of images used by another deployment, including stopped containers', async (t) => {
  const f = await fixture(t),
    run = f.manager.run;
  const oldImage = {
    Id: 'shared-old',
    RepoTags: [repo + ':old'],
    RepoDigests: [repo + '@sha256:' + 'f'.repeat(64)],
  };
  f.manager.run = async (args, options) => {
    if (args[0] === 'ps') return 'container\nother-stopped-container';
    if (args[0] === 'container' && args.includes('other-stopped-container'))
      return JSON.stringify([
        ...JSON.parse(await run(['container', 'inspect', 'container'], options)),
        { Image: oldImage.Id, State: { Running: false } },
      ]);
    if (args[0] === 'image' && args[1] === 'ls') return oldImage.Id;
    if (args[0] === 'image' && args[1] === 'inspect' && args[2] === oldImage.Id)
      return JSON.stringify([oldImage]);
    return run(args, options);
  };
  assert.equal(await f.manager.pruneOldImages(f.current), 0);
  assert.ok(!f.calls.some((args) => args[0] === 'image' && args[1] === 'rm'));
});
test('failed binary checksum leaves the manager intact and retains old images for retry', async (t) => {
  const f = await fixture(t, { updated: true, managerUpdated: true, fail: 'binary' });
  await assert.rejects(f.manager.update(), /校验失败/);
  assert.equal(await readFile(f.executable, 'utf8'), 'old-binary');
  assert.ok(!f.calls.some((a) => a[0] === 'image' && a[1] === 'rm'));
});
test('publication skew is not reported as a new usable version and never changes the deployment', async (t) => {
  const f = await fixture(t, { updated: true, sync: false });
  await f.manager.update();
  assert.match(f.notes.join('\n'), /发布同步/);
  assert.ok(!f.calls.some((a) => a[0] === 'pull' || a.includes('stop')));
});
test('update review displays both current and latest versions before asking to download', async (t) => {
  const f = await fixture(t, { updated: true, managerUpdated: true });
  f.current.Config.Labels['org.opencontainers.image.version'] = '2.8.1';
  let review;
  f.ui.note = (content, title) => {
    if (title === '版本对比') review = content;
  };
  f.ui.confirm = async (p) => {
    assert.match(review, /应用\s+v2.8.1 → v2.9.0/);
    assert.match(review, /管理程序\s+v2.8.1 → v2.9.0/);
    assert.match(p.message, /更新至 v2.9.0/);
    return false;
  };
  await f.manager.update();
  assert.equal(f.manager.latestVersion, '2.9.0');
  assert.ok(!f.calls.some((a) => a[0] === 'pull'));
});
test('database failures resume only previously running applications', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    f.manager.paused(() => {
      throw new Error('database-failure');
    }),
    /database-failure/,
  );
  assert.ok(f.calls.some((a) => a.includes('stop') && a.at(-1) === 'love'));
  assert.ok(f.calls.some((a) => a.includes('start') && a.at(-1) === 'love'));
  f.manager.running = async () => [];
  f.calls.length = 0;
  await f.manager.paused(async () => {});
  assert.ok(!f.calls.some((a) => a.includes('start')));
});
test('embedded Compose and proxy templates are created beside love, independent of working directory', async (t) => {
  const f = await fixture(t);
  await f.manager.installTemplates();
  assert.equal(await readFile(join(f.directory, 'compose.yml'), 'utf8'), 'old-template');
  assert.equal(
    await readFile(join(f.directory, 'compose.postgres.yml'), 'utf8'),
    templates['compose.postgres.yml'],
  );
  assert.equal(
    await readFile(join(f.directory, 'deploy/certbot-proxy.sh'), 'utf8'),
    templates['deploy/certbot-proxy.sh'],
  );
  assert.ok(!f.calls.length);
});
test('external PostgreSQL compose operations never select or start the bundled postgres service', async (t) => {
  const f = await fixture(t);
  const args = f.manager.composeArgs(['up', '-d']);
  assert.ok(!args.some((a) => a.endsWith('compose.postgres.yml')));
  assert.ok(args.includes(join(f.directory, 'compose.yml')));
});
test('a stale love.next does not block atomic binary replacement', async (t) => {
  const f = await fixture(t);
  await mkdir(join(f.directory, 'love.next'));
  const data = Buffer.from('replacement');
  await installManager(
    { url: 'https://fixture/binary', sha256: createHash('sha256').update(data).digest('hex') },
    f.executable,
    { request: async () => new Response(data) },
  );
  assert.equal(await readFile(f.executable, 'utf8'), 'replacement');
});
test('HTTPS starts the selected certificate services; HTTP and external proxies do not activate the HTTPS profile', async (t) => {
  const f = await fixture(t);
  for (const provider of ['certbot', 'caddy']) {
    f.manager.config.LOVE_HTTPS = '1';
    f.manager.config.LOVE_TLS_PROVIDER = provider;
    const args = f.manager.composeArgs(['up', '-d', '--wait']);
    assert.ok(args.includes('--profile'));
    assert.ok(args.includes('https'));
    assert.ok(args.includes(join(f.directory, 'compose.https.yml')));
    assert.equal(args.includes(join(f.directory, 'compose.certbot.yml')), provider === 'certbot');
  }
  f.manager.config.LOVE_TLS_PROVIDER = 'external';
  assert.ok(!f.manager.composeArgs(['up', '-d']).includes('--profile'));
  f.manager.config.LOVE_HTTPS = '0';
  f.manager.config.LOVE_TLS_PROVIDER = 'none';
  assert.ok(!f.manager.composeArgs(['up', '-d']).includes('--profile'));
});

test('rechecking an unhealthy or stopped latest-version app never cleans up old images', async (t) => {
  for (const state of [{ Running: true, Health: { Status: 'unhealthy' } }, { Running: false }]) {
    const f = await fixture(t),
      run = f.manager.run;
    f.manager.run = async (args, options) => {
      const result = await run(args, options);
      if (args[0] === 'container') {
        const entries = JSON.parse(result);
        entries.forEach((entry) => (entry.State = state));
        return JSON.stringify(entries);
      }
      return result;
    };
    await f.manager.update();
    assert.match(f.notes.join('\n'), /尚未通过健康检查/);
    assert.ok(!f.calls.some((args) => args[0] === 'image' && args[1] === 'rm'));
  }
});
