import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../apps/server/src/db.ts';
import {
  exportDatabase,
  extractBackup,
  validatePackage,
  restoreSQLite,
  auditBackupCredentials,
} from '../apps/server/src/database-backup.ts';
import { restoreToPostgres } from '../apps/server/src/database-restore.ts';
import {
  inspectMediaCleanup,
  applyMediaCleanup,
  cleanupFingerprint,
} from '../apps/server/src/media-cleanup.ts';
import { checkDatabase } from '../apps/server/src/database-check.ts';
import { packBackup } from '../deploy/archive.mjs';
export async function managerSelfTest() {
  const root = await mkdtemp(join(tmpdir(), 'love-native-test-'));
  let db, target;
  const schema = 'manager_' + randomUUID().replaceAll('-', '');
  try {
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
    await packBackup(output, join(root, 'data.tar.gz'));
    await extractBackup(join(root, 'data.tar.gz'), join(root, 'extracted'));
    assert.deepEqual((await validatePackage(join(root, 'extracted'))).report, report);
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
      'Native manager self-test passed: transaction rollback, cleanup, integrity, streamed backup, validation, SQLite restore' +
        (process.env.TEST_DATABASE_URL ? ', PostgreSQL round-trip' : '') +
        '.',
    );
  } finally {
    await target?.close();
    await db?.close();
    await rm(root, { recursive: true, force: true });
  }
}
