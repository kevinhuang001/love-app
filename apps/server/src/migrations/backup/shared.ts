import type { Writable } from 'node:stream';
import type { TransferReport } from './payload-v1.js';
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
  // Legacy convenience for formats 1/2 only; the engine uses verify/create hooks.
  integrity?: (value: unknown) => BackupIntegrity;
  // Optional only for manifest-only test definitions; package operations require these hooks.
  archive?: Readonly<{
    name: string;
    extract: (archive: string, directory: string) => Promise<void>;
    pack: (directory: string, destination: string | Writable) => Promise<void>;
  }>;
  paths?: (directory: string) => { database: string; media: string };
  verify?: (directory: string, manifest: unknown) => Promise<TransferReport>;
  create?: (directory: string, metadata: BackupMetadata) => Promise<unknown>;
}>;
export type BackupFormatMigration = Readonly<{
  from: number;
  to: number;
  name: string;
  // Only the caller's private extracted directory may be changed, never the source archive.
  migrate: (value: unknown, directory: string) => unknown | Promise<unknown>;
}>;

export type BackupMetadata = {
  format: 'love-backup';
  applicationVersion: string;
  schemaVersion: number;
  provider: 'sqlite' | 'postgres';
  createdAt: string;
};
