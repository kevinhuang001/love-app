import { extractCurrentBackup, packBackup } from '../../backup-archive.js';
import { payloadPathsV1, verifyPayloadV1, createIntegrityV1 } from './payload-v1.js';
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
  archive: { name: 'data.tar.zst', extract: extractCurrentBackup, pack: packBackup },
  paths: payloadPathsV1,
  verify: (directory, value) => {
    const m = manifestV2Schema.parse(value);
    return verifyPayloadV1(directory, m.schemaVersion, m.integrity);
  },
  create: async (directory, metadata) => ({
    ...metadata,
    version: 2,
    integrity: await createIntegrityV1(directory),
  }),
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
