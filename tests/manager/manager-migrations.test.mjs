import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Manager } from '../../manager/manager.mjs';
import { APPLICATION_VERSION } from '../../apps/server/src/version.ts';
import { openDatabase } from '../../apps/server/src/db.ts';
import { exportDatabase, digestFile } from '../../apps/server/src/database-backup.ts';
import { packBackup } from '../../manager/archive.mjs';
import { quoteEnv } from '../../manager/setup.mjs';

for (const database of ['sqlite', 'postgres', 'external']) {
  test(`first configuration ${database} ${database === 'external' ? 'uses existing data' : 'offers backup import before startup'}`, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'love-initial-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const confirmations = [],
      events = [];
    const ui = {
      isCancel: () => false,
      intro() {},
      note() {},
      outro() {},
      select: async (p) =>
        p.message === '选择数据库' ? database : p.initialValue || p.options[0].value,
      text: async (p) => p.defaultValue,
      password: async (p) =>
        p.message.startsWith('PostgreSQL 连接')
          ? 'postgresql://user:secret@database.test/love'
          : 'long-fixture-password',
      confirm: async (p) => {
        confirmations.push(p.message);
        return p.message === '保存配置并继续？';
      },
    };
    const manager = new Manager({ directory, version: APPLICATION_VERSION, ui, log() {} });
    manager.confirm = async (message) => {
      confirmations.push(message);
      return true;
    };
    manager.restore = async (options) => {
      assert.equal(options.initializing, true);
      events.push('restore');
      return true;
    };
    manager.start = async () => events.push('start');
    await manager.configure();
    assert.equal(
      confirmations.some((m) => m.startsWith('初始化时导入备份')),
      database !== 'external',
    );
    assert.deepEqual(events, database === 'external' ? ['start'] : ['restore', 'start']);
    events.length = 0;
    confirmations.length = 0;
    await manager.configure();
    assert.equal(
      confirmations.some((m) => m.startsWith('初始化时导入备份')),
      false,
    );
    assert.deepEqual(events, ['start']);
  });
}

test('initial SQLite import restores a real versioned package before application startup without backing up empty data', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'love-init-restore-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const sourcePath = join(directory, 'source', 'love.sqlite'),
    media = join(directory, 'source', 'media');
  await mkdir(media, { recursive: true });
  const source = await openDatabase(sourcePath);
  await source.prepare('INSERT INTO couples(id) VALUES(?)').run('imported');
  await source.close();
  const archive = join(directory, 'backups', 'fixture'),
    data = join(directory, 'package');
  await mkdir(archive, { recursive: true });
  await exportDatabase({ sqlitePath: sourcePath, mediaDirectory: media, directory: data });
  await packBackup(data, join(archive, 'data.tar.zst'));
  await writeFile(
    join(archive, 'deployment.env'),
    "MEDIA_SIGNING_SECRET='original-key-with-at-least-32-characters'\n",
  );
  const checksums = await Promise.all(
    ['deployment.env', 'data.tar.zst'].map(
      async (name) => (await digestFile(join(archive, name))) + '  ' + name,
    ),
  );
  await writeFile(join(archive, 'SHA256SUMS'), checksums.join('\n') + '\n');
  const root = join(directory, 'target');
  const config = {
    LOVE_DATABASE: 'sqlite',
    LOVE_IMAGE: 'ghcr.io/kevinhuang001/love-app:latest',
    LOVE_HTTPS: '0',
    MEDIA_SIGNING_SECRET: 'target-key-with-at-least-32-characters',
  };
  await writeFile(
    join(directory, '.env'),
    Object.entries(config)
      .map(([k, v]) => `${k}=${quoteEnv(v)}`)
      .join('\n'),
  );
  const before = await readFile(join(directory, '.env')),
    calls = [];
  const manager = new Manager({
    directory,
    version: APPLICATION_VERSION,
    log() {},
    run: async (args) => {
      calls.push(args);
      if (args[0] === 'image')
        return JSON.stringify([
          { Config: { Labels: { 'org.opencontainers.image.version': APPLICATION_VERSION } } },
        ]);
      if (args[0] === 'ps') return '';
      if (args.includes('create')) await mkdir(root, { recursive: true });
      if (args.includes('config'))
        return JSON.stringify({
          services: { love: { volumes: [{ type: 'bind', source: root, target: '/app/data' }] } },
        });
      return '';
    },
  });
  manager.ask = async (kind) => {
    if (kind === 'backup') return 'fixture';
    if (kind === 'text') return 'RESTORE';
    throw new Error('Unexpected prompt ' + kind);
  };
  manager.note = () => {};
  await manager.reload();
  assert.equal(await manager.restore({ initializing: true }), true);
  const target = await openDatabase(join(root, 'love.sqlite'));
  try {
    assert.equal((await target.prepare('SELECT id FROM couples').get()).id, 'imported');
  } finally {
    await target.close();
  }
  assert.deepEqual(await readFile(join(directory, '.env')), before);
  assert.ok(calls.some((c) => c.includes('create')));
  assert.equal(
    calls.some((c) => c.includes('start') || c.includes('up')),
    false,
  );
});

test('a manager from another release refuses native database operations before opening or migrating data', async () => {
  const manager = new Manager({
    directory: '/tmp',
    version: APPLICATION_VERSION,
    run: async () =>
      JSON.stringify([{ Config: { Labels: { 'org.opencontainers.image.version': '2.8.0' } } }]),
  });
  let opened = false;
  manager.databaseLocation = async () => {
    opened = true;
    throw new Error('should not open');
  };
  await assert.rejects(
    manager.withDatabase(() => {}),
    /版本不一致/,
  );
  assert.equal(opened, false);
});
