import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  exportDatabase,
  extractBackup,
  validatePackage,
  restoreSQLite,
  rekeyBackup,
  recoverSQLiteRestore,
} from '../src/database-backup.js';
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  readdir,
  symlink,
  rename,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import sharp from 'sharp';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';
import { restoreToPostgres, transferTables } from '../src/database-restore.js';
import { MediaRepository, MEDIA_CHUNK_BYTES } from '../src/media-repository.js';
import { hashToken, hashPassword, verifyPassword } from '../src/security.js';
import { seal, unseal } from '../src/mail.js';

const onlyPG = { skip: !process.env.TEST_DATABASE_URL };
const secret = 'migration-test-stable-secret-at-least-32';
async function fixture(t: TestContext, postgres = true) {
  const dir = await mkdtemp(join(tmpdir(), 'love-database-transfer-'));
  const sourcePath = join(dir, 'source.sqlite'),
    mediaDirectory = join(dir, 'source-media');
  await mkdir(mediaDirectory);
  const schema = 'transfer_' + randomUUID().replaceAll('-', '');
  const target = postgres
    ? await openDatabase({ path: process.env.TEST_DATABASE_URL!, schema })
    : await openDatabase(':memory:');
  t.after(async () => {
    await target.close();
    if (postgres) {
      const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
      await client.connect();
      try {
        await client.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        await client.end();
      }
    }
    await rm(dir, { recursive: true, force: true });
  });
  const source = await openDatabase(sourcePath),
    now = '2026-10-09T00:00:00.000Z';
  const password = await hashPassword('migration-password123');
  const image = await sharp({
    create: { width: 64, height: 64, channels: 3, background: '#436358' },
  })
    .webp()
    .toBuffer();
  const contents = new Map([
    ['clip.mp4', randomBytes(MEDIA_CHUNK_BYTES + 57)],
    ['clip.webp', image],
    ['avatar.webp', image],
    ['avatar-small.webp', image],
  ]);
  for (const [name, data] of contents) await writeFile(join(mediaDirectory, name), data);
  const insert = async (table: string, row: Record<string, unknown>) =>
    source
      .prepare(
        `INSERT INTO ${table}(${Object.keys(row).join(',')}) VALUES(${Object.keys(row)
          .map(() => '?')
          .join(',')})`,
      )
      .run(...Object.values(row));
  await insert('couples', { id: 'pair', startDate: '2022-08-01', startTime: '12:34:56' });
  for (const id of ['usera', 'userb'])
    await insert('users', {
      id,
      username: id,
      name: id === 'usera' ? '用户甲' : '用户乙',
      password,
      coupleId: 'pair',
      email: id + '@example.test',
      verifiedAt: now,
      createdAt: now,
    });
  await insert('media', {
    id: 'video',
    coupleId: 'pair',
    ownerId: 'usera',
    kind: 'video',
    original: '',
    preview: 'clip.mp4',
    thumbnail: 'clip.webp',
    width: 640,
    height: 480,
    duration: 12.345,
    createdAt: now,
  });
  await insert('media', {
    id: 'avatar',
    coupleId: null,
    ownerId: 'usera',
    kind: 'image',
    original: 'avatar.webp',
    preview: 'avatar.webp',
    thumbnail: 'avatar-small.webp',
    width: 64,
    height: 64,
    createdAt: now,
  });
  await source.prepare('UPDATE users SET avatarMediaId=? WHERE id=?').run('avatar', 'usera');
  await insert('sessions', {
    hash: hashToken('source-session'),
    userId: 'usera',
    expires: Date.now() + 86400000,
  });
  await insert('invites', { hash: 'pairing-code', userId: 'userb', expires: 9999999999999 });
  await insert('administrators', {
    id: 'admin',
    username: 'admin_master',
    password,
    createdAt: now,
  });
  await insert('messages', {
    id: 41,
    coupleId: 'pair',
    senderId: 'usera',
    clientId: 'client-original',
    content: '原聊天内容',
    createdAt: now,
    assistantAvatarMediaId: 'avatar',
  });
  await insert('message_media', { messageId: 41, mediaId: 'video', position: 0 });
  await insert('moments', {
    id: 'memory',
    coupleId: 'pair',
    ownerId: 'usera',
    title: '相册',
    mediaId: 'video',
    date: '2026-10-08',
    createdAt: now,
  });
  await insert('anniversaries', {
    id: 'date',
    coupleId: 'pair',
    title: '纪念日',
    date: '2022-08-01',
    time: '12:34:56',
  });
  await insert('todos', {
    id: 'todo',
    coupleId: 'pair',
    title: '七夕',
    date: '2026-07-07',
    time: '21:22:23',
    calendar: 'lunar',
    repeat: 'yearly',
  });
  await insert('couple_ai_settings', {
    coupleId: 'pair',
    baseUrl: 'https://ai.example.test',
    model: 'vision',
    secret: seal('private-ai-key', secret),
    enabled: 1,
    name: '助手',
    avatarMediaId: 'avatar',
  });
  await insert('couple_media_settings', { coupleId: 'pair', retainOriginal: 0 });
  await insert('ai_jobs', {
    messageId: 41,
    userId: 'usera',
    status: 'done',
    transcript: '[{"role":"assistant"}]',
  });
  await insert('ai_actions', { messageId: 41, callId: 'tool-call', result: '{"ok":true}' });
  await insert('registration_invites', {
    id: 'registration',
    hash: 'invite-hash',
    label: '邀请码',
    uses: 1,
    maxUses: 10,
    expires: 9999999999999,
    createdAt: now,
  });
  await insert('album_imports', { coupleId: 'pair', digest: 'archive-digest' });
  await insert('server_config', { key: '中文配置', value: '保留原值' });
  await insert('server_config', { key: 'Z-config', value: 'uppercase' });
  await insert('server_config', { key: 'a-config', value: 'lowercase' });
  await insert('admin_sessions', {
    hash: 'admin-session',
    adminId: 'admin',
    expires: 9999999999999,
  });
  await insert('captchas', {
    id: 'captcha',
    hash: 'captcha-hash',
    purpose: 'login',
    ipHash: 'ip-hash',
    expires: 9999999999999,
  });
  await insert('email_codes', {
    id: 'code',
    email: 'usera@example.test',
    purpose: 'reset',
    hash: 'code-hash',
    expires: 9999999999999,
    sentAt: 123456,
    status: 'sent',
  });
  await insert('email_allowlist', {
    email: 'allowed@example.test',
    note: '白名单',
    createdAt: now,
  });
  await insert('media_sizes', {
    mediaId: 'video',
    originalBytes: 0,
    previewBytes: contents.get('clip.mp4')!.length,
    thumbnailBytes: image.length,
    totalBytes: contents.get('clip.mp4')!.length + image.length,
  });
  await insert('media_sizes', {
    mediaId: 'avatar',
    originalBytes: 0,
    previewBytes: image.length,
    thumbnailBytes: image.length,
    totalBytes: image.length * 2,
  });
  await insert('couple_limits', { coupleId: 'pair', quotaMiB: 456 });
  const log = {
    requestId: 'original-request',
    createdAt: now,
    method: 'GET',
    path: '/api/me',
    status: 200,
    durationMs: 1.25,
    ip: '127.0.0.1',
    userAgent: 'fixture',
  };
  await insert('access_logs', { id: 11, ...log });
  await insert('access_logs', { id: 100, ...log });
  await source.prepare('DELETE FROM access_logs WHERE id=100').run();
  await insert('server_logs', {
    id: 17,
    createdAt: now,
    level: 'info',
    event: 'fixture',
    details: '{}',
  });
  await insert('audit_logs', {
    id: 23,
    createdAt: now,
    adminId: 'admin',
    action: 'test',
    target: 'pair',
    details: '{}',
  });
  await source.close();
  const sourceBytes = await readFile(sourcePath);
  const migrate = () => restoreToPostgres({ sourcePath, mediaDirectory, target });
  return {
    dir,
    sourcePath,
    mediaDirectory,
    target,
    schema,
    contents,
    sourceBytes,
    migrate,
    password,
  };
}

test(
  'SQLite transfer copies all tables, media and credentials, preserves source, can retry, and resets sequences',
  onlyPG,
  async (t) => {
    const s = await fixture(t);
    await s.target.prepare("INSERT INTO server_config VALUES('control','target-default')").run();
    const report = await s.migrate();
    assert.deepEqual(Object.keys(report.tables), [...transferTables]);
    assert.ok(Object.values(report.tables).every((count) => count > 0));
    assert.equal(report.tables.users, 2);
    assert.equal(report.mediaFiles, 4, 'avatar aliases must be stored once');
    assert.deepEqual(await readFile(s.sourcePath), s.sourceBytes);
    assert.equal(
      await s.target.prepare("SELECT value FROM server_config WHERE key='control'").get(),
      undefined,
    );
    const repository = new MediaRepository(s.target, join(s.dir, 'unused'));
    for (const [name, data] of s.contents) {
      assert.deepEqual(await readFile(join(s.mediaDirectory, name)), data);
      assert.deepEqual(await repository.read(name), data);
    }
    assert.deepEqual(await s.migrate(), report, 'same snapshot retry does not duplicate anything');
    assert.equal(
      await verifyPassword(
        'migration-password123',
        String(
          (await s.target.prepare('SELECT password FROM users WHERE id=?').get('usera'))!.password,
        ),
      ),
      true,
    );
    assert.equal(
      unseal(
        String(
          (await s.target
            .prepare('SELECT secret FROM couple_ai_settings WHERE coupleId=?')
            .get('pair'))!.secret,
        ),
        secret,
      ),
      'private-ai-key',
    );
    const inserted = await s.target
      .prepare(
        'INSERT INTO messages(coupleId,senderId,clientId,content,createdAt) VALUES(?,?,?,?,?)',
      )
      .run('pair', 'usera', 'new-message', '新消息', new Date().toISOString());
    assert.equal(inserted.lastInsertRowid, 42);
    await s.target
      .prepare(
        'INSERT INTO access_logs(requestId,createdAt,method,path,status,durationMs,ip,userAgent) VALUES(?,?,?,?,?,?,?,?)',
      )
      .run('new', 'now', 'GET', '/', 200, 0, '', '');
    assert.equal(
      (await s.target.prepare("SELECT id FROM access_logs WHERE requestId='new'").get())!.id,
      101,
    );
    const resumed = await createApp({
      database: process.env.TEST_DATABASE_URL!,
      databaseSchema: s.schema,
      uploads: join(s.dir, 'pg-temp'),
      mediaSecret: secret,
    });
    try {
      await resumed.control.bootstrap;
      const me = await request(resumed.app)
        .get('/api/me')
        .auth('source-session', { type: 'bearer' })
        .expect(200);
      assert.equal(me.body.user.name, '用户甲');
      assert.equal(me.body.couple.id, 'pair');
      assert.equal(
        await resumed.control.usage('pair'),
        s.contents.get('clip.mp4')!.length + s.contents.get('clip.webp')!.length,
      );
      assert.equal(await resumed.control.quota('pair'), 456 * 1048576);
      assert.deepEqual(await readdir(join(s.dir, 'pg-temp')), ['tmp']);
      assert.deepEqual(await readFile(s.sourcePath), s.sourceBytes);
      for (const [name, data] of s.contents)
        assert.deepEqual(await readFile(join(s.mediaDirectory, name)), data);
    } finally {
      await resumed.close();
    }
  },
);

test(
  'failed transfer rolls back tables and chunks, preserves target defaults, and allows a clean retry',
  onlyPG,
  async (t) => {
    const s = await fixture(t);
    await s.target.prepare("INSERT INTO server_config VALUES('bootstrap','keep-on-failure')").run();
    const prepare = s.target.prepare.bind(s.target);
    let chunks = 0;
    const mock = t.mock.method(s.target, 'prepare', (sql: string) => {
      const statement = prepare(sql);
      return sql.startsWith('WITH saved AS')
        ? {
            ...statement,
            run: async (...values: unknown[]) => {
              if (++chunks === 2) throw new Error('injected binary transfer failure');
              return statement.run(...values);
            },
          }
        : statement;
    });
    await assert.rejects(s.migrate(), /injected binary transfer failure/);
    mock.mock.restore();
    assert.equal((await s.target.prepare('SELECT COUNT(*) n FROM users').get())!.n, 0);
    assert.equal((await s.target.prepare('SELECT COUNT(*) n FROM media_chunks').get())!.n, 0);
    assert.equal(
      (await s.target.prepare("SELECT value FROM server_config WHERE key='bootstrap'").get())!
        .value,
      'keep-on-failure',
    );
    assert.deepEqual(await readFile(s.sourcePath), s.sourceBytes);
    assert.equal((await s.migrate()).tables.users, 2);
  },
);

test(
  'populated target is replaced; missing or linked media preserve both databases',
  onlyPG,
  async (t) => {
    const s = await fixture(t);
    await s.target.prepare("INSERT INTO couples(id) VALUES('existing-pair')").run();
    await s.migrate();
    assert.equal(
      await s.target.prepare("SELECT id FROM couples WHERE id='existing-pair'").get(),
      undefined,
    );
    const counts = await s.target.prepare('SELECT COUNT(*) n FROM users').get();
    await rm(join(s.mediaDirectory, 'clip.mp4'));
    await assert.rejects(s.migrate(), /ENOENT/);
    await symlink(join(s.mediaDirectory, 'avatar.webp'), join(s.mediaDirectory, 'clip.mp4'));
    await assert.rejects(s.migrate(), /ELOOP/);
    assert.deepEqual(await s.target.prepare('SELECT COUNT(*) n FROM users').get(), counts);
    assert.deepEqual(await readFile(s.sourcePath), s.sourceBytes);
  },
);

test('SQLite backup and restore retain every table, media bytes and sequences; reject corruption before replacing data', async (t) => {
  const s = await fixture(t, false),
    directory = join(s.dir, 'package');
  const report = await exportDatabase({
    sqlitePath: s.sourcePath,
    mediaDirectory: s.mediaDirectory,
    directory,
  });
  assert.deepEqual(await readFile(s.sourcePath), s.sourceBytes);
  assert.equal(report.mediaFiles, 4);
  const archive = join(s.dir, 'backup.tar.gz');
  execFileSync('tar', ['-C', directory, '-czf', archive, '.']);
  const extracted = join(s.dir, 'extracted');
  await extractBackup(archive, extracted);
  assert.deepEqual((await validatePackage(extracted)).report, report);
  const restored = join(s.dir, 'restored'),
    database = join(restored, 'love.sqlite');
  await mkdir(restored);
  const old = await openDatabase(database);
  await old.prepare("INSERT INTO couples(id) VALUES('replaced')").run();
  await old.close();
  await restoreSQLite(extracted, database);
  const db = new DatabaseSync(database, { readOnly: true });
  try {
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
    for (const [table, count] of Object.entries(report.tables))
      assert.equal(db.prepare(`SELECT COUNT(*) n FROM "${table}"`).get()!.n, count);
    assert.equal(
      db.prepare("SELECT seq FROM sqlite_sequence WHERE name='access_logs'").get()!.seq,
      100,
    );
  } finally {
    db.close();
  }
  for (const [name, content] of s.contents)
    assert.deepEqual(await readFile(join(restored, 'media', name)), content);
  const before = await readFile(database);
  await writeFile(join(extracted, 'media', 'clip.mp4'), 'corrupted');
  await assert.rejects(restoreSQLite(extracted, database), /容量记录不一致|清单|摘要/);
  assert.deepEqual(await readFile(database), before);
});

test('backup extractor rejects links, traversal and malformed packages', async (t) => {
  const s = await fixture(t, false),
    directory = join(s.dir, 'unsafe');
  await mkdir(directory);
  await symlink(s.sourcePath, join(directory, 'love.sqlite'));
  const archive = join(s.dir, 'unsafe.tar.gz');
  execFileSync('tar', ['-C', directory, '-czf', archive, '.']);
  await assert.rejects(extractBackup(archive, join(s.dir, 'out')), /不安全路径|链接/);
});

test('restore CLI identifies legacy SQLite and rekeys AI/SMTP secrets while leaving current env intact', async (t) => {
  const s = await fixture(t, false),
    packageDir = join(s.dir, 'portable'),
    archiveDir = join(s.dir, 'archive');
  const source = await openDatabase(s.sourcePath);
  await source
    .prepare("INSERT INTO server_config VALUES('control',?)")
    .run(JSON.stringify({ smtp: { password: seal('smtp-password', secret) } }));
  await source.close();
  await exportDatabase({
    sqlitePath: s.sourcePath,
    mediaDirectory: s.mediaDirectory,
    directory: packageDir,
  });
  await rm(join(packageDir, 'manifest.json')); // an old SQLite data.tar.gz needs no manifest
  await mkdir(archiveDir);
  execFileSync('tar', ['-C', packageDir, '-czf', join(archiveDir, 'data.tar.gz'), '.']);
  await writeFile(
    join(archiveDir, 'deployment.env'),
    `LOVE_DATABASE='sqlite'\nMEDIA_SIGNING_SECRET='${secret}'\n`,
  );
  const checksums = await Promise.all(
    ['deployment.env', 'data.tar.gz'].map(
      async (name) =>
        createHash('sha256')
          .update(await readFile(join(archiveDir, name)))
          .digest('hex') +
        '  ' +
        name,
    ),
  );
  await writeFile(join(archiveDir, 'SHA256SUMS'), checksums.join('\n') + '\n');
  const destination = join(s.dir, 'destination'),
    key = 'different-destination-encryption-key-32';
  await mkdir(destination);
  const currentEnv = "DATABASE_PROVIDER='sqlite'\nADMIN_USERNAME='new_admin'\n";
  await writeFile(join(destination, '.env'), currentEnv);
  const env = {
    ...process.env,
    DATABASE_PROVIDER: 'sqlite',
    DATABASE_URL: '',
    DATABASE_PATH: join(destination, 'love.sqlite'),
    MEDIA_SIGNING_SECRET: key,
  };
  const cli = (operation) =>
    spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        fileURLToPath(new URL('../src/database-backup-cli.ts', import.meta.url)),
        operation,
        '--directory',
        archiveDir,
      ],
      { env, encoding: 'utf8' },
    );
  const inspect = cli('inspect');
  assert.equal(inspect.status, 0, inspect.stderr);
  assert.equal(inspect.stdout.trim(), 'sqlite');
  const restored = cli('restore');
  assert.equal(restored.status, 0, restored.stderr);
  assert.equal(await readFile(join(destination, '.env'), 'utf8'), currentEnv);
  const db = new DatabaseSync(env.DATABASE_PATH, { readOnly: true });
  try {
    assert.equal(
      unseal(
        String(
          db.prepare("SELECT secret FROM couple_ai_settings WHERE coupleId='pair'").get()!.secret,
        ),
        key,
      ),
      'private-ai-key',
    );
    const control = JSON.parse(
      String(db.prepare("SELECT value FROM server_config WHERE key='control'").get()!.value),
    );
    assert.equal(unseal(control.smtp.password, key), 'smtp-password');
    assert.equal(db.prepare('SELECT COUNT(*) n FROM captchas').get()!.n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM registration_invites').get()!.n, 1);
  } finally {
    db.close();
  }
  assert.equal(
    await readFile(join(archiveDir, 'deployment.env'), 'utf8'),
    `LOVE_DATABASE='sqlite'\nMEDIA_SIGNING_SECRET='${secret}'\n`,
  );
});

test('interrupted SQLite file switch rolls back database and media before startup', async (t) => {
  const s = await fixture(t, false),
    root = join(s.dir, 'interrupted'),
    stageName = '.love-restore-123abc',
    stage = join(root, stageName);
  await mkdir(join(stage, 'old'), { recursive: true });
  await mkdir(join(root, 'media'));
  await writeFile(join(root, 'love.sqlite'), 'original-database');
  await writeFile(join(root, 'media', 'image'), 'original-image');
  await rename(join(root, 'love.sqlite'), join(stage, 'old', 'love.sqlite'));
  await writeFile(join(root, 'love.sqlite'), 'partial-new-database');
  await writeFile(
    join(root, '.love-restore.json'),
    JSON.stringify({
      stage: stageName,
      committed: false,
      files: [
        { name: 'love.sqlite', hadOld: true },
        { name: 'media', hadOld: true },
      ],
    }),
  );
  await recoverSQLiteRestore(join(root, 'love.sqlite'));
  assert.equal(await readFile(join(root, 'love.sqlite'), 'utf8'), 'original-database');
  assert.equal(await readFile(join(root, 'media', 'image'), 'utf8'), 'original-image');
  await recoverSQLiteRestore(join(root, 'love.sqlite'));
});

test(
  'PostgreSQL backups restore into SQLite and populated PostgreSQL with exact binary data',
  onlyPG,
  async (t) => {
    const s = await fixture(t);
    await s.migrate();
    const directory = join(s.dir, 'pg-backup');
    const exported = await exportDatabase({
      db: s.target,
      mediaDirectory: join(s.dir, 'unused'),
      directory,
    });
    assert.equal((await validatePackage(directory)).provider, 'postgres');
    await s.target.prepare("UPDATE users SET name='modified' WHERE id='usera'").run();
    await s.target.prepare('DELETE FROM moments').run();
    await restoreToPostgres({
      sourcePath: join(directory, 'love.sqlite'),
      mediaDirectory: join(directory, 'media'),
      target: s.target,
    });
    assert.equal(
      (await s.target.prepare("SELECT name FROM users WHERE id='usera'").get())!.name,
      '用户甲',
    );
    assert.equal((await s.target.prepare('SELECT COUNT(*) n FROM moments').get())!.n, 1);
    const destination = join(s.dir, 'restored-sqlite', 'love.sqlite');
    const restored = await restoreSQLite(directory, destination);
    assert.deepEqual(restored, exported);
    const sqlite = new DatabaseSync(destination, { readOnly: true });
    try {
      assert.equal(sqlite.prepare('PRAGMA foreign_key_check').all().length, 0);
      assert.equal(
        sqlite.prepare("SELECT avatarMediaId FROM users WHERE id='usera'").get()!.avatarMediaId,
        'avatar',
      );
      assert.equal(
        sqlite.prepare("SELECT duration FROM media WHERE id='video'").get()!.duration,
        12.345,
      );
      assert.equal(
        sqlite.prepare("SELECT seq FROM sqlite_sequence WHERE name='access_logs'").get()!.seq,
        100,
      );
      assert.equal(
        unseal(
          String(sqlite.prepare('SELECT secret FROM couple_ai_settings').get()!.secret),
          secret,
        ),
        'private-ai-key',
      );
    } finally {
      sqlite.close();
    }
    for (const [name, data] of s.contents)
      assert.deepEqual(await readFile(join(s.dir, 'restored-sqlite', 'media', name)), data);
  },
);
