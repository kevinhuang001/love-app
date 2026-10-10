import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, rename, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../src/db.js';
import { exportDatabase, prepareBackupImport } from '../src/database-backup.js';
import { backupFormats, backupFormatMigrations } from '../src/backup-format.js';
import { backupFormatV1 } from '../src/migrations/backup/001.js';
import { backupFormatV2 } from '../src/migrations/backup/002.js';
import { createIntegrityV1 } from '../src/migrations/backup/payload-v1.js';
import { digestFile } from '../src/backup-archive.js';
import {
  refreshBackupPackage,
  importBackupPackage,
  type BackupRegistry,
} from '../src/backup-package.js';
import { migrations, migrateDatabase, sqliteSchemaVersion } from '../src/migrations.js';
import type { BackupFormat, BackupMetadata } from '../src/migrations/backup/shared.js';

const parse3 = (value: unknown) => {
  const m = value as Record<string, unknown>;
  assert.equal(m.version, 3);
  assert.equal(m.encoding, 'explicit-v3');
  const { encoding, ...rest } = m;
  return { ...(backupFormatV2.parse({ ...rest, version: 2 }) as object), version: 3, encoding };
};
const paths3 = (directory: string) => ({
  database: join(directory, 'snapshot.sqlite'),
  media: join(directory, 'media'),
});
const integrity3 = (directory: string) => createIntegrityV1(directory, paths3(directory));
const third: BackupFormat = {
  ...backupFormatV2,
  version: 3,
  parse: parse3,
  archive: {
    name: 'data-v3.tar.zst',
    extract: async (archive, directory) => {
      await backupFormatV2.archive!.extract(archive, directory);
      await rename(join(directory, 'love.sqlite'), paths3(directory).database);
    },
    pack: async (directory, destination) => {
      await rename(paths3(directory).database, join(directory, 'love.sqlite'));
      try {
        await backupFormatV2.archive!.pack(directory, destination);
      } finally {
        await rename(join(directory, 'love.sqlite'), paths3(directory).database);
      }
    },
  },
  paths: paths3,
  verify: async (directory, value) => {
    const m = parse3(value) as BackupMetadata & { integrity: unknown };
    assert.deepEqual(m.integrity, await integrity3(directory));
    return (await integrity3(directory)).report;
  },
  create: async (directory, metadata) => {
    if (
      !(await access(paths3(directory).database).then(
        () => true,
        () => false,
      ))
    )
      await rename(join(directory, 'love.sqlite'), paths3(directory).database);
    return {
      ...metadata,
      version: 3,
      encoding: 'explicit-v3',
      integrity: await integrity3(directory),
    };
  },
};
const registry: BackupRegistry = {
  formats: [...backupFormats, third],
  migrations: [
    ...backupFormatMigrations,
    {
      from: 2,
      to: 3,
      name: '003_test_format',
      migrate: async (value, directory) => {
        await rename(join(directory, 'love.sqlite'), paths3(directory).database);
        return { ...(value as object), version: 3, encoding: 'explicit-v3' };
      },
    },
  ],
};

for (const version of [1, 2, 3])
  test(`complete archive import ${version} → 3 uses appended modules without changing dispatch`, async (t) => {
    const root = await mkdtemp(join(tmpdir(), 'love-package-registry-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const source = join(root, 'source.sqlite'),
      media = join(root, 'media'),
      data = join(root, 'data'),
      outer = join(root, 'backup');
    await mkdir(media);
    await mkdir(outer);
    const db = await openDatabase(source);
    await db.prepare("INSERT INTO couples(id) VALUES('retained')").run();
    await db.close();
    await exportDatabase({ sqlitePath: source, mediaDirectory: media, directory: data });
    const {
      version: ignoredVersion,
      integrity: ignoredIntegrity,
      ...metadata
    } = JSON.parse(await readFile(join(data, 'manifest.json'), 'utf8')) as BackupMetadata & {
      version: number;
      integrity: unknown;
    };
    const format = registry.formats[version - 1];
    const manifest = await format.create!(data, metadata);
    await writeFile(join(data, 'manifest.json'), JSON.stringify(manifest));
    await format.archive!.pack(data, join(outer, format.archive!.name));
    await writeFile(join(outer, 'deployment.env'), 'PRIVATE=source\n');
    await writeFile(
      join(outer, 'SHA256SUMS'),
      (
        await Promise.all(
          ['deployment.env', format.archive!.name].map(
            async (name) => `${await digestFile(join(outer, name))}  ${name}`,
          ),
        )
      ).join('\n') + '\n',
    );
    const before = await readFile(join(outer, format.archive!.name));
    const target = join(root, 'target');
    const normalized = await prepareBackupImport(outer, target, registry);
    assert.ok(normalized.paths.database.endsWith('snapshot.sqlite'));
    assert.equal(normalized.formatVersion, version);
    assert.equal(normalized.targetFormatVersion, 3);
    assert.equal(
      JSON.parse(await readFile(join(target, 'manifest.json'), 'utf8')).encoding,
      'explicit-v3',
    );
    assert.deepEqual(await readFile(join(outer, format.archive!.name)), before);
    const snapshot = new DatabaseSync(normalized.paths.database, { readOnly: true });
    assert.equal(snapshot.prepare('SELECT id FROM couples').get()!.id, 'retained');
    snapshot.close();
    // A simultaneous schema upgrade uses the SQL engine after the format engine.
    const sql2 = {
      version: 2,
      name: '002_test_extra',
      sqlite:
        'ALTER TABLE couples ADD COLUMN extra TEXT; CREATE TABLE extra_records(id INTEGER PRIMARY KEY AUTOINCREMENT, coupleId TEXT REFERENCES couples(id));',
      postgres:
        'ALTER TABLE couples ADD COLUMN extra TEXT; CREATE TABLE extra_records(id BIGSERIAL PRIMARY KEY, "coupleId" TEXT REFERENCES couples(id));',
    };
    const upgraded = await openDatabase(normalized.paths.database);
    await migrateDatabase(upgraded, [...migrations, sql2]);
    await upgraded.close();
    const report = await refreshBackupPackage(
      target,
      { ...metadata, format: 'love-backup', schemaVersion: 2 },
      registry,
    );
    assert.equal(report.tables.extra_records, 0);
    const check = new DatabaseSync(normalized.paths.database, { readOnly: true });
    assert.equal(sqliteSchemaVersion(check, [...migrations, sql2]), 2);
    check.close();
    assert.equal(
      JSON.parse(await readFile(join(target, 'manifest.json'), 'utf8')).schemaVersion,
      2,
    );
  });

test('a format 2 manifest in the format 1 gzip envelope is rejected, preserving source', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'love-wrong-envelope-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const media = join(root, 'media');
  await mkdir(media);
  const db = await openDatabase(join(root, 'source.sqlite'));
  await db.close();
  await exportDatabase({
    sqlitePath: join(root, 'source.sqlite'),
    mediaDirectory: media,
    directory: join(root, 'data'),
  });
  await backupFormatV1.archive!.pack(join(root, 'data'), join(root, 'data.tar.gz'));
  await writeFile(join(root, 'deployment.env'), 'PRIVATE=source\n');
  await writeFile(
    join(root, 'SHA256SUMS'),
    (
      await Promise.all(
        ['deployment.env', 'data.tar.gz'].map(
          async (name) => `${await digestFile(join(root, name))}  ${name}`,
        ),
      )
    ).join('\n') + '\n',
  );
  await assert.rejects(importBackupPackage(root, join(root, 'target')), /编码与声明的版本不匹配/);
});
