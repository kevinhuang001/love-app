import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { openDatabase, type DB } from '../../apps/server/src/db.js';
import {
  migrateDatabase,
  migrations,
  migrationChecksum,
  SCHEMA_VERSION,
} from '../../apps/server/src/migrations.js';
import { APPLICATION_VERSION, assertBackupVersion } from '../../apps/server/src/version.js';

async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const dir = await mkdtemp(join(tmpdir(), 'love-migrations-'));
  const schema = process.env.TEST_DATABASE_URL
    ? 'test_' + randomUUID().replaceAll('-', '')
    : undefined;
  const options = { path: process.env.TEST_DATABASE_URL || join(dir, 'love.sqlite'), schema };
  const db = await openDatabase(options);
  t.after(async () => {
    await db.close();
    if (schema) {
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
  return { db, options, dir };
}

test('version 1 initializes once; reopening preserves data and original migration timestamp', async (t) => {
  const { db, options } = await fixture(t);
  await db.prepare('INSERT INTO couples(id) VALUES(?)').run('retained');
  const history = await db.prepare('SELECT * FROM schema_migrations').all();
  assert.equal(history.length, 1);
  assert.equal(history[0].version, SCHEMA_VERSION);
  assert.equal(history[0].checksum, migrationChecksum(migrations[0]));
  const reopened = await openDatabase(options);
  try {
    assert.deepEqual(await reopened.prepare('SELECT * FROM schema_migrations').all(), history);
    assert.equal((await reopened.prepare('SELECT id FROM couples').get())!.id, 'retained');
  } finally {
    await reopened.close();
  }
});

test('skipping releases applies pending schema and data increments in order and only once', async (t) => {
  const { db } = await fixture(t);
  await db.prepare('INSERT INTO couples(id) VALUES(?)').run('pair');
  const definitions = [
    ...migrations,
    {
      version: 2,
      name: '002_add_label',
      sqlite: "ALTER TABLE couples ADD COLUMN label TEXT NOT NULL DEFAULT '';",
      postgres: "ALTER TABLE couples ADD COLUMN label TEXT NOT NULL DEFAULT '';",
    },
    {
      version: 3,
      name: '003_fill_label',
      sqlite: "UPDATE couples SET label='migrated';",
      postgres: "UPDATE couples SET label='migrated';",
    },
  ];
  await migrateDatabase(db, definitions);
  assert.equal((await db.prepare('SELECT label FROM couples').get())!.label, 'migrated');
  await db.prepare("UPDATE couples SET label='user edit'").run();
  await migrateDatabase(db, definitions);
  assert.equal((await db.prepare('SELECT label FROM couples').get())!.label, 'user edit');
  assert.deepEqual(
    (await db.prepare('SELECT version FROM schema_migrations ORDER BY version').all()).map(
      (r) => r.version,
    ),
    [1, 2, 3],
  );
  await assert.rejects(migrateDatabase(db), /高于当前软件/);
});

test('failed migration rolls back DDL, data and history; retry succeeds', async (t) => {
  const { db } = await fixture(t);
  await db.prepare('INSERT INTO couples(id) VALUES(?)').run('pair');
  const sql =
    "CREATE TABLE migration_probe(value TEXT); UPDATE couples SET startDate='changed'; INSERT INTO missing_table VALUES(1);";
  await assert.rejects(
    migrateDatabase(db, [
      ...migrations,
      { version: 2, name: '002_probe', sqlite: sql, postgres: sql },
    ]),
  );
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM schema_migrations').get())!.n, 1);
  assert.equal((await db.prepare('SELECT startDate FROM couples').get())!.startDate, null);
  await assert.rejects(db.prepare('SELECT * FROM migration_probe').all());
  const retry = 'CREATE TABLE migration_probe(value TEXT);';
  await migrateDatabase(db, [
    ...migrations,
    { version: 2, name: '002_probe', sqlite: retry, postgres: retry },
  ]);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM schema_migrations').get())!.n, 2);
});

test('changed, missing and future migration history is refused without data changes', async (t) => {
  const { db } = await fixture(t);
  await db.prepare('INSERT INTO couples(id) VALUES(?)').run('pair');
  await db.prepare("UPDATE schema_migrations SET checksum='tampered'").run();
  await assert.rejects(migrateDatabase(db), /校验和/);
  await db.prepare('UPDATE schema_migrations SET checksum=?').run(migrationChecksum(migrations[0]));
  await db.prepare('UPDATE schema_migrations SET version=3').run();
  await assert.rejects(migrateDatabase(db), /高于当前软件/);
  await db.prepare('UPDATE schema_migrations SET version=1').run();
  await db.prepare("UPDATE schema_migrations SET name='wrong'").run();
  await assert.rejects(migrateDatabase(db), /历史/);
  assert.equal((await db.prepare('SELECT id FROM couples').get())!.id, 'pair');
  await db.exec('DELETE FROM schema_migrations');
  await assert.rejects(migrateDatabase(db), /历史为空/);
});

test('unversioned and former schema versions are not silently adopted or upgraded', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-old-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const version of [0, 4, 9]) {
    const path = join(dir, `${version}.sqlite`);
    const sqlite = new DatabaseSync(path);
    sqlite.exec(
      `CREATE TABLE old_data(value TEXT); INSERT INTO old_data VALUES('retained'); PRAGMA user_version=${version};`,
    );
    sqlite.close();
    await assert.rejects(openDatabase(path), /不支持旧结构/);
    const check = new DatabaseSync(path, { readOnly: true });
    try {
      assert.equal(check.prepare('SELECT value FROM old_data').get()!.value, 'retained');
      assert.equal(
        check.prepare("SELECT COUNT(*) n FROM sqlite_schema WHERE name='schema_migrations'").get()!
          .n,
        0,
      );
    } finally {
      check.close();
    }
  }
});

test(
  'simultaneous PostgreSQL initializations serialize and write one history record',
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    const { db, options } = await fixture(t);
    await db.exec(
      'DROP SCHEMA "' + options.schema + '" CASCADE; CREATE SCHEMA "' + options.schema + '"',
    );
    const connections: DB[] = [];
    try {
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          connections.push(await openDatabase(options));
        }),
      );
      assert.equal(
        (await connections[0].prepare('SELECT COUNT(*) n FROM schema_migrations').get())!.n,
        1,
      );
    } finally {
      await Promise.all(connections.map((c) => c.close()));
    }
  },
);

test('backup import permits lower/equal software and schema versions, rejects reverse direction', () => {
  assertBackupVersion(APPLICATION_VERSION, 1);
  assertBackupVersion('2.8.0', 1);
  assertBackupVersion('2.9.9', 1, '2.10.0');
  assert.throws(() => assertBackupVersion('2.10.0', 1), /软件版本高于/);
  assert.throws(() => assertBackupVersion(APPLICATION_VERSION, 2), /数据库版本高于/);
  for (const version of [null, '', 'bad', '2.9.2-beta'])
    assert.throws(() => assertBackupVersion(version, 1), /版本无效/);
  assert.throws(() => assertBackupVersion(APPLICATION_VERSION, 0), /版本无效/);
});
