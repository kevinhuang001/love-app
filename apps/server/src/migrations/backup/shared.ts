import { z } from 'zod';

// Version 1 integrity contract. Keep this schema and its digest algorithm stable.
export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const reportSchema = z
  .object({
    sourceDigest: sha256Schema,
    tables: z.record(z.string(), count),
    mediaRecords: count,
    mediaFiles: count,
    mediaBytes: count,
  })
  .strict();
export const manifestFields = {
  format: z.literal('love-backup'),
  applicationVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  schemaVersion: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  provider: z.enum(['sqlite', 'postgres']),
  createdAt: z.iso.datetime(),
};
export type BackupIntegrity = {
  algorithm: 'sha256';
  reportVersion: 1;
  databaseSha256: string;
  report: z.infer<typeof reportSchema>;
};
export type BackupFormat = Readonly<{
  version: number;
  parse: (value: unknown) => unknown;
  integrity: (value: unknown) => BackupIntegrity;
}>;
export type BackupFormatMigration = Readonly<{
  from: number;
  to: number;
  name: string;
  // Only the caller's private extracted directory may be changed, never the source archive.
  migrate: (value: unknown, directory: string) => unknown | Promise<unknown>;
}>;
