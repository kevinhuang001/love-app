import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setup, quoteEnv, parseDeploymentEnv, validateConfig } from './setup.mjs';
const fakeUI = (options = {}) => ({
  intro() {},
  note() {},
  outro() {},
  isCancel: (value) => typeof value === 'symbol',
  text: async (p) => {
    if (p.message === 'HTTPS 访问端口' && options.tlsPort) {
      assert.equal(p.validate?.(options.tlsPort), undefined);
      return options.tlsPort;
    }
    if (p.message === '访问域名' && options.domain) {
      assert.equal(p.validate?.(options.domain), undefined);
      return options.domain;
    }
    if (p.message === 'Certbot 联系邮箱') return options.email || 'admin@example.test';
    if (p.message.startsWith('宿主机 IP') && options.ip) {
      assert.equal(p.validate?.(options.ip), undefined);
      return options.ip;
    }
    assert.equal(p.validate?.(''), undefined, 'Enter accepts the displayed default');
    return p.defaultValue;
  },
  password: async () => '',
  select: async (p) =>
    p.message === '选择数据库'
      ? options.database || 'sqlite'
      : /^(HTTP|HTTPS) 监听地址（宿主机）$/.test(p.message)
        ? options.bind || p.initialValue
        : p.message === 'HTTPS 证书方式'
          ? options.tls || p.initialValue
          : p.initialValue,
  confirm: async (p) =>
    p.message === '使用 HTTPS？'
      ? options.https || false
      : p.message === '现在配置 SMTP 和邮箱注册？'
        ? false
        : options.save !== false,
});
test('setup selects HTTP without certificates, or HTTPS with Certbot, Caddy or existing proxy', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-setup-tls-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const tls of ['certbot', 'caddy', 'external', 'none']) {
    const output = join(dir, tls + '.env');
    const config = await setup({
      output,
      ui: fakeUI({ https: tls !== 'none', tls }),
      env: { LOVE_DOMAIN: 'love.example.test' },
    });
    assert.equal(config.LOVE_HTTPS, tls === 'none' ? '0' : '1');
    assert.equal(config.LOVE_TLS_PROVIDER, tls);
    assert.equal(config.CERTBOT_EMAIL, tls === 'certbot' ? 'admin@example.test' : undefined);
    assert.equal(config.TRUST_PROXY, tls === 'none' ? '0' : '1');
    const repeated = await setup({ output, ui: fakeUI({ https: tls !== 'none' }), env: {} });
    assert.equal(repeated.LOVE_TLS_PROVIDER, tls);
    if (tls === 'certbot') {
      assert.throws(() => validateConfig({ ...config, CERTBOT_EMAIL: '' }), /Certbot 邮箱/);
      assert.throws(() => validateConfig({ ...config, LOVE_TLS_PROVIDER: 'unknown' }), /证书方式/);
    }
  }
});
test('bundled HTTPS trusts its private proxy; externally exposed HTTP does not trust proxy headers', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-setup-proxy-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const bind of ['127.0.0.1', '0.0.0.0']) {
    const config = await setup({
      output: join(dir, bind + '.env'),
      ui: fakeUI({ bind, https: true }),
      env: { LOVE_DOMAIN: 'love.example.test' },
    });
    assert.equal(config.TRUST_PROXY, '1');
    const external = await setup({
      output: join(dir, 'external-' + bind + '.env'),
      ui: fakeUI({ bind, https: true, tls: 'external' }),
      env: { LOVE_DOMAIN: 'love.example.test' },
    });
    assert.equal(external.TRUST_PROXY, bind === '127.0.0.1' ? '1' : '0');
  }
});
test('custom HTTPS port appears in access URL and allowed origin and survives setup', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-setup-tls-port-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, '.env'),
    notes = [];
  const ui = {
    ...fakeUI({ https: true, tlsPort: '8013', bind: '0.0.0.0' }),
    note: (value) => notes.push(value),
  };
  const config = await setup({ output, ui, env: { LOVE_DOMAIN: 'kevinhuang.top' } });
  assert.equal(config.LOVE_TLS_PORT, '8013');
  assert.equal(config.LOVE_TLS_BIND_IP, '0.0.0.0');
  assert.equal(config.LOVE_BIND_IP, '127.0.0.1');
  assert.match(config.ALLOWED_ORIGINS, /^https:\/\/kevinhuang.top:8013,/);
  assert.ok(
    notes.some(
      (text) =>
        text.includes('HTTPS 监听：0.0.0.0:8013') &&
        text.includes('访问：https://kevinhuang.top:8013'),
    ),
  );
  const repeated = await setup({ output, ui: fakeUI({ https: true }), env: {} });
  assert.equal(repeated.LOVE_TLS_PORT, '8013');
  assert.equal(repeated.LOVE_TLS_BIND_IP, '0.0.0.0');
  assert.throws(() => validateConfig({ ...config, LOVE_TLS_PORT: '80' }), /80 端口冲突/);
});
test('existing HTTP deployment switches to Certbot HTTPS and back while retaining credentials', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-setup-switch-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, '.env');
  const original = await setup({ output, ui: fakeUI({ bind: '0.0.0.0' }), env: {} });
  const secure = await setup({
    output,
    ui: fakeUI({ https: true, domain: 'love.example.test', bind: '127.0.0.1' }),
    env: {},
  });
  assert.equal(secure.LOVE_TLS_PROVIDER, 'certbot');
  assert.equal(secure.TRUST_PROXY, '1');
  assert.equal(secure.MEDIA_SIGNING_SECRET, original.MEDIA_SIGNING_SECRET);
  assert.equal(secure.ADMIN_PASSWORD, original.ADMIN_PASSWORD);
  const plain = await setup({ output, ui: fakeUI({ bind: '0.0.0.0' }), env: {} });
  assert.equal(plain.LOVE_HTTPS, '0');
  assert.equal(plain.LOVE_TLS_PROVIDER, 'none');
  assert.equal(plain.TRUST_PROXY, '0');
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
  assert.equal(stored.LOVE_BIND_IP, '127.0.0.1');
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
test('public and specific interface bindings persist and cannot inject Compose port syntax', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-setup-bind-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const ip of ['0.0.0.0', '192.168.1.10', '::1']) {
    const output = join(dir, ip.replaceAll(':', '_') + '.env');
    const config = await setup({
      output,
      ui: fakeUI({ bind: ip === '0.0.0.0' ? ip : 'custom', ip }),
      env: {},
    });
    assert.equal(config.LOVE_BIND_IP, ip);
    assert.equal(config.TRUST_PROXY, '0');
    const repeated = await setup({ output, ui: fakeUI({ ip }), env: {} });
    assert.equal(repeated.LOVE_BIND_IP, ip);
    for (const invalid of [
      'server.example.com',
      'http://0.0.0.0',
      '0.0.0.0:3000',
      '1.2.3.999',
      '::1%eth0',
    ])
      assert.throws(() => validateConfig({ ...config, LOVE_BIND_IP: invalid }), /监听 IP 无效/);
  }
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
