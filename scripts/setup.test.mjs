import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setup, quoteEnv, parseDeploymentEnv } from './setup.mjs';
const fakeUI = (options = {}) => ({
  intro() {},
  note() {},
  outro() {},
  isCancel: (value) => typeof value === 'symbol',
  text: async (p) => {
    assert.equal(p.validate?.(''), undefined, 'Enter accepts the displayed default');
    return p.defaultValue;
  },
  password: async () => '',
  select: async (p) => (p.message === '选择数据库' ? options.database || 'sqlite' : p.initialValue),
  confirm: async (p) =>
    p.message === '使用域名和自动 HTTPS？'
      ? false
      : p.message === '现在配置 SMTP 和邮箱注册？'
        ? false
        : options.save !== false,
});
test('first setup creates usable defaults, private secrets and PostgreSQL selection without exposing credentials', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-setup-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, '.env');
  const config = await setup({
    output,
    ui: fakeUI({ database: 'postgres' }),
    env: {
      LOVE_DOCKERFILE: 'Dockerfile.cn',
      LOVE_IMAGE: 'love-app:prebuilt',
      LOVE_IMAGE_PULL: '0',
    },
  });
  const stored = parseDeploymentEnv(await readFile(output, 'utf8'));
  assert.deepEqual(stored, config);
  assert.equal(stored.LOVE_DATABASE, 'postgres');
  assert.equal(stored.LOVE_DOCKERFILE, 'Dockerfile.cn');
  assert.equal(stored.LOVE_IMAGE, 'love-app:prebuilt');
  assert.equal(stored.LOVE_IMAGE_PULL, '0');
  assert.equal(stored.POSTGRES_DB, 'love');
  assert.equal(stored.DATABASE_PROVIDER, 'postgres');
  assert.equal(stored.ADMIN_USERNAME, 'admin');
  assert.equal(stored.INITIAL_QUOTA_MIB, '1024');
  assert.ok(stored.ADMIN_PASSWORD.length >= 12);
  assert.ok(stored.MEDIA_SIGNING_SECRET.length >= 32);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  const repeat = await setup({ output, ui: fakeUI({ database: 'postgres' }), env: {} });
  assert.equal(repeat.MEDIA_SIGNING_SECRET, stored.MEDIA_SIGNING_SECRET);
  assert.equal(repeat.POSTGRES_PASSWORD, stored.POSTGRES_PASSWORD);
  assert.equal(repeat.ADMIN_PASSWORD, stored.ADMIN_PASSWORD);
  assert.equal(repeat.LOVE_DOCKERFILE, 'Dockerfile.cn');
  assert.equal(repeat.LOVE_IMAGE, 'love-app:prebuilt');
  assert.equal(repeat.LOVE_IMAGE_PULL, '0');
});
test('cancelled reconfiguration leaves existing config intact', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-setup-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, '.env');
  await writeFile(output, 'CUSTOM_FLAG=preserved\n');
  await assert.rejects(setup({ output, ui: fakeUI({ save: false }), env: {} }), /SETUP_CANCELLED/);
  assert.equal(await readFile(output, 'utf8'), 'CUSTOM_FLAG=preserved\n');
});

test('Compose dotenv literals preserve dollars, quotes, hashes and backslashes', () => {
  const value = `p'a"ss$word#\\literal`;
  assert.equal(
    parseDeploymentEnv('ADMIN_PASSWORD=' + quoteEnv(value) + '\n').ADMIN_PASSWORD,
    value,
  );
});
