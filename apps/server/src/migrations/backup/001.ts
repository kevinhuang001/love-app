import { createGunzip, createGzip } from 'node:zlib';
import { extractTarArchive, packTarArchive } from '../../backup-archive.js';
import { payloadPathsV1, verifyPayloadV1, createIntegrityV1 } from './payload-v1.js';
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
  archive: {
    name: 'data.tar.gz',
    extract: (archive, directory) => extractTarArchive(archive, directory, createGunzip()),
    pack: (directory, destination) => packTarArchive(directory, destination, createGzip()),
  },
  paths: payloadPathsV1,
  verify: (directory, value) => {
    const m = manifestV1Schema.parse(value);
    return verifyPayloadV1(directory, m.schemaVersion, backupFormatV1.integrity!(m));
  },
  create: async (directory, metadata) => {
    const { databaseSha256, report } = await createIntegrityV1(directory);
    return { ...metadata, version: 1, databaseSha256, report };
  },
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
