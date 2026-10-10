import { backupFormatV1 } from './migrations/backup/001.js';
import { backupFormatV2, migrateBackupV1ToV2 } from './migrations/backup/002.js';
import type { BackupFormat, BackupFormatMigration } from './migrations/backup/shared.js';
export type { BackupFormat, BackupFormatMigration } from './migrations/backup/shared.js';

export const backupFormats: readonly BackupFormat[] = [backupFormatV1, backupFormatV2];
export const backupFormatMigrations: readonly BackupFormatMigration[] = [migrateBackupV1ToV2];
export const BACKUP_FORMAT_VERSION = backupFormats.at(-1)!.version;

export function validateBackupFormatRegistry(
  formats = backupFormats,
  migrations = backupFormatMigrations,
) {
  if (
    !formats.length ||
    formats.some((format, i) => format.version !== i + 1) ||
    migrations.length !== formats.length - 1 ||
    migrations.some(
      (migration, i) => migration.from !== i + 1 || migration.to !== i + 2 || !migration.name,
    )
  )
    throw new Error('备份格式定义和迁移必须从 1 开始逐版连续，不允许缺少迁移');
}
export function parseBackupManifest(value: unknown, formats = backupFormats) {
  const version = (value as { version?: unknown } | null)?.version;
  if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 1)
    throw new Error('备份格式版本无效');
  if (version > formats.length) throw new Error('备份格式版本高于当前软件，不支持导入');
  const format = formats[version - 1];
  if (!format || format.version !== version) throw new Error('备份格式版本不受支持');
  try {
    return { version, manifest: format.parse(value), format };
  } catch {
    throw new Error(`备份格式 ${version} 清单不匹配，字段或版本无效`);
  }
}

// Each historical reader verifies its own payload before any converter runs. The new
// reader then verifies the converted payload, before another format or SQL migration.
export async function migrateBackupFormat(
  value: unknown,
  directory: string,
  verify: (manifest: unknown, format: BackupFormat) => Promise<void>,
  definitions: {
    formats: readonly BackupFormat[];
    migrations: readonly BackupFormatMigration[];
  } = {
    formats: backupFormats,
    migrations: backupFormatMigrations,
  },
) {
  const { formats, migrations } = definitions;
  validateBackupFormatRegistry(formats, migrations);
  let current = parseBackupManifest(value, formats);
  await verify(current.manifest, current.format);
  const sourceVersion = current.version;
  while (current.version < formats.length) {
    const migration = migrations[current.version - 1];
    const converted = await migration.migrate(structuredClone(current.manifest), directory);
    const next = parseBackupManifest(converted, formats);
    if (next.version !== migration.to) throw new Error('备份格式迁移没有生成预期版本');
    for (const key of ['format', 'applicationVersion', 'schemaVersion', 'provider', 'createdAt']) {
      if (
        (next.manifest as Record<string, unknown>)[key] !==
        (current.manifest as Record<string, unknown>)[key]
      )
        throw new Error('备份格式迁移不得改写来源信息或数据库版本');
    }
    await verify(next.manifest, next.format);
    current = next;
  }
  return { sourceVersion, manifest: current.manifest };
}
