import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

test('fixed Android signing key yields the same public certificate across separate CI workspaces', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'love-signing-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const path = join(root, 'fixture.jks'),
    password = 'test-fixture-password';
  const generated = spawnSync(
    'keytool',
    [
      '-genkeypair',
      '-keystore',
      path,
      '-storepass',
      password,
      '-keypass',
      password,
      '-alias',
      'love',
      '-dname',
      'CN=CI Test',
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '3650',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(generated.status, 0);
  const encoded = readFileSync(path).toString('base64');
  const fingerprints = [];
  for (const run of ['one', 'two']) {
    const dir = join(root, run),
      outputs = join(root, run + '-outputs'),
      environment = join(root, run + '-env');
    const result = spawnSync(process.execPath, ['tools/android/signing-key.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        RUNNER_TEMP: dir,
        LOVE_ANDROID_KEYSTORE_BASE64: encoded,
        LOVE_ANDROID_KEYSTORE_PASSWORD: password,
        LOVE_ANDROID_KEY_ALIAS: 'love',
        GITHUB_OUTPUT: outputs,
        GITHUB_ENV: environment,
      },
    });
    assert.equal(result.status, 0);
    const metadata = JSON.parse(readFileSync(join(dir, 'love-signing.json'), 'utf8'));
    assert.equal(metadata.mode, 'release');
    assert.match(metadata.certificateSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(Object.keys(metadata).sort(), ['certificateSha256', 'mode']);
    fingerprints.push(metadata.certificateSha256);
    assert.equal(statSync(join(dir, 'love-signing.jks')).mode & 0o777, 0o600);
    assert.match(readFileSync(environment, 'utf8'), /LOVE_ANDROID_KEYSTORE_PATH=/);
    assert.match(readFileSync(outputs, 'utf8'), /mode=release/);
    assert.ok(!result.stdout.includes(encoded) && !result.stdout.includes(password));
  }
  assert.equal(fingerprints[0], fingerprints[1]);
});

test('missing signing secrets allow debug checks; incomplete secrets fail instead of silently changing identity', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'love-signing-empty-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = {
    ...process.env,
    RUNNER_TEMP: root,
    LOVE_ANDROID_KEYSTORE_BASE64: '',
    LOVE_ANDROID_KEYSTORE_PASSWORD: '',
    GITHUB_OUTPUT: '',
    GITHUB_ENV: '',
  };
  const debug = spawnSync(process.execPath, ['tools/android/signing-key.mjs'], {
    env,
    encoding: 'utf8',
  });
  assert.equal(debug.status, 0);
  assert.equal(JSON.parse(readFileSync(join(root, 'love-signing.json'), 'utf8')).mode, 'debug');
  const partial = spawnSync(process.execPath, ['tools/android/signing-key.mjs'], {
    env: { ...env, LOVE_ANDROID_KEYSTORE_PASSWORD: 'incomplete' },
    encoding: 'utf8',
  });
  assert.notEqual(partial.status, 0);
});
