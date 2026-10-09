// Real Compose integration: manager code runs on the host, never in helper containers.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm, mkdir, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { Manager, runCommand } from '../deploy/manager.mjs';
import { quoteEnv } from './setup.mjs';
import { openDatabase } from '../apps/server/src/db.ts';
import { MediaRepository } from '../apps/server/src/media-repository.ts';
const templateNames = [
  'compose.yml',
  'compose.postgres.yml',
  'compose.https.yml',
  'compose.certbot.yml',
  'compose.storage.yml',
  'Caddyfile',
  'deploy/certbot-proxy.sh',
  'deploy/certbot-renew.sh',
];
const templates = Object.fromEntries(
  await Promise.all(templateNames.map(async (n) => [n, await readFile(n, 'utf8')])),
);
execFileSync('docker', ['tag', 'love-ci', 'ghcr.io/kevinhuang001/love-app:ci']);
const binary = process.env.MANAGER_BINARY;
assert.ok(binary, 'MANAGER_BINARY must point to the tested executable');
const native = await mkdtemp(join(tmpdir(), 'love-native-empty-'));
try {
  await copyFile(binary, join(native, 'love'));
  execFileSync(join(native, 'love'), ['--self-test'], {
    cwd: native,
    env: { PATH: '/usr/bin:/bin' },
    stdio: 'inherit',
  });
} finally {
  await rm(native, { recursive: true, force: true });
}
async function availablePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return String(port);
}
let firstBackup;
const directories = [];
for (const database of ['sqlite', 'postgres']) {
  const directory = await mkdtemp(join(tmpdir(), 'love-host-manager-' + database + '-'));
  directories.push(directory);
  const project = 'love-host-manager-' + database + '-ci',
    calls = [];
  let selected = '',
    confirmations = [];
  const ui = {
    isCancel: (x) => typeof x === 'symbol',
    log: { error: console.error },
    confirm: async () => true,
    select: async (p) =>
      p.options.some((x) => x.value === 'skip')
        ? 'skip'
        : p.options.some((x) => x.value === 'recover')
          ? 'recover'
          : p.options.some((x) => x.value === 'quick')
            ? 'deep'
            : selected,
    text: async () => 'RESTORE',
  };
  const config = {
    LOVE_IMAGE: 'ghcr.io/kevinhuang001/love-app:ci',
    COMPOSE_PROJECT_NAME: project,
    LOVE_DATABASE: database,
    DATABASE_PROVIDER: database === 'sqlite' ? 'sqlite' : 'postgres',
    DATABASE_URL: '',
    LOVE_HTTPS: '0',
    LOVE_BIND_IP: '127.0.0.1',
    LOVE_PORT: await availablePort(),
    MEDIA_SIGNING_SECRET: 'ci-native-manager-secret-of-at-least-32-characters',
    ADMIN_USERNAME: 'ci_admin',
    ADMIN_PASSWORD: 'ci-native-admin-password',
    POSTGRES_USER: 'love',
    POSTGRES_DB: 'love',
    POSTGRES_PASSWORD: `ci-native'pa"ss$word#\\literal`,
  };
  const save = async () =>
    writeFile(
      join(directory, '.env'),
      Object.entries(config)
        .map(([k, v]) => k + '=' + quoteEnv(v))
        .join('\n') + '\n',
      { mode: 0o600 },
    );
  await save();
  const manager = new Manager({
    directory,
    executable: join(directory, 'love'),
    version: JSON.parse(await readFile('package.json', 'utf8')).version,
    source: '0'.repeat(40),
    templates,
    ui,
    run: async (a, o) => {
      calls.push(a);
      return runCommand(a, o);
    },
  });
  await manager.reload();
  await manager.installTemplates();
  try {
    await manager.start();
    if (database === 'sqlite') {
      const seed = project + '-image-seed',
        stopped = project + '-other-stopped',
        tag = 'ghcr.io/kevinhuang001/love-app:cleanup-fixture';
      try {
        execFileSync('docker', ['create', '--name', seed, 'love-ci']);
        execFileSync('docker', [
          'commit',
          '--change',
          'LABEL org.opencontainers.image.source=https://github.com/kevinhuang001/love-app',
          '--change',
          'LABEL org.opencontainers.image.version=0.0.0',
          seed,
          tag,
        ]);
        execFileSync('docker', ['rm', seed]);
        execFileSync('docker', ['create', '--name', stopped, tag]);
        const current = await manager.currentImage();
        await manager.pruneOldImages(current);
        execFileSync('docker', ['image', 'inspect', tag], { stdio: 'ignore' });
        execFileSync('docker', ['rm', stopped]);
        await manager.pruneOldImages(current);
        assert.throws(() => execFileSync('docker', ['image', 'inspect', tag], { stdio: 'ignore' }));
        console.log(
          'Old image cleanup preserves stopped deployments and removes unused Love images.',
        );
      } finally {
        for (const name of [seed, stopped]) {
          try {
            execFileSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
          } catch {
            /* Already removed during the test. */
          }
        }
      }
    }
    await manager.paused(() =>
      manager.withDatabase(async (db, location) => {
        await db.prepare('INSERT INTO couples(id) VALUES(?)').run('pair');
        await db
          .prepare(
            'INSERT INTO users(id,username,name,password,coupleId,email) VALUES(?,?,?,?,?,?)',
          )
          .run('user', 'user', 'User', 'hash', 'pair', 'user@example.test');
      }),
    );
    const backup = await manager.backup();
    selected = backup.split('/').at(-1);
    const originalEnv = await readFile(join(directory, '.env'), 'utf8');
    await manager.paused(() =>
      manager.withDatabase((db) => db.prepare('UPDATE users SET name=?').run('Changed')),
    );
    await manager.restore();
    assert.equal(await readFile(join(directory, '.env'), 'utf8'), originalEnv);
    await manager.paused(() =>
      manager.withDatabase(async (db) =>
        assert.equal((await db.prepare('SELECT name FROM users').get()).name, 'User'),
      ),
    );
    await manager.check();
    await manager.cleanup();
    if (database === 'sqlite') firstBackup = backup;
    else {
      // Import a SQLite-source archive into the current PostgreSQL target.
      selected = 'sqlite-source';
      const cross = join(directory, 'backups', selected);
      await mkdir(cross);
      for (const name of ['deployment.env', 'data.tar.gz', 'SHA256SUMS'])
        await copyFile(join(firstBackup, name), join(cross, name));
      await manager.restore();
      await manager.paused(() =>
        manager.withDatabase(async (db) =>
          assert.equal((await db.prepare('SELECT COUNT(*) n FROM users').get()).n, 1),
        ),
      );
      // Exercise external-URL mode against the existing PostgreSQL service without starting it again.
      const location = await manager.databaseLocation();
      const marker = calls.length;
      config.LOVE_DATABASE = 'external';
      config.DATABASE_URL = location.path;
      await save();
      await manager.reload();
      await manager.backup();
      await manager.restore();
      assert.ok(!calls.slice(marker).some((a) => a.includes('up') && a.at(-1) === 'postgres'));
      // A fresh deployment connects to an existing remote database as-is.
      // The source PostgreSQL belongs to another Compose project and stays running.
      const bytes = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQkAAAAASUVORK5CYII=',
          'base64',
        ),
        name = 'remote-avatar.png';
      await manager.paused(() =>
        manager.withDatabase(async (db, source) => {
          await writeFile(join(source.directory, name), bytes);
          const repository = new MediaRepository(db, source.directory);
          await repository.stage([name], [bytes.length]);
          await db.transaction(async () => {
            await db
              .prepare(
                'INSERT INTO media(id,coupleId,ownerId,kind,original,preview,thumbnail,createdAt) VALUES(?,?,?,?,?,?,?,?)',
              )
              .run('remote-avatar', 'pair', 'user', 'image', name, name, name, '2026-10-09');
            await db
              .prepare('INSERT INTO media_sizes VALUES(?,?,?,?,?)')
              .run('remote-avatar', bytes.length, 0, 0, bytes.length);
            await repository.bind('remote-avatar', [name]);
            await db
              .prepare('UPDATE users SET avatarMediaId=? WHERE id=?')
              .run('remote-avatar', 'user');
            await db
              .prepare(
                'INSERT INTO couple_ai_settings(coupleId,baseUrl,model,secret,enabled,name,avatarMediaId) VALUES(?,?,?,?,?,?,?)',
              )
              .run('pair', '', '', '', 0, '远程助手', 'remote-avatar');
          });
          await rm(join(source.directory, name));
        }),
      );
      const externalDirectory = await mkdtemp(join(tmpdir(), 'love-existing-remote-'));
      directories.push(externalDirectory);
      const externalConfig = {
        ...config,
        COMPOSE_PROJECT_NAME: project + '-external',
        LOVE_PORT: await availablePort(),
      };
      await writeFile(
        join(externalDirectory, '.env'),
        Object.entries(externalConfig)
          .map(([k, v]) => k + '=' + quoteEnv(v))
          .join('\n') + '\n',
      );
      const externalCalls = [];
      const external = new Manager({
        directory: externalDirectory,
        executable: join(externalDirectory, 'love'),
        version: '2.9.2',
        source: '0'.repeat(40),
        templates,
        ui,
        run: async (args, options) => {
          externalCalls.push(args);
          return runCommand(args, options);
        },
      });
      // Docker isolates separate bridge networks. This fixture hosts the external
      // database in a different project, so join its network explicitly; do not
      // make a blocked private bridge IP look like a reachable remote server.
      const networkFile = join(externalDirectory, 'remote-test.yml');
      await writeFile(
        networkFile,
        `services:\n  love:\n    networks: [remote]\nnetworks:\n  remote:\n    external: true\n    name: ${project}_default\n`,
      );
      const composeArgs = external.composeArgs.bind(external);
      external.composeArgs = (args) => [...composeArgs([]), '-f', networkFile, ...args];
      external.restore = () => {
        throw new Error('Connecting to a remote database must not restore or replace it');
      };
      try {
        await external.reload();
        await external.installTemplates();
        await external.start();
        const health = await (
          await fetch('http://127.0.0.1:' + externalConfig.LOVE_PORT + '/api/health')
        ).json();
        assert.equal(health.database, 'postgres');
        await external.paused(() =>
          external.withDatabase(async (db, destination) => {
            assert.equal(
              (await db.prepare('SELECT name,avatarMediaId FROM users WHERE id=?').get('user'))
                .name,
              'User',
            );
            assert.equal(
              (await db.prepare('SELECT avatarMediaId FROM users WHERE id=?').get('user'))
                .avatarMediaId,
              'remote-avatar',
            );
            assert.equal(
              (await db.prepare('SELECT name FROM couple_ai_settings WHERE coupleId=?').get('pair'))
                .name,
              '远程助手',
            );
            assert.equal((await db.prepare('SELECT COUNT(*) n FROM couples').get()).n, 1);
            const chunks = [];
            for await (const chunk of new MediaRepository(db, destination.directory).stream(name))
              chunks.push(chunk);
            assert.deepEqual(Buffer.concat(chunks), bytes);
            assert.throws(() =>
              execFileSync('test', ['-f', join(destination.root, 'love.sqlite')]),
            );
          }),
        );
        assert.ok(
          !externalCalls.some(
            (a) =>
              a.includes('postgres') || a.some((value) => value.endsWith('compose.postgres.yml')),
          ),
        );
        console.log(
          'Fresh external PostgreSQL deployment reused existing accounts, pair, avatars, AI settings and media without importing SQLite.',
        );
      } catch (error) {
        await external.compose(['logs', '--tail', '80', 'love']).catch(() => {});
        throw error;
      } finally {
        await external.compose(['down', '--volumes']).catch(() => {});
      }
      config.LOVE_DATABASE = 'postgres';
      config.DATABASE_URL = '';
      await save();
      await manager.reload();
    }
    assert.ok(
      !calls.some(
        (a) =>
          a[0] === 'run' ||
          a.includes('/setup/deploy/terminal-ui.mjs') ||
          a.includes('--entrypoint'),
      ),
    );
    console.log(
      `Host manager ${database}: backup, restore, check, cleanup and writer resume passed without helper containers.`,
    );
  } finally {
    await manager
      .compose(['--profile', 'https', 'down', '--volumes', '--remove-orphans'])
      .catch(() => {});
  }
}
for (const directory of directories) await rm(directory, { recursive: true, force: true });
