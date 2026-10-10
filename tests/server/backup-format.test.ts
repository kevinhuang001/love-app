import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  backupFormats,
  backupFormatMigrations,
  migrateBackupFormat,
  parseBackupManifest,
  validateBackupFormatRegistry,
  type BackupFormat,
  type BackupFormatMigration,
} from '../../apps/server/src/backup-format.js';

const v1 = () => ({
  format: 'love-backup',
  version: 1,
  applicationVersion: '2.9.2',
  schemaVersion: 1,
  provider: 'sqlite',
  createdAt: '2026-10-09T00:00:00.000Z',
  databaseSha256: 'a'.repeat(64),
  report: {
    sourceDigest: 'b'.repeat(64),
    tables: { users: 2 },
    mediaRecords: 0,
    mediaFiles: 0,
    mediaBytes: 0,
  },
});
const verify = async (value: unknown, format: BackupFormat) => {
  assert.deepEqual(format.integrity!(value), {
    algorithm: 'sha256',
    reportVersion: 1,
    databaseSha256: v1().databaseSha256,
    report: v1().report,
  });
};
test('format 1 is verified, converted to 2 and verified again without changing its source', async () => {
  const source = v1(),
    before = structuredClone(source),
    order: number[] = [];
  const result = await migrateBackupFormat(source, '/private', async (manifest, format) => {
    order.push(format.version);
    await verify(manifest, format);
  });
  assert.deepEqual(order, [1, 2]);
  assert.equal(result.sourceVersion, 1);
  const current = parseBackupManifest(result.manifest);
  assert.equal(current.version, 2);
  assert.equal(
    (current.manifest as { integrity: { reportVersion: number } }).integrity.reportVersion,
    1,
  );
  assert.deepEqual(source, before);
  const again = await migrateBackupFormat(current.manifest, '/private', verify);
  assert.deepEqual(again.manifest, current.manifest);
});

test('future, malformed and unsupported integrity formats stop before payload access', async () => {
  for (const changed of [
    { version: 3 },
    { version: '1' },
    { version: -1 },
    { version: 1.5 },
    { format: 'other' },
    { databaseSha256: 'bad' },
    { schemaVersion: 0 },
    { createdAt: 'bad' },
    { report: { ...v1().report, mediaFiles: -1 } },
  ]) {
    let called = false;
    await assert.rejects(
      migrateBackupFormat({ ...v1(), ...changed }, '/private', async () => {
        called = true;
      }),
    );
    assert.equal(called, false);
  }
  const current = (await migrateBackupFormat(v1(), '/private', verify)).manifest as Record<
    string,
    unknown
  >;
  for (const integrity of [{ algorithm: 'md5' }, { reportVersion: 2 }]) {
    assert.throws(() =>
      parseBackupManifest({
        ...current,
        integrity: { ...(current.integrity as object), ...integrity },
      }),
    );
  }
});

test('original verification failure prevents the converter from running', async () => {
  let converted = false;
  await assert.rejects(
    migrateBackupFormat(
      v1(),
      '/private',
      async () => {
        throw new Error('corrupt');
      },
      {
        formats: backupFormats,
        migrations: [
          {
            ...backupFormatMigrations[0],
            migrate: () => {
              converted = true;
              return {};
            },
          },
        ],
      },
    ),
    /corrupt/,
  );
  assert.equal(converted, false);
});

test('consecutive format migrations verify every intermediate result', async () => {
  const third: BackupFormat = {
    version: 3,
    parse: (value) => {
      const { extra, ...record } = value as Record<string, unknown>;
      assert.equal(record.version, 3);
      assert.equal(extra, 'v3');
      backupFormats[1].parse({ ...record, version: 2 });
      return value;
    },
    integrity: (value) => {
      const { extra, ...record } = value as Record<string, unknown>;
      return backupFormats[1].integrity!({ ...record, version: 2 });
    },
  };
  const upgrade: BackupFormatMigration = {
    from: 2,
    to: 3,
    name: '003_test',
    migrate: (value, directory) => {
      assert.equal(directory, '/private');
      return { ...(value as object), version: 3, extra: 'v3' };
    },
  };
  const steps: number[] = [];
  const result = await migrateBackupFormat(
    v1(),
    '/private',
    async (value, format) => {
      steps.push(format.version);
      await verify(value, format);
    },
    { formats: [...backupFormats, third], migrations: [...backupFormatMigrations, upgrade] },
  );
  assert.deepEqual(steps, [1, 2, 3]);
  assert.equal(parseBackupManifest(result.manifest, [...backupFormats, third]).version, 3);
  await assert.rejects(
    migrateBackupFormat(
      v1(),
      '/private',
      async (value, format) => {
        if (format.version === 2) throw new Error('converted payload corrupt');
        await verify(value, format);
      },
      { formats: [...backupFormats, third], migrations: [...backupFormatMigrations, upgrade] },
    ),
    /converted payload corrupt/,
  );
});

test('missing steps, skipped versions, wrong output and rewritten provenance are rejected', async () => {
  assert.throws(() => validateBackupFormatRegistry(backupFormats, []), /连续/);
  assert.throws(
    () =>
      validateBackupFormatRegistry(
        [backupFormats[0], { ...backupFormats[1], version: 3 }],
        backupFormatMigrations,
      ),
    /连续/,
  );
  assert.throws(
    () => validateBackupFormatRegistry(backupFormats, [{ ...backupFormatMigrations[0], to: 3 }]),
    /连续/,
  );
  for (const change of [
    { version: 1 },
    { applicationVersion: '0.0.1' },
    { schemaVersion: 2 },
    { provider: 'postgres' },
  ]) {
    await assert.rejects(
      migrateBackupFormat(v1(), '/private', verify, {
        formats: backupFormats,
        migrations: [
          {
            ...backupFormatMigrations[0],
            migrate: async (value, directory) => {
              const converted = await backupFormatMigrations[0].migrate(value, directory);
              return { ...(converted as object), ...change };
            },
          },
        ],
      }),
    );
  }
});

test('an in-place converter cannot mutate the source or bypass provenance checks', async () => {
  const source = v1(),
    before = structuredClone(source);
  await assert.rejects(
    migrateBackupFormat(source, '/private', verify, {
      formats: backupFormats,
      migrations: [
        {
          ...backupFormatMigrations[0],
          migrate: async (value, directory) => {
            (value as Record<string, unknown>).applicationVersion = '0.0.1';
            return backupFormatMigrations[0].migrate(value, directory);
          },
        },
      ],
    }),
    /来源信息/,
  );
  assert.deepEqual(source, before);
});
