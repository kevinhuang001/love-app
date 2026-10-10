import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { DB, Row } from './db.js';
import { SCHEMA_VERSION, sqliteSchemaVersion } from './migrations.js';
import { MediaRepository } from './media-repository.js';
import { commitMedia } from './media-storage.js';

import {
  inspectPayloadV1,
  rowHash,
  streamHash,
  quote,
  type TransferReport,
} from './migrations/backup/payload-v1.js';
export { transferTables, type TransferReport } from './migrations/backup/payload-v1.js';
export async function restoreToPostgres({
  sourcePath,
  mediaDirectory,
  target,
  progress = () => {},
  allowPreviousVersion = false,
}: {
  sourcePath: string;
  mediaDirectory: string;
  target?: DB;
  progress?: (message: string) => void;
  allowPreviousVersion?: boolean;
}): Promise<TransferReport> {
  if (target && target.provider !== 'postgres') throw new Error('目标必须是 PostgreSQL');
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  const repository = target ? new MediaRepository(target, mediaDirectory) : undefined;
  try {
    source.exec('BEGIN'); // A stable read snapshot; never upgrades or modifies the source.
    const sourceVersion = sqliteSchemaVersion(source);
    const previous = allowPreviousVersion && !target && sourceVersion < SCHEMA_VERSION;
    if (sourceVersion !== SCHEMA_VERSION && !previous)
      throw new Error('源 SQLite 需要先执行数据库迁移');
    if (source.prepare('PRAGMA integrity_check').get()!.integrity_check !== 'ok')
      throw new Error('源 SQLite 完整性检查失败');
    if (source.prepare('PRAGMA foreign_key_check').all().length)
      throw new Error('源 SQLite 存在无效关联，恢复未开始');
    const { tables, files, report } = await inspectPayloadV1(source, mediaDirectory, progress);
    if (!target) return report;
    for (const table of tables) {
      const columns = table.columns,
        name = table.name;
      const targetColumns = (
        await target
          .prepare(
            'SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=? ORDER BY ordinal_position',
          )
          .all(name)
      ).map((column) => String(column.column_name));
      // Upgrades append columns; fresh schemas may declare them in the middle.
      // INSERT/SELECT below name every column explicitly, so physical order is irrelevant.
      const missing = columns.filter((column) => !targetColumns.includes(column));
      const extra = targetColumns.filter((column) => !columns.includes(column));
      if (missing.length || extra.length)
        throw new Error(
          `目标表结构不一致：${name}（目标缺少：${missing.join('、') || '无'}；目标多出：${extra.join('、') || '无'}）`,
        );
    }
    // New schema tables are ordered from their actual foreign-key dependencies.
    // The existing avatar cycle is filled after media, as before.
    const pending = [...tables],
      insertionOrder: typeof tables = [];
    while (pending.length) {
      const index = pending.findIndex((table) =>
        source
          .prepare(`PRAGMA foreign_key_list(${quote(table.name)})`)
          .all()
          .every(
            (fk) =>
              (table.name === 'users' && fk.from === 'avatarMediaId') ||
              fk.table === table.name ||
              !pending.some((t) => t.name === fk.table),
          ),
      );
      if (index < 0) throw new Error('恢复表存在未处理的循环外键，需要对应的数据适配器');
      insertionOrder.push(pending.splice(index, 1)[0]);
    }
    const restoreId = randomUUID();
    const verify = async () => {
      for (const table of tables) {
        const hash = createHash('sha256');
        let count = 0;
        await target.exec(
          `DECLARE transfer_verify NO SCROLL CURSOR FOR SELECT ${table.columns.map(quote).join(',')} FROM ${quote(table.name)} ORDER BY ${table.pgOrder}`,
        );
        try {
          while (true) {
            const rows = await target.prepare('FETCH FORWARD 500 FROM transfer_verify').all();
            if (!rows.length) break;
            for (const row of rows) {
              rowHash(hash, table.columns, row);
              count++;
            }
          }
        } finally {
          await target.exec('CLOSE transfer_verify');
        }
        if (count !== table.count || hash.digest('hex') !== table.digest)
          throw new Error(`恢复数据核对失败：${table.name}`);
      }
      for (const file of files) {
        const row = await target
          .prepare('SELECT mediaId,bytes,sha256 FROM media_files WHERE name=? AND complete=1')
          .get(file.name);
        const actual = await streamHash(repository!.stream(file.name));
        if (
          row?.mediaId !== file.mediaId ||
          row.bytes !== file.bytes ||
          row.sha256 !== file.digest ||
          actual.bytes !== file.bytes ||
          actual.digest !== file.digest
        )
          throw new Error('数据库媒体校验失败');
      }
    };
    return await commitMedia(
      target,
      async () => {
        if (
          !(await target
            .prepare(
              "SELECT 1 value FROM information_schema.tables WHERE table_schema=current_schema() AND table_name='database_restores'",
            )
            .get())
        )
          return false;
        const saved = await target
          .prepare('SELECT report FROM database_restores WHERE id=?')
          .get(restoreId);
        return Boolean(
          saved && JSON.stringify(JSON.parse(String(saved.report))) === JSON.stringify(report),
        );
      },
      async () => {
        await target.exec(
          'CREATE TABLE IF NOT EXISTS database_restores(id TEXT PRIMARY KEY, report TEXT NOT NULL, completedAt TEXT NOT NULL)',
        );
        // RESTORE was confirmed by the administrator; replace populated destinations too.
        await target.exec('DELETE FROM database_restores');
        await target.exec('UPDATE users SET "avatarMediaId"=NULL');
        await target.exec('DELETE FROM media_files');
        await target.exec('DELETE FROM media_uploads');
        for (const table of [...insertionOrder].reverse())
          await target.exec(`DELETE FROM ${quote(table.name)}`);
        // SQLite REAL is a double; PostgreSQL REAL is single precision. Preserve
        // durations/log timings exactly so cross-driver verification is meaningful.
        await target.exec('ALTER TABLE media ALTER COLUMN duration TYPE DOUBLE PRECISION');
        await target.exec(
          'ALTER TABLE access_logs ALTER COLUMN "durationMs" TYPE DOUBLE PRECISION',
        );
        for (const table of insertionOrder) {
          progress(`正在导入 ${table.name}：${table.count} 条…`);
          const insert = target.prepare(
            `INSERT INTO ${quote(table.name)}(${table.columns.map(quote).join(',')}) VALUES(${table.columns.map(() => '?').join(',')})`,
          );
          for (const row of source
            .prepare(`SELECT * FROM ${quote(table.name)} ORDER BY ${table.order}`)
            .iterate())
            await insert.run(
              ...table.columns.map((column) =>
                table.name === 'users' && column === 'avatarMediaId' ? null : row[column],
              ),
            );
        }
        for (const user of source
          .prepare('SELECT id,avatarMediaId FROM users WHERE avatarMediaId IS NOT NULL')
          .iterate())
          await target
            .prepare('UPDATE users SET avatarMediaId=? WHERE id=?')
            .run(user.avatarMediaId, user.id);
        for (const [index, file] of files.entries()) {
          progress(
            `正在写入媒体 ${index + 1}/${files.length}（${(file.bytes / 1048576).toFixed(1)} MiB）…`,
          );
          await repository!.stage([file.name], [file.bytes], true);
          await repository!.bind(file.mediaId, [file.name]);
        }
        for (const identity of source
          .prepare('SELECT name FROM sqlite_sequence ORDER BY name')
          .all()) {
          const name = String(identity.name);
          const sequence = Number(
            source.prepare('SELECT seq FROM sqlite_sequence WHERE name=?').get(name)?.seq || 0,
          );
          const maximum = Number(
            source.prepare(`SELECT COALESCE(MAX(id),0) value FROM ${quote(name)}`).get()!.value,
          );
          const value = Math.max(sequence, maximum);
          if (!Number.isSafeInteger(value + 1)) throw new Error('源数据库自增序号无效');
          const sequenceName = (await target
            .prepare('SELECT pg_get_serial_sequence(?,?) value')
            .get(name, 'id'))!.value;
          // RESTART is transactional, unlike setval: a failed import also restores counters.
          await target.exec(
            `ALTER SEQUENCE ${sequenceName} RESTART WITH ${Math.max(1, value + 1)}`,
          );
        }
        progress('正在逐表核对数据和数据库媒体 SHA-256…');
        await verify();
        await target
          .prepare('INSERT INTO database_restores VALUES(?,?,?)')
          .run(restoreId, JSON.stringify(report), new Date().toISOString());
        return report;
      },
    );
  } finally {
    source.close();
  }
}
