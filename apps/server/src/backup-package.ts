import { mkdir, mkdtemp, readFile, writeFile, rename, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Writable } from 'node:stream';
import {
  backupFormats,
  backupFormatMigrations,
  migrateBackupFormat,
  parseBackupManifest,
  validateBackupFormatRegistry,
} from './backup-format.js';
import { verifyBackupDirectory } from './backup-archive.js';
import { assertBackupVersion } from './version.js';
import type {
  BackupFormat,
  BackupFormatMigration,
  BackupMetadata,
} from './migrations/backup/shared.js';

export type BackupRegistry = {
  formats: readonly BackupFormat[];
  migrations: readonly BackupFormatMigration[];
};
export const backupRegistry: BackupRegistry = {
  formats: backupFormats,
  migrations: backupFormatMigrations,
};
export type PackageFormat = BackupFormat &
  Required<Pick<BackupFormat, 'archive' | 'paths' | 'verify' | 'create'>>;
export function packageFormat(format: BackupFormat): PackageFormat {
  if (
    !format.archive ||
    !format.paths ||
    !format.verify ||
    !format.create ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(format.archive.name) ||
    format.archive.name === 'deployment.env'
  )
    throw new Error('备份版本模块缺少有效的归档、路径、校验或生成定义');
  return format as PackageFormat;
}
export function currentBackupFormat(registry = backupRegistry) {
  validateBackupFormatRegistry(registry.formats, registry.migrations);
  return packageFormat(registry.formats.at(-1)!);
}
export const BACKUP_ARCHIVE_NAME = currentBackupFormat().archive.name;
export const backupPaths = (directory: string, registry = backupRegistry) =>
  currentBackupFormat(registry).paths(directory);
export const packCurrentBackup = (directory: string, destination: string | Writable) =>
  currentBackupFormat().archive.pack(directory, destination);
const readManifest = async (directory: string) =>
  JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
async function saveManifest(directory: string, manifest: unknown) {
  const temporary = join(directory, '.manifest-' + randomUUID());
  try {
    await writeFile(temporary, JSON.stringify(manifest) + '\n', { mode: 0o600, flag: 'wx' });
    await rename(temporary, join(directory, 'manifest.json'));
  } finally {
    await rm(temporary, { force: true });
  }
}
export async function refreshBackupPackage(
  directory: string,
  metadata: BackupMetadata,
  registry = backupRegistry,
) {
  const format = currentBackupFormat(registry);
  const manifest = format.parse(await format.create(directory, metadata));
  if ((manifest as { version: number }).version !== format.version)
    throw new Error('版本模块生成了错误的备份版本');
  for (const key of Object.keys(metadata) as (keyof BackupMetadata)[])
    if ((manifest as BackupMetadata)[key] !== metadata[key])
      throw new Error('版本模块生成了错误的来源信息');
  const report = await format.verify(directory, manifest);
  await saveManifest(directory, manifest);
  return report;
}
export async function normalizeBackupPackage(directory: string, registry = backupRegistry) {
  const original = parseBackupManifest(await readManifest(directory), registry.formats);
  const metadata = original.manifest as BackupMetadata;
  assertBackupVersion(metadata.applicationVersion, metadata.schemaVersion);
  const converted = await migrateBackupFormat(
    original.manifest,
    directory,
    async (manifest, definition) => {
      const m = manifest as BackupMetadata;
      assertBackupVersion(m.applicationVersion, m.schemaVersion);
      await packageFormat(definition).verify(directory, manifest);
    },
    registry,
  );
  const latest = currentBackupFormat(registry);
  const manifest = latest.parse(converted.manifest);
  const report = await latest.verify(directory, manifest);
  if (converted.sourceVersion < latest.version) await saveManifest(directory, manifest);
  return {
    provider: metadata.provider,
    report,
    applicationVersion: metadata.applicationVersion,
    schemaVersion: metadata.schemaVersion,
    formatVersion: converted.sourceVersion,
    targetFormatVersion: latest.version,
    paths: latest.paths(directory),
  };
}

// The source envelope selects a version-owned archive reader. Every historical package
// passes its own verifier and each adjacent migration before ordinary target restoration.
export async function importBackupPackage(
  sourceDirectory: string,
  directory: string,
  registry = backupRegistry,
) {
  const latest = currentBackupFormat(registry);
  const formats = registry.formats.map(packageFormat);
  const archiveName = await verifyBackupDirectory(sourceDirectory, [
    ...new Set(formats.map((f) => f.archive.name)),
  ]);
  for (const format of formats) {
    const first = formats.find((f) => f.archive.name === format.archive.name)!;
    if (first.archive.extract !== format.archive.extract)
      throw new Error('相同归档名必须使用相同读取器；编码变化请声明新归档名');
  }
  const reader = formats.find((f) => f.archive.name === archiveName)!;
  await mkdir(dirname(directory), { recursive: true, mode: 0o700 });
  const staging = await mkdtemp(join(dirname(directory), '.backup-import-'));
  const convertedArchive = join(dirname(directory), '.backup-converted-' + randomUUID());
  try {
    await reader.archive.extract(join(sourceDirectory, archiveName), staging);
    const source = parseBackupManifest(await readManifest(staging), registry.formats);
    if (packageFormat(source.format).archive.name !== archiveName)
      throw new Error('备份归档编码与声明的版本不匹配');
    const normalized = await normalizeBackupPackage(staging, registry);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    if ((await readdir(directory)).length) throw new Error('备份工作目录必须为空');
    if (normalized.formatVersion < latest.version) {
      await latest.archive.pack(staging, convertedArchive);
      await latest.archive.extract(convertedArchive, directory);
    } else {
      for (const name of await readdir(staging))
        await rename(join(staging, name), join(directory, name));
    }
    await latest.verify(directory, await readManifest(directory));
    return { ...normalized, paths: latest.paths(directory) };
  } finally {
    await rm(staging, { recursive: true, force: true });
    await rm(convertedArchive, { force: true });
  }
}
