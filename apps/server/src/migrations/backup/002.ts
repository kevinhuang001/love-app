import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createGunzip } from 'node:zlib';
import { extractTarArchive, packBackup, extractCurrentBackup } from '../../backup-archive.js';
import { z } from 'zod';
import { manifestV1Schema } from './001.js';
import {
  manifestFields,
  reportSchema,
  sha256Schema,
  type BackupFormat,
  type BackupFormatMigration,
} from './shared.js';

export const manifestV2Schema = z
  .object({
    ...manifestFields,
    version: z.literal(2),
    integrity: z
      .object({
        algorithm: z.literal('sha256'),
        reportVersion: z.literal(1),
        databaseSha256: sha256Schema,
        report: reportSchema,
      })
      .strict(),
  })
  .strict();
export type BackupManifest = z.infer<typeof manifestV2Schema>;
export const backupFormatV2: BackupFormat = {
  version: 2,
  parse: (value) => manifestV2Schema.parse(value),
  integrity: (value) => manifestV2Schema.parse(value).integrity,
};
export const migrateBackupV1ToV2: BackupFormatMigration = {
  from: 1,
  to: 2,
  name: '002_explicit_integrity',
  migrate: (value) => {
    const { databaseSha256, report, ...metadata } = manifestV1Schema.parse(value);
    return {
      ...metadata,
      version: 2,
      integrity: { algorithm: 'sha256', reportVersion: 1, databaseSha256, report },
    };
  },
};

// Legacy gzip support belongs exclusively to format 1. Convert its verified private
// payload to a real current archive before handing it to the ordinary restore path.
export async function convertBackupV1Archive<T>(
  archive: string,
  directory: string,
  normalize: (privateDirectory: string) => Promise<T>,
): Promise<T> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const legacy = join(directory, '.format-1'),
    converted = join(directory, '.format-2.tar.zst');
  try {
    await extractTarArchive(archive, legacy, createGunzip());
    manifestV1Schema.parse(JSON.parse(await readFile(join(legacy, 'manifest.json'), 'utf8')));
    const original = await normalize(legacy);
    await packBackup(legacy, converted);
    await extractCurrentBackup(converted, directory);
    return original;
  } finally {
    await rm(legacy, { recursive: true, force: true });
    await rm(converted, { force: true });
  }
}
