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
    LOVE_IMAGE: 'love-ci',
    LOVE_DOCKERFILE: process.env.LOVE_DOCKERFILE || 'Dockerfile',
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
  // Compose config escapes dollars for its re-loadable serialization.
  const literal = (value) => value.replaceAll('$$', '$');
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
  assert.equal(literal(config.services.postgres.environment.POSTGRES_PASSWORD), special);
  assert.equal(literal(config.services.love.environment.PGPASSWORD), special);
  assert.equal(literal(config.services.love.environment.ADMIN_PASSWORD), special);
  assert.equal(config.services.love.environment.DATABASE_PROVIDER, 'postgres');
  assert.equal(config.services.love.build.dockerfile, env.LOVE_DOCKERFILE);
  assert.equal(config.services.postgres.ports, undefined);
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
      'run',
      '--rm',
      '--no-deps',
      '--entrypoint',
      'node',
      'love',
      '--input-type=module',
      '-e',
      "import assert from 'node:assert/strict'; assert.equal(process.env.PGPASSWORD, process.argv[1]); assert.equal(process.env.ADMIN_PASSWORD, process.argv[1]); console.log('Container credentials preserved.');",
      special,
    ],
    { encoding: 'utf8', env: { PATH: process.env.PATH, HOME: process.env.HOME } },
  );
  console.log('Compose and the running container preserved literal credentials.');
} finally {
  await rm(dir, { recursive: true, force: true });
}
