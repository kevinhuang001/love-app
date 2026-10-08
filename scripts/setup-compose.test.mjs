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
    LOVE_BIND_IP: '0.0.0.0',
    LOVE_DOCKERFILE: process.env.LOVE_DOCKERFILE || 'Dockerfile',
    MEDIA_SIGNING_SECRET: 'ci-compose-fixture-secret-at-least-32-characters',
    POSTGRES_PASSWORD: special,
    POSTGRES_USER: 'love',
    POSTGRES_DB: 'love',
    ADMIN_USERNAME: 'ci_admin',
    ADMIN_PASSWORD: special,
    LOVE_DOMAIN: 'love.example.test',
    CERTBOT_EMAIL: 'admin@example.test',
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
  assert.equal(config.services.love.ports[0].host_ip, '0.0.0.0');
  assert.equal(config.services.love.ports[0].target, 3000);
  for (const ip of ['127.0.0.1', '192.168.1.10', '::1']) {
    const selected = JSON.parse(
      execFileSync(
        'docker',
        ['compose', '--env-file', file, '-f', 'compose.yml', 'config', '--format', 'json'],
        {
          encoding: 'utf8',
          env: { PATH: process.env.PATH, HOME: process.env.HOME, LOVE_BIND_IP: ip },
        },
      ),
    );
    assert.equal(selected.services.love.ports[0].host_ip, ip);
  }
  assert.equal(config.services.postgres.ports, undefined);
  const tls = JSON.parse(
    execFileSync(
      'docker',
      [
        'compose',
        '--env-file',
        file,
        '-f',
        'compose.yml',
        '-f',
        'compose.certbot.yml',
        '--profile',
        'https',
        'config',
        '--format',
        'json',
      ],
      { encoding: 'utf8', env: { PATH: process.env.PATH, HOME: process.env.HOME } },
    ),
  );
  assert.equal(tls.services.certbot.environment.CERTBOT_EMAIL, 'admin@example.test');
  assert.deepEqual(tls.services.proxy.entrypoint, ['/bin/sh', '/opt/love/certbot-proxy.sh']);
  assert.ok(
    tls.services.proxy.volumes.some(
      (volume) => volume.target === '/etc/letsencrypt' && volume.read_only,
    ),
  );
  assert.ok(
    tls.services.certbot.volumes.some(
      (volume) => volume.target === '/etc/letsencrypt' && !volume.read_only,
    ),
  );
  assert.ok(tls.services.proxy.healthcheck.test[1].includes('love-tls-ready'));
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
