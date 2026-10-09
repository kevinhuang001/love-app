import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { prepareMigration } from './database-migration.mjs';
import { parseDeploymentEnv, quoteEnv } from './setup.mjs';
test('target preparation changes only database deployment values and never source config or keys; cancellation writes nothing', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-migration-config-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const source = join(dir, '.env'),
    output = join(dir, 'target.env');
  const config = {
    LOVE_DATABASE: 'sqlite',
    DATABASE_PROVIDER: 'sqlite',
    DATABASE_URL: '',
    LOVE_IMAGE: 'ghcr.io/kevinhuang001/love-app:latest',
    MEDIA_SIGNING_SECRET: 'migration-stable-signing-key-at-least-32',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: `long'password$with\\literal`,
    LOVE_PORT: '8013',
    LOVE_BIND_IP: '0.0.0.0',
    LOVE_HTTPS: '0',
    ALLOWED_ORIGINS: 'https://localhost,capacitor://localhost',
  };
  const original = Object.entries(config)
    .map(([key, value]) => `${key}=${quoteEnv(value)}`)
    .join('\n');
  await writeFile(source, original);
  for (const database of ['postgres', 'external']) {
    const ui = {
      intro() {},
      note() {},
      outro() {},
      isCancel: (value) => typeof value === 'symbol',
      select: async () => database,
      text: async (options) =>
        options.message.includes('MIGRATE') ? 'MIGRATE' : options.defaultValue,
      password: async (options) =>
        options.message.includes('URL')
          ? 'postgresql://love:encoded%40password@db.example.test:5432/love?sslmode=verify-full'
          : `db'password$with\\literal`,
    };
    await prepareMigration({ source, output, ui });
    const target = parseDeploymentEnv(await readFile(output, 'utf8'));
    for (const key of [
      'MEDIA_SIGNING_SECRET',
      'ADMIN_PASSWORD',
      'LOVE_PORT',
      'LOVE_BIND_IP',
      'LOVE_IMAGE',
      'ALLOWED_ORIGINS',
    ])
      assert.equal(target[key], config[key]);
    assert.equal(target.LOVE_DATABASE, database);
    assert.equal(target.DATABASE_PROVIDER, 'postgres');
    assert.equal(target.LOVE_DATA_VOLUME, 'postgres-work');
    assert.equal(await readFile(source, 'utf8'), original);
    await rm(output);
    await assert.rejects(
      prepareMigration({ source, output, ui: { ...ui, select: async () => Symbol('cancel') } }),
      /MIGRATION_CANCELLED/,
    );
    await assert.rejects(readFile(output), { code: 'ENOENT' });
  }
});
