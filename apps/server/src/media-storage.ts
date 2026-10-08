import { constants } from 'node:fs';
import { open, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { DB } from './db.js';
import { HttpError } from './errors.js';
import {
  CommitUncertainError,
  isTransientPostgresError,
  postgresSettings,
  PostgresUnavailableError,
} from './postgres.js';
import { setTimeout as delay } from 'node:timers/promises';

// Decoder completion is not disk durability. Sync every retained file and its directory
// before adding media/quota rows; a failed sync is an upload failure, never billable storage.
export async function syncMediaFiles(directory: string, names: string[]): Promise<number[]> {
  const sizes = new Map<string, number>();
  for (const name of new Set(names.filter(Boolean))) {
    if (name !== basename(name)) throw new HttpError(500, '媒体文件路径无效');
    const file = await open(join(directory, name), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await file.stat();
      if (!info.isFile() || !Number.isSafeInteger(info.size) || info.size <= 0)
        throw new HttpError(422, '媒体文件不完整，未计入存储');
      await file.sync();
      sizes.set(name, info.size);
    } finally {
      await file.close();
    }
  }
  const directoryHandle = await open(directory, constants.O_RDONLY | constants.O_DIRECTORY);
  try {
    await directoryHandle.sync();
  } finally {
    await directoryHandle.close();
  }
  return names.map((name) => (name ? sizes.get(name)! : 0));
}

export async function commitMedia<T>(
  db: DB,
  proof: () => Promise<boolean>,
  action: () => Promise<T>,
): Promise<T> {
  // Callers provide database-only mutations with preallocated IDs; files are already durable.
  // Retrying these callbacks after a confirmed rollback cannot duplicate files or billing.
  const settings = db.provider === 'postgres' ? postgresSettings() : undefined;
  for (let attempt = 0; ; attempt++) {
    let value!: T;
    try {
      return await db.transaction(async () => (value = await action()));
    } catch (failure) {
      let error = failure;
      if (error instanceof CommitUncertainError) {
        let committed: boolean;
        try {
          // The same advisory lock waits for the old transaction to finish before checking proof.
          committed = await db.transaction(proof);
        } catch {
          // Preserve durable files until the DB is reachable; deleting them could corrupt a committed row.
          throw error;
        }
        if (committed) return value;
        error = error.original;
      }
      if (settings && isTransientPostgresError(error) && attempt + 1 < settings.attempts) {
        await delay(Math.min(settings.retryDelay * 2 ** attempt, 60000));
        continue;
      }
      if (failure instanceof CommitUncertainError)
        throw new HttpError(503, '数据库连接中断，上传未保存，请重新上传');
      throw isTransientPostgresError(error) ? new PostgresUnavailableError(error) : error;
    }
  }
}

export async function removeMediaFiles(paths: string[]) {
  const results = await Promise.allSettled(
    [...new Set(paths)].map((path) => rm(path, { force: true })),
  );
  if (results.some((result) => result.status === 'rejected'))
    console.error('Media cleanup failed; uncommitted files are not billed');
}
