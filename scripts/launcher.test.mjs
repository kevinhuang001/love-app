import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, copyFile, chmod, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
async function launch(t, config, input, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'love-manager-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await copyFile(new URL('../love', import.meta.url), join(dir, 'love'));
  await writeFile(join(dir, '.env'), config);
  await writeFile(join(dir, 'compose.yml'), 'services: {}\n');
  await mkdir(join(dir, 'bin'));
  await writeFile(
    join(dir, 'bin/docker'),
    `#!/usr/bin/env node
const fs=require('node:fs'),a=process.argv.slice(2);fs.appendFileSync(process.env.TEST_CALLS,JSON.stringify(a)+'\\n');
if(a.includes('inspect')&&process.env.TEST_IMAGE_MISSING==='1')process.exit(1);
if(a.includes('ps')&&a.includes('--status'))console.log('test-running-container');
if(a.includes('exec')&&a.includes('pg_dump'))process.stdout.write('fixture-db-dump');
if(a[0]==='run'&&a.includes('tar'))process.stdout.write('fixture-media-backup');
`,
  );
  await chmod(join(dir, 'bin/docker'), 0o755);
  const content = Buffer.from('release-image-fixture'),
    sum = createHash('sha256').update(content).digest('hex');
  await writeFile(
    join(dir, 'bin/curl'),
    `#!/usr/bin/env node
const fs=require('node:fs'),a=process.argv.slice(2),url=a.find(v=>v.startsWith('https://')),out=a[a.indexOf('-o')+1];
fs.appendFileSync(process.env.TEST_CALLS,JSON.stringify(['curl',url])+'\\n');
fs.writeFileSync(out,url.endsWith('SHA256SUMS')?'${options.corrupt ? '0'.repeat(64) : sum}  Love-docker-amd64.tar.gz\\n${options.corrupt ? '0'.repeat(64) : sum}  Love-docker-arm64.tar.gz\\n':'release-image-fixture');
`,
  );
  await chmod(join(dir, 'bin/curl'), 0o755);
  const result = spawnSync('sh', ['love', ...(options.args || [])], {
    cwd: dir,
    env: {
      ...process.env,
      PATH: join(dir, 'bin') + ':' + process.env.PATH,
      TEST_CALLS: join(dir, 'calls'),
      TEST_IMAGE_MISSING: options.missing ? '1' : '0',
    },
    input,
    encoding: 'utf8',
  });
  const calls = (
    await readFile(join(dir, 'calls'), 'utf8').catch((e) => {
      if (e.code === 'ENOENT') return '';
      throw e;
    })
  )
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(JSON.parse);
  return { calls, result, dir, config: await readFile(join(dir, '.env'), 'utf8') };
}
const base =
  "LOVE_IMAGE='ghcr.io/kevinhuang001/love-app:latest'\nLOVE_IMAGE_SOURCE='registry'\nLOVE_DATABASE='sqlite'\nLOVE_HTTPS='0'\nCOMPOSE_PROJECT_NAME='love-test'\n";
test('interactive start never builds, preserves PostgreSQL / HTTPS order, and returns to menu', async (t) => {
  const { calls, result } = await launch(
    t,
    base
      .replace("'sqlite'", "'postgres'")
      .replace("LOVE_HTTPS='0'", "LOVE_HTTPS='1'\nLOVE_TLS_PROVIDER='certbot'"),
    '2\n5\n0\n',
  );
  assert.equal(result.status, 0);
  const up = calls.find((x) => x.includes('up'));
  assert.ok(up.includes('--no-build'));
  assert.ok(up.indexOf('compose.yml') < up.indexOf('compose.postgres.yml'));
  assert.ok(up.indexOf('compose.postgres.yml') < up.indexOf('compose.https.yml'));
  assert.ok(up.includes('compose.certbot.yml'));
  assert.ok(up.includes('love-test'));
  assert.ok(calls.some((x) => x.includes('ps')));
  assert.ok(calls.every((x) => !x.includes('--build') && x[0] !== 'build'));
});
test('menu downloads public Release image, verifies checksum, loads and saves source without evaluating secrets', async (t) => {
  const { calls, result, config } = await launch(
    t,
    base + "ADMIN_PASSWORD='$(touch injected)'\n",
    '11\n1\n2\n0\n',
  );
  assert.equal(result.status, 0);
  assert.ok(calls.some((x) => x[0] === 'load'));
  assert.ok(calls.some((x) => x[0] === 'curl' && x[1].endsWith('SHA256SUMS')));
  assert.ok(calls.every((x) => x[0] !== 'pull' && x[0] !== 'build'));
  assert.match(config, /LOVE_IMAGE_SOURCE='release'/);
  assert.match(config, /LOVE_IMAGE='love-app:prebuilt'/);
});
test('corrupt Release archive is never loaded and existing configuration is kept', async (t) => {
  const { calls, config, result } = await launch(t, base, '11\n1\n0\n', { corrupt: true });
  assert.equal(result.status, 0);
  assert.ok(!calls.some((x) => x[0] === 'load'));
  assert.equal(config, base);
  assert.match(result.stderr, /校验失败/);
});
test('missing registry image is pulled before start and existing images do not pull during inspection', async (t) => {
  const a = await launch(t, base, '2\n0\n', { missing: true });
  assert.ok(a.calls.some((x) => x[0] === 'pull'));
  const b = await launch(t, base, '5\n6\n0\n');
  assert.ok(!b.calls.some((x) => x[0] === 'pull' || x[0] === 'build'));
  assert.ok(b.calls.some((x) => x.includes('logs')));
});
test('HTTPS modes select only required overlays', async (t) => {
  for (const tls of ['certbot', 'caddy', 'external', 'none']) {
    const { calls } = await launch(
      t,
      base.replace(
        "LOVE_HTTPS='0'",
        `LOVE_HTTPS='${tls === 'none' ? '0' : '1'}'\nLOVE_TLS_PROVIDER='${tls}'`,
      ),
      '2\n0\n',
    );
    const up = calls.find((x) => x.includes('up'));
    assert.equal(up.includes('compose.https.yml'), ['caddy', 'certbot'].includes(tls));
    assert.equal(up.includes('compose.certbot.yml'), tls === 'certbot');
  }
});
test('backup stops writers, archives volume and resumes app; uninstall defaults to preserving volumes', async (t) => {
  const { calls, dir } = await launch(t, base, '8\n12\n\ny\n0\n');
  const stop = calls.findIndex((x) => x.includes('stop') && x.at(-1) === 'love'),
    archive = calls.findIndex((x) => x[0] === 'run' && x.includes('tar')),
    resume = calls.findIndex((x) => x.includes('start'));
  assert.ok(stop < archive && archive < resume);
  assert.ok(calls[archive].includes('type=volume,src=love-test_love-data,dst=/data,readonly'));
  const down = calls.find((x) => x.includes('down'));
  assert.ok(!down.includes('--volumes'));
  const files = execFileSync('find', [join(dir, 'backups'), '-name', 'SHA256SUMS'], {
    encoding: 'utf8',
  });
  assert.ok(files.includes('SHA256SUMS'));
});
test('data deletion requires exact deployment-specific confirmation; subcommands are rejected', async (t) => {
  const no = await launch(t, base, '12\n2\nDELETE-another\n0\n');
  assert.ok(!no.calls.some((x) => x.includes('down')));
  const yes = await launch(t, base, '12\n2\nDELETE-love-test\n0\n');
  assert.ok(yes.calls.some((x) => x.includes('down') && x.includes('--volumes')));
  const old = await launch(t, base, '', { args: ['up'] });
  assert.equal(old.result.status, 1);
  assert.match(old.result.stderr, /直接运行/);
});
