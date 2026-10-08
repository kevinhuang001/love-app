import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, copyFile, chmod, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function launch(t, config, overrides = {}, mode = 'up') {
  const dir = await mkdtemp(join(tmpdir(), 'love-launcher-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await copyFile(new URL('../love', import.meta.url), join(dir, 'love'));
  await writeFile(join(dir, '.env'), config);
  await mkdir(join(dir, 'bin'));
  const docker = join(dir, 'bin', 'docker');
  await writeFile(
    docker,
    `#!/usr/bin/env node
const fs = require('node:fs');
fs.appendFileSync(process.env.LOVE_LAUNCHER_TEST_LOG, JSON.stringify({args:process.argv.slice(2), image:process.env.LOVE_IMAGE, pull:process.env.LOVE_IMAGE_PULL})+'\\n');
`,
  );
  await chmod(docker, 0o755);
  const env = { ...process.env };
  for (const key of ['LOVE_IMAGE', 'LOVE_IMAGE_PULL', 'LOVE_DOCKERFILE']) delete env[key];
  Object.assign(env, {
    PATH: join(dir, 'bin') + ':' + env.PATH,
    LOVE_LAUNCHER_TEST_LOG: join(dir, 'calls'),
    ...overrides,
  });
  execFileSync('sh', ['love', mode], { cwd: dir, env, encoding: 'utf8' });
  return (await readFile(join(dir, 'calls'), 'utf8')).trim().split('\n').map(JSON.parse);
}

test('registry deployment pulls saved image and starts without build while preserving Compose selection', async (t) => {
  const calls = await launch(
    t,
    "LOVE_IMAGE='ghcr.io/kevinhuang001/love-app:sha-abcdef'\nLOVE_DATABASE='postgres'\nLOVE_HTTPS='1'\nCOMPOSE_PROJECT_NAME='love-test'\n",
  );
  assert.deepEqual(calls.find((x) => x.args[0] === 'pull').args, [
    'pull',
    'ghcr.io/kevinhuang001/love-app:sha-abcdef',
  ]);
  const up = calls.at(-1);
  assert.ok(up.args.includes('--no-build'));
  assert.ok(!up.args.includes('--build'));
  assert.ok(up.args.includes('compose.postgres.yml'));
  assert.ok(up.args.includes('https'));
  assert.ok(up.args.includes('love-test'));
  assert.equal(up.image, 'ghcr.io/kevinhuang001/love-app:sha-abcdef');
  assert.ok(calls.every((x) => x.args[0] !== 'build'));
});

test('loaded Release image is inspected locally and never pulled or built', async (t) => {
  const calls = await launch(t, "LOVE_IMAGE='love-app:prebuilt'\nLOVE_IMAGE_PULL='0'\n");
  assert.ok(calls.some((x) => x.args.join(' ') === 'image inspect love-app:prebuilt'));
  assert.ok(calls.every((x) => !['pull', 'build'].includes(x.args[0])));
  assert.ok(calls.at(-1).args.includes('--no-build'));
  assert.equal(calls.at(-1).pull, '0');
});

test('local build remains available and log inspection does not pull an image', async (t) => {
  const build = await launch(t, "LOVE_DOCKERFILE='Dockerfile.cn'\n");
  assert.ok(build.at(-1).args.includes('--build'));
  assert.ok(!build.at(-1).args.includes('--no-build'));
  const logs = await launch(t, "LOVE_IMAGE='ghcr.io/kevinhuang001/love-app:latest'\n", {}, 'logs');
  assert.ok(logs.every((x) => !['pull', 'build'].includes(x.args[0])));
  assert.deepEqual(logs.at(-1).args.slice(-2), ['logs', '-f']);
});
