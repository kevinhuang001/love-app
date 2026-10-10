import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';

const encoded = process.env.LOVE_ANDROID_KEYSTORE_BASE64 || '';
const password = process.env.LOVE_ANDROID_KEYSTORE_PASSWORD || '';
if (Boolean(encoded) !== Boolean(password))
  throw new Error('LOVE_ANDROID_KEYSTORE_BASE64 和 LOVE_ANDROID_KEYSTORE_PASSWORD 必须一起配置');
const directory = process.env.RUNNER_TEMP || resolve('data/android-signing');
mkdirSync(directory, { recursive: true, mode: 0o700 });
let metadata = { mode: 'debug', certificateSha256: null };
if (encoded) {
  const compact = encoded.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) throw new Error('签名密钥不是有效的 Base64');
  const keystore = join(directory, 'love-signing.jks');
  writeFileSync(keystore, Buffer.from(compact, 'base64'), { mode: 0o600 });
  const alias = process.env.LOVE_ANDROID_KEY_ALIAS || 'love';
  const result = spawnSync(
    'keytool',
    [
      '-exportcert',
      '-rfc',
      '-keystore',
      keystore,
      '-storepass:env',
      'LOVE_ANDROID_KEYSTORE_PASSWORD',
      '-alias',
      alias,
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error('无法读取签名证书，请检查 keystore、密码和 alias');
  const certificate = new X509Certificate(result.stdout);
  metadata = {
    mode: 'release',
    certificateSha256: certificate.fingerprint256.replaceAll(':', '').toLowerCase(),
  };
  if (process.env.GITHUB_ENV)
    appendFileSync(process.env.GITHUB_ENV, `LOVE_ANDROID_KEYSTORE_PATH=${keystore}\n`);
}
const mode = metadata.mode;
writeFileSync(join(directory, 'love-signing.json'), JSON.stringify(metadata) + '\n');
if (process.env.GITHUB_OUTPUT)
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `mode=${mode}\napk=apps/client/android/app/build/outputs/apk/${mode}/app-${mode}.apk\nmetadata=${join(directory, 'love-signing.json')}\n`,
  );
console.log(
  mode === 'release'
    ? '使用固定签名密钥构建，可覆盖安装同签名版本。'
    : '未配置固定签名；仅构建 CI 调试 APK，不自动发布到 Release。',
);
