import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { digestFile } from '../../backup-archive.js';
import { sqliteSchemaVersion } from '../../migrations.js';
import type { BackupIntegrity } from './shared.js';
import { basename, join } from 'node:path';
import type { Row } from '../../db.js';
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
export const quote = (identifier: string) => '"' + identifier.replaceAll('"', '""') + '"';
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
export function rowHash(hash: ReturnType<typeof createHash>, columns: string[], row: Row) {
  hash.update(JSON.stringify(columns.map((column) => row[column])) + '\n');
}
export async function streamHash(stream: AsyncIterable<Buffer | string>) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const part of stream) {
    hash.update(part);
    bytes += Buffer.byteLength(part);
  }
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new Error('媒体文件为空或容量无效');
  return { bytes, digest: hash.digest('hex') };
}

// Report version 1: never change ordering, hashing or media interpretation here.
export async function inspectPayloadV1(
  source: DatabaseSync,
  mediaDirectory: string,
  progress: (message: string) => void = () => {},
) {
  const names = source
    .prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((row) => String(row.name))
    .filter((name) => !['media_uploads', 'schema_migrations'].includes(name));
  const tables: Table[] = [];
  for (const name of [
    ...transferTables.filter((name) => names.includes(name)),
    ...names
      .filter((name) => !transferTables.includes(name as (typeof transferTables)[number]))
      .sort(),
  ]) {
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
    for (const row of source.prepare(`SELECT * FROM ${quote(name)} ORDER BY ${order}`).iterate()) {
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
    if (!sizes || total !== sizes.totalBytes) throw new Error(`源媒体容量记录不一致：${media.id}`);
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

  return { tables, files, report };
}

export const payloadPathsV1 = (directory: string) => ({
  database: join(directory, 'love.sqlite'),
  media: join(directory, 'media'),
});
export async function verifyPayloadV1(
  directory: string,
  schemaVersion: number,
  integrity: BackupIntegrity,
) {
  const paths = payloadPathsV1(directory);
  if (integrity.databaseSha256 !== (await digestFile(paths.database)))
    throw new Error('备份清单或内容摘要不匹配');
  const source = new DatabaseSync(paths.database, { readOnly: true });
  try {
    source.exec('BEGIN');
    if (sqliteSchemaVersion(source) !== schemaVersion)
      throw new Error('备份清单与数据库版本不一致');
    if (
      source.prepare('PRAGMA integrity_check').get()!.integrity_check !== 'ok' ||
      source.prepare('PRAGMA foreign_key_check').all().length
    )
      throw new Error('备份数据库完整性或关联校验失败');
    const { report } = await inspectPayloadV1(source, paths.media);
    if (!isDeepStrictEqual(report, integrity.report)) throw new Error('备份清单或内容摘要不匹配');
    return report;
  } finally {
    source.close();
  }
}
export async function createIntegrityV1(
  directory: string,
  paths = payloadPathsV1(directory),
): Promise<BackupIntegrity> {
  const source = new DatabaseSync(paths.database, { readOnly: true });
  try {
    source.exec('BEGIN');
    if (
      source.prepare('PRAGMA integrity_check').get()!.integrity_check !== 'ok' ||
      source.prepare('PRAGMA foreign_key_check').all().length
    )
      throw new Error('备份数据库完整性或关联校验失败');
    const { report } = await inspectPayloadV1(source, paths.media);
    return {
      algorithm: 'sha256',
      reportVersion: 1,
      databaseSha256: await digestFile(paths.database),
      report,
    };
  } finally {
    source.close();
  }
}
