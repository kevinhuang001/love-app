// Run in Docker CI: verify actual Compose dotenv parsing, including sensitive punctuation.
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { quoteEnv } from './setup.mjs';
const dir = await mkdtemp(join(tmpdir(), 'love-compose-'));
try {
  const special = `postgres'pa"ss$word#\\literal`;
  const env = {
    MEDIA_SIGNING_SECRET: 'ci-compose-fixture-secret-at-least-32-characters',
    POSTGRES_PASSWORD: special,
    POSTGRES_USER: 'love',
    POSTGRES_DB: 'love',
    ADMIN_USERNAME: 'ci_admin',
    ADMIN_PASSWORD: special,
  };
  const file = join(dir, '.env');
  await writeFile(
    file,
    Object.entries(env)
      .map(([k, v]) => k + '=' + quoteEnv(v))
      .join('\n'),
  );
  const config = JSON.parse(
    execFileSync(
      'docker',
      [
        'compose',
        '--env-file',
        file,
        '-f',
        'compose.yml',
        '-f',
        'compose.postgres.yml',
        'config',
        '--format',
        'json',
      ],
      { encoding: 'utf8', env: { PATH: process.env.PATH, HOME: process.env.HOME } },
    ),
  );
  assert.equal(config.services.postgres.environment.POSTGRES_PASSWORD, special);
  assert.equal(config.services.love.environment.PGPASSWORD, special);
  assert.equal(config.services.love.environment.ADMIN_PASSWORD, special);
  assert.equal(config.services.love.environment.DATABASE_PROVIDER, 'postgres');
  assert.equal(config.services.postgres.ports, undefined);
  console.log('Compose accepted PostgreSQL deployment and preserved literal credentials.');
} finally {
  await rm(dir, { recursive: true, force: true });
}
