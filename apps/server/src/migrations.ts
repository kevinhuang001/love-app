import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { DB, Row } from './db.js';
import { initialMigration } from './migrations/001-initial.js';

export type Migration = Readonly<{
  version: number;
  name: string;
  sqlite: string;
  postgres: string;
}>;
// Append immutable, consecutively numbered migrations for both providers here.
export const migrations: readonly Migration[] = [initialMigration];
export const SCHEMA_VERSION = migrations.at(-1)!.version;
export const migrationHistorySchema = `CREATE TABLE schema_migrations(
  version INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL);`;
export function migrationChecksum(migration: Migration) {
  return createHash('sha256')
    .update(
      JSON.stringify([migration.version, migration.name, migration.sqlite, migration.postgres]),
    )
    .digest('hex');
}
export function validateMigrationHistory(rows: Row[], definitions = migrations): number {
  if (!definitions.length || definitions.some((m, i) => m.version !== i + 1))
    throw new Error('迁移定义必须从 1 开始连续编号');
  if (rows.length > definitions.length || rows.some((r) => Number(r.version) > definitions.length))
    throw new Error('数据库版本高于当前软件，不支持降级');
  for (let i = 0; i < rows.length; i++) {
    const saved = rows[i],
      expected = definitions[i];
    if (
      saved.version !== expected.version ||
      saved.name !== expected.name ||
      saved.checksum !== migrationChecksum(expected)
    )
      throw new Error('数据库迁移历史不连续或迁移校验和不匹配');
  }
  return rows.length;
}
export function sqliteSchemaVersion(sqlite: DatabaseSync, definitions = migrations) {
  const exists = sqlite
    .prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='schema_migrations'")
    .get();
  if (!exists) throw new Error('数据库没有迁移历史，不支持旧结构');
  const rows = sqlite
    .prepare('SELECT version,name,checksum FROM schema_migrations ORDER BY version')
    .all();
  const version = validateMigrationHistory(rows as Row[], definitions);
  if (!version) throw new Error('数据库迁移历史为空');
  return version;
}
export async function migrateDatabase(db: DB, definitions = migrations) {
  // SQLite uses BEGIN IMMEDIATE; PostgreSQL transactions acquire an advisory lock
  // before inspecting/creating the history. DDL, data and history commit together.
  return db.transaction(async () => {
    const tables = await db
      .prepare(
        db.provider === 'sqlite'
          ? "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'"
          : "SELECT table_name AS name FROM information_schema.tables WHERE table_schema=current_schema() AND table_type='BASE TABLE'",
      )
      .all();
    const hasHistory = tables.some((row) => row.name === 'schema_migrations');
    if (!hasHistory) {
      if (
        tables.length ||
        (db.provider === 'sqlite' &&
          (await db.prepare('PRAGMA user_version').get())!.user_version !== 0)
      )
        throw new Error('数据库没有迁移历史，不支持旧结构；请使用新的数据库');
      await db.exec(migrationHistorySchema);
    }
    const rows = await db
      .prepare('SELECT version,name,checksum FROM schema_migrations ORDER BY version')
      .all();
    if (!rows.length && tables.some((row) => row.name !== 'schema_migrations'))
      throw new Error('数据库迁移历史为空，不支持已有结构');
    const version = validateMigrationHistory(rows, definitions);
    for (const migration of definitions.slice(version)) {
      await db.exec(migration[db.provider]);
      await db
        .prepare('INSERT INTO schema_migrations(version,name,checksum,applied_at) VALUES(?,?,?,?)')
        .run(
          migration.version,
          migration.name,
          migrationChecksum(migration),
          new Date().toISOString(),
        );
    }
    return definitions.at(-1)!.version;
  });
}
