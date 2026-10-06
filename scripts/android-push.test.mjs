import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  copyFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { configureChinaPush } from './android-push.mjs';

test('Android build rejects server secrets, incomplete vendor keys and missing Huawei config before packaging', () => {
  const previous = process.env.JPUSH_ANDROID_CONFIG,
    ag = process.env.AGCONNECT_SERVICES_JSON;
  delete process.env.AGCONNECT_SERVICES_JSON;
  try {
    for (const [input, error] of [
      [{ appKey: 'a'.repeat(24), masterSecret: 'server-only-value' }, /MasterSecret/],
      [{ appKey: 'a'.repeat(24), oppo: { appId: '123' } }, /不完整/],
      [{ appKey: 'a'.repeat(24), xiaomi: { appId: '123', appKey: '${injected}' } }, /格式错误/],
      [{ appKey: 'a'.repeat(24), huawei: true }, /AGCONNECT/],
    ]) {
      process.env.JPUSH_ANDROID_CONFIG = JSON.stringify(input);
      assert.throws(
        () =>
          configureChinaPush(
            '/tmp/love-test-not-generated',
            '/tmp/love-test-not-generated/app',
            '/tmp/love-empty-config-fixture',
          ),
        error,
      );
    }
  } finally {
    if (previous === undefined) delete process.env.JPUSH_ANDROID_CONFIG;
    else process.env.JPUSH_ANDROID_CONFIG = previous;
    if (ag === undefined) delete process.env.AGCONNECT_SERVICES_JSON;
    else process.env.AGCONNECT_SERVICES_JSON = ag;
  }
});

test('prepared native project is repeatable, keeps every SDK and removes stale credentials when disabled', () => {
  const dir = mkdtempSync(join(tmpdir(), 'love-native-'));
  const client = resolve(dir, 'client'),
    app = resolve(client, 'android/app');
  const previous = process.env.JPUSH_ANDROID_CONFIG,
    ag = process.env.AGCONNECT_SERVICES_JSON;
  try {
    mkdirSync(resolve(app, 'src/main'), { recursive: true });
    // Copy only source templates, never a generated APK or any real key.
    mkdirSync(resolve(client, 'native'));
    for (const name of [
      'MainActivity',
      'ChinaPushPlugin',
      'LovePushReceiver',
      'PushClickActivity',
      'LovePushService',
    ])
      copyFileSync(
        resolve('apps/client/native', name + '.java'),
        resolve(client, 'native', name + '.java'),
      );
    writeFileSync(resolve(app, 'build.gradle'), 'android { defaultConfig {} }');
    writeFileSync(
      resolve(client, 'android/build.gradle'),
      'buildscript { repositories { mavenCentral() } dependencies {} }\nallprojects { repositories { mavenCentral() } }',
    );
    writeFileSync(
      resolve(app, 'src/main/AndroidManifest.xml'),
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application></application></manifest>',
    );
    process.env.JPUSH_ANDROID_CONFIG = JSON.stringify({
      appKey: 'a'.repeat(24),
      xiaomi: { appId: '123', appKey: 'key' },
      oppo: { appId: '123', appKey: 'key', appSecret: 'client-only' },
      meizu: { appId: '123456', appKey: 'key' },
    });
    delete process.env.AGCONNECT_SERVICES_JSON;
    configureChinaPush(client, app, resolve(dir, 'no-config'));
    configureChinaPush(client, app, resolve(dir, 'no-config'));
    const manifest = readFileSync(resolve(app, 'src/main/AndroidManifest.xml'), 'utf8');
    assert.equal((manifest.match(/android:name="\.LovePushReceiver"/g) || []).length, 1);
    assert.equal(
      (
        readFileSync(resolve(app, 'build.gradle'), 'utf8').match(
          /apply from: 'love-push.gradle'/g,
        ) || []
      ).length,
      1,
    );
    const gradle = readFileSync(resolve(app, 'love-push.gradle'), 'utf8');
    for (const vendor of ['huawei', 'honor', 'xiaomi', 'oppo', 'vivo', 'meizu'])
      assert.ok(gradle.includes(`sdk.plugin:${vendor}:6.2.0`));
    assert.ok(gradle.includes('OP-client-only'));
    assert.ok(gradle.includes('MZ-123456'));
    writeFileSync(resolve(app, 'agconnect-services.json'), '{"stale":"discard-this-build-config"}');
    process.env.JPUSH_ANDROID_CONFIG = '{}';
    assert.equal(configureChinaPush(client, app, resolve(dir, 'no-config')).jpushConfigured, false);
    assert.equal(existsSync(resolve(app, 'agconnect-services.json')), false);
    assert.ok(!readFileSync(resolve(app, 'love-push.gradle'), 'utf8').includes('client-only'));
  } finally {
    if (previous === undefined) delete process.env.JPUSH_ANDROID_CONFIG;
    else process.env.JPUSH_ANDROID_CONFIG = previous;
    if (ag === undefined) delete process.env.AGCONNECT_SERVICES_JSON;
    else process.env.AGCONNECT_SERVICES_JSON = ag;
    rmSync(dir, { recursive: true, force: true });
  }
});
