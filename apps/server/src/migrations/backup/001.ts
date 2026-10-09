import { z } from 'zod';
import { manifestFields, reportSchema, sha256Schema, type BackupFormat } from './shared.js';

export const manifestV1Schema = z
  .object({
    ...manifestFields,
    version: z.literal(1),
    databaseSha256: sha256Schema,
    report: reportSchema,
  })
  .strict();
export const backupFormatV1: BackupFormat = {
  version: 1,
  parse: (value) => manifestV1Schema.parse(value),
  integrity: (value) => {
    const manifest = manifestV1Schema.parse(value);
    return {
      algorithm: 'sha256',
      reportVersion: 1,
      databaseSha256: manifest.databaseSha256,
      report: manifest.report,
    };
  },
};
