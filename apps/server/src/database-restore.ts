import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { DB, Row } from './db.js';
import { MediaRepository } from './media-repository.js';
import { commitMedia } from './media-storage.js';

// Explicit dependency order. The users -> media avatar reference is restored after media.
export const transferTables = [
  'couples',
  'users',
  'media',
  'sessions',
  'invites',
  'administrators',
  'messages',
  'message_media',
  'moments',
  'anniversaries',
  'todos',
  'couple_ai_settings',
  'couple_media_settings',
  'ai_jobs',
  'ai_actions',
  'registration_invites',
  'album_imports',
  'server_config',
  'admin_sessions',
  'captchas',
  'email_codes',
  'email_allowlist',
  'media_sizes',
  'couple_limits',
  'access_logs',
  'server_logs',
  'audit_logs',
] as const;
const identities = ['messages', 'access_logs', 'server_logs', 'audit_logs'];
const quote = (identifier: string) => '"' + identifier.replaceAll('"', '""') + '"';
type Table = {
  name: string;
  columns: string[];
  order: string;
  pgOrder: string;
  count: number;
  digest: string;
};
type File = { name: string; mediaId: string; bytes: number; digest: string };
export type TransferReport = {
  sourceDigest: string;
  tables: Record<string, number>;
  mediaRecords: number;
  mediaFiles: number;
  mediaBytes: number;
};
function rowHash(hash: ReturnType<typeof createHash>, columns: string[], row: Row) {
  hash.update(JSON.stringify(columns.map((column) => row[column])) + '\n');
}
async function streamHash(stream: AsyncIterable<Buffer | string>) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const part of stream) {
    hash.update(part);
    bytes += Buffer.byteLength(part);
  }
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new Error('媒体文件为空或容量无效');
  return { bytes, digest: hash.digest('hex') };
}

export async function restoreToPostgres({
  sourcePath,
  mediaDirectory,
  target,
  progress = () => {},
}: {
  sourcePath: string;
  mediaDirectory: string;
  target?: DB;
  progress?: (message: string) => void;
}): Promise<TransferReport> {
  if (target && target.provider !== 'postgres') throw new Error('目标必须是 PostgreSQL');
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  const repository = target ? new MediaRepository(target, mediaDirectory) : undefined;
  try {
    source.exec('BEGIN'); // A stable read snapshot; never upgrades or modifies the source.
    if (source.prepare('PRAGMA user_version').get()!.user_version !== 9)
      throw new Error('源 SQLite 结构版本不是 9，请先在原 SQLite 部署完成软件更新');
    if (source.prepare('PRAGMA integrity_check').get()!.integrity_check !== 'ok')
      throw new Error('源 SQLite 完整性检查失败');
    if (source.prepare('PRAGMA foreign_key_check').all().length)
      throw new Error('源 SQLite 存在无效关联，恢复未开始');
    const names = source
      .prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => String(row.name));
    if (
      names.length !== transferTables.length ||
      names.some((name) => !transferTables.includes(name as (typeof transferTables)[number]))
    )
      throw new Error('源 SQLite 表结构与当前应用不一致');
    const tables: Table[] = [];
    for (const name of transferTables) {
      const info = source.prepare(`PRAGMA table_info(${quote(name)})`).all();
      const columns = info.map((column) => String(column.name));
      const primary = info
        .filter((column) => Number(column.pk) > 0)
        .sort((a, b) => Number(a.pk) - Number(b.pk))
        .map((column) => String(column.name));
      const order = (primary.length ? primary : columns).map(quote).join(',');
      const pgOrder = (primary.length ? primary : columns)
        .map(
          (column) =>
            quote(column) +
            (info.find((entry) => entry.name === column)?.type === 'TEXT' ? ' COLLATE "C"' : '') +
            ' NULLS FIRST',
        )
        .join(',');
      const hash = createHash('sha256');
      let count = 0;
      for (const row of source
        .prepare(`SELECT * FROM ${quote(name)} ORDER BY ${order}`)
        .iterate()) {
        rowHash(hash, columns, row as Row);
        count++;
      }
      tables.push({ name, columns, order, pgOrder, count, digest: hash.digest('hex') });
    }
    progress('数据库完整性检查通过，正在校验源媒体…');
    const files: File[] = [],
      usedNames = new Set<string>();
    let mediaRecords = 0,
      mediaBytes = 0;
    for (const media of source.prepare('SELECT * FROM media ORDER BY id').iterate()) {
      mediaRecords++;
      let total = 0;
      for (const name of new Set(
        [media.original, media.preview, media.thumbnail].filter(Boolean).map(String),
      )) {
        if (name !== basename(name) || name === '.' || name === '..' || usedNames.has(name))
          throw new Error('源媒体路径无效或多个媒体共享同一文件');
        usedNames.add(name);
        const handle = await open(
          join(mediaDirectory, name),
          constants.O_RDONLY | constants.O_NOFOLLOW,
        );
        let verified;
        try {
          verified = await streamHash(handle.createReadStream({ autoClose: false }));
        } finally {
          await handle.close();
        }
        files.push({ name, mediaId: String(media.id), ...verified });
        total += verified.bytes;
      }
      const sizes = source
        .prepare('SELECT totalBytes FROM media_sizes WHERE mediaId=?')
        .get(media.id);
      if (!sizes || total !== sizes.totalBytes)
        throw new Error(`源媒体容量记录不一致：${media.id}`);
      mediaBytes += total;
      if (!Number.isSafeInteger(mediaBytes)) throw new Error('源媒体总容量无效');
    }
    const sourceDigest = createHash('sha256')
      .update(
        JSON.stringify({
          tables,
          files,
          sequences: source.prepare('SELECT name,seq FROM sqlite_sequence ORDER BY name').all(),
        }),
      )
      .digest('hex');
    const report: TransferReport = {
      sourceDigest,
      tables: Object.fromEntries(tables.map((table) => [table.name, table.count])),
      mediaRecords,
      mediaFiles: files.length,
      mediaBytes,
    };
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
      if (JSON.stringify(columns) !== JSON.stringify(targetColumns))
        throw new Error(`目标表结构不一致：${name}`);
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
        for (const table of [...tables].reverse())
          await target.exec(`DELETE FROM ${quote(table.name)}`);
        // SQLite REAL is a double; PostgreSQL REAL is single precision. Preserve
        // durations/log timings exactly so cross-driver verification is meaningful.
        await target.exec('ALTER TABLE media ALTER COLUMN duration TYPE DOUBLE PRECISION');
        await target.exec(
          'ALTER TABLE access_logs ALTER COLUMN "durationMs" TYPE DOUBLE PRECISION',
        );
        for (const table of tables) {
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
        for (const name of identities) {
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
