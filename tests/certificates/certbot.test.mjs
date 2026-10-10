import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, chmod, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Certbot issues once, renews persisted certificates and retries failures without a tight loop', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-certbot-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const bin = join(dir, 'bin'),
    log = join(dir, 'calls'),
    config = join(dir, 'certs');
  await mkdir(bin);
  await writeFile(
    join(bin, 'certbot'),
    `#!/bin/sh
printf '%s\\n' "$*" >> "$TEST_CALLS"
if [ "\${TEST_FAIL:-}" = "$1" ]; then exit 1; fi
if [ "$1" = certonly ]; then
  mkdir -p "$CERTBOT_CONFIG_DIR/live/$LOVE_DOMAIN"
  printf 'fixture' > "$CERTBOT_CONFIG_DIR/live/$LOVE_DOMAIN/fullchain.pem"
fi
`,
  );
  await writeFile(
    join(bin, 'sleep'),
    `#!/bin/sh
printf 'sleep %s\\n' "$1" >> "$TEST_CALLS"
kill -TERM "$PPID"
`,
  );
  for (const name of ['certbot', 'sleep']) await chmod(join(bin, name), 0o755);
  const run = async (fail = '') => {
    await writeFile(log, '');
    execFileSync('sh', ['infra/certificates/certbot-renew.sh'], {
      env: {
        ...process.env,
        PATH: bin + ':' + process.env.PATH,
        TEST_CALLS: log,
        TEST_FAIL: fail,
        CERTBOT_CONFIG_DIR: config,
        CERTBOT_WEBROOT: join(dir, 'webroot'),
        LOVE_DOMAIN: 'love.example.test',
        CERTBOT_EMAIL: 'admin@example.test',
      },
      stdio: 'pipe',
      timeout: 5000,
    });
    return await readFile(log, 'utf8');
  };
  assert.match(await run('certonly'), /certonly.*--webroot.*--domain love.example.test\nsleep 900/);
  const first = await run();
  assert.match(first, /certonly.*--agree-tos.*--email admin@example.test/);
  assert.match(first, /renew.*--cert-name love.example.test.*--webroot/);
  assert.match(first, /sleep 43200/);
  assert.doesNotMatch(await run(), /certonly/);
  const failedRenewal = await run('renew');
  assert.doesNotMatch(failedRenewal, /certonly/);
  assert.match(failedRenewal, /sleep 900/);
});
