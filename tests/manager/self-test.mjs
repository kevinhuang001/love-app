import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { installManager } from '../../manager/releases.mjs';
import { openDatabase } from '../../apps/server/src/db.ts';
import {
  exportDatabase,
  prepareBackupImport,
  extractBackup,
  validatePackage,
  restoreSQLite,
  auditBackupCredentials,
} from '../../apps/server/src/database-backup.ts';
import { restoreToPostgres } from '../../apps/server/src/database-restore.ts';
import {
  inspectMediaCleanup,
  applyMediaCleanup,
  cleanupFingerprint,
} from '../../apps/server/src/media-cleanup.ts';
import { checkDatabase } from '../../apps/server/src/database-check.ts';
import { packBackup } from '../../manager/archive.mjs';
import { backupFormatV1 } from '../../apps/server/src/migrations/backup/001.ts';
import { digestFile } from '../../apps/server/src/backup-archive.ts';
export async function managerSelfTest() {
  const root = await mkdtemp(join(tmpdir(), 'love-native-test-'));
  let db, target;
  const schema = 'manager_' + randomUUID().replaceAll('-', '');
  try {
    // Exercise the update stream inside the compiled runtime on both architectures.
    const replacement = Buffer.from('native-manager-xz-update-fixture');
    const archive = execFileSync('xz', ['--compress', '--stdout'], { input: replacement });
    const archivePath = join(root, 'update.xz');
    const executable = join(root, 'love');
    await writeFile(archivePath, archive);
    await writeFile(executable, 'old-manager');
    await installManager(
      {
        url: 'https://fixture/binary',
        sha256: createHash('sha256').update(replacement).digest('hex'),
        bytes: replacement.length,
        download: {
          url: 'https://fixture/binary.xz',
          sha256: await digestFile(archivePath),
          bytes: archive.length,
          compression: 'xz',
        },
      },
      executable,
      { request: async () => new Response(archive) },
    );
    assert.deepEqual(await readFile(executable), replacement);
    const path = join(root, 'source', 'love.sqlite'),
      media = join(root, 'source', 'media');
    await mkdir(media, { recursive: true });
    db = await openDatabase(path);
    await db.prepare('INSERT INTO couples(id) VALUES(?)').run('pair');
    await db
      .prepare('INSERT INTO users(id,username,name,password,coupleId,email) VALUES(?,?,?,?,?,?)')
      .run('user', 'user', 'User', 'hash', 'pair', 'user@example.test');
    for (const id of ['used', 'orphan']) {
      const names = [id + '-original', id + '-preview', id + '-thumbnail'];
      for (const name of names)
        await writeFile(join(media, name), Buffer.from('native-fixture-' + id));
      const bytes = Buffer.byteLength('native-fixture-' + id);
      await db
        .prepare(
          'INSERT INTO media(id,coupleId,ownerId,kind,original,preview,thumbnail,createdAt) VALUES(?,?,?,?,?,?,?,?)',
        )
        .run(id, 'pair', 'user', 'image', ...names, '2026-10-09');
      await db
        .prepare('INSERT INTO media_sizes VALUES(?,?,?,?,?)')
        .run(id, bytes, bytes, bytes, bytes * 3);
    }
    await db
      .prepare('INSERT INTO moments(id,coupleId,ownerId,title,mediaId,date) VALUES(?,?,?,?,?,?)')
      .run('moment', 'pair', 'user', 'Memory', 'used', '2026-10-09');
    await db.prepare('UPDATE users SET avatarMediaId=? WHERE id=?').run('used', 'user');
    await assert.rejects(
      db.transaction(async () => {
        await db.prepare('UPDATE users SET name=?').run('rolled-back');
        throw new Error('rollback');
      }),
      /rollback/,
    );
    assert.equal((await db.prepare('SELECT name FROM users').get()).name, 'User');
    const plan = await inspectMediaCleanup(db, media);
    assert.deepEqual(
      plan.media.map((x) => x.id),
      ['orphan'],
    );
    await applyMediaCleanup(db, media, plan, cleanupFingerprint(plan));
    assert.equal((await checkDatabase(db, media, true)).issues.length, 0);
    const output = join(root, 'package');
    const report = await exportDatabase({
      db,
      sqlitePath: path,
      mediaDirectory: media,
      directory: output,
    });
    assert.equal(report.mediaRecords, 1);
    assert.equal(report.mediaFiles, 3);
    assert.deepEqual(auditBackupCredentials(join(output, 'love.sqlite'), 'fixture-secret'), {
      ai: 0,
      smtp: 0,
    });
    await packBackup(output, join(root, 'data.tar.zst'));
    assert.deepEqual(
      (await readFile(join(root, 'data.tar.zst'))).subarray(0, 4),
      Buffer.from([0x28, 0xb5, 0x2f, 0xfd]),
    );
    await extractBackup(join(root, 'data.tar.zst'), join(root, 'extracted'));
    assert.deepEqual((await validatePackage(join(root, 'extracted'))).report, report);
    const legacyData = join(root, 'legacy-data'),
      legacyOuter = join(root, 'legacy-backup');
    await cp(output, legacyData, { recursive: true });
    await mkdir(legacyOuter);
    const {
      version: ignored,
      integrity: ignoredIntegrity,
      ...metadata
    } = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
    await writeFile(
      join(legacyData, 'manifest.json'),
      JSON.stringify(await backupFormatV1.create(legacyData, metadata)),
    );
    await backupFormatV1.archive.pack(legacyData, join(legacyOuter, 'data.tar.gz'));
    await writeFile(join(legacyOuter, 'deployment.env'), 'MEDIA_SIGNING_SECRET=fixture-secret\n');
    await writeFile(
      join(legacyOuter, 'SHA256SUMS'),
      (
        await Promise.all(
          ['deployment.env', 'data.tar.gz'].map(
            async (name) => `${await digestFile(join(legacyOuter, name))}  ${name}`,
          ),
        )
      ).join('\n') + '\n',
    );
    const legacy = await prepareBackupImport(legacyOuter, join(root, 'legacy-import'));
    assert.equal(legacy.formatVersion, 1);
    assert.equal(legacy.targetFormatVersion, 2);
    assert.deepEqual(legacy.report, report);
    const destination = join(root, 'restored', 'love.sqlite');
    await restoreSQLite(join(root, 'extracted'), destination);
    target = await openDatabase(destination);
    assert.equal(
      (await target.prepare('SELECT avatarMediaId FROM users').get()).avatarMediaId,
      'used',
    );
    await target.close();
    target = undefined;
    if (process.env.TEST_DATABASE_URL) {
      target = await openDatabase({
        path: process.env.TEST_DATABASE_URL,
        provider: 'postgres',
        schema,
      });
      await restoreToPostgres({
        sourcePath: join(output, 'love.sqlite'),
        mediaDirectory: join(output, 'media'),
        target,
      });
      assert.equal((await checkDatabase(target, media, true)).issues.length, 0);
      const pgPackage = join(root, 'pg-package');
      assert.equal(
        (await exportDatabase({ db: target, mediaDirectory: media, directory: pgPackage }))
          .mediaFiles,
        3,
      );
      await target.exec(`DROP SCHEMA "${schema}" CASCADE`);
    }
    console.log(
      'Native manager self-test passed: XZ manager update, transaction rollback, cleanup, integrity, streamed backup, validation, SQLite restore' +
        (process.env.TEST_DATABASE_URL ? ', PostgreSQL round-trip' : '') +
        '.',
    );
  } finally {
    await target?.close();
    await db?.close();
    await rm(root, { recursive: true, force: true });
  }
}
