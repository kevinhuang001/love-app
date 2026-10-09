import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';
import { readdir, lstat, unlink } from 'node:fs/promises';
import type { DB } from './db.js';

type File = { name: string; bytes: number; ino: number; dev: number; mtime: number };
export type CleanupPlan = {
  uploads: { id: string; kind: string; createdAt: string; bytes: number; names: string[] }[];
  media: { id: string; kind: string; createdAt: string; bytes: number; names: string[] }[];
  files: File[];
  staging: { name: string; bytes: number; updatedAt: string }[];
  skipped: number;
};
const referenceSQL = `SELECT mediaId AS id FROM moments WHERE mediaId IS NOT NULL
 UNION SELECT mediaId AS id FROM message_media
 UNION SELECT avatarMediaId AS id FROM users WHERE avatarMediaId IS NOT NULL
 UNION SELECT avatarMediaId AS id FROM couple_ai_settings WHERE avatarMediaId IS NOT NULL
 UNION SELECT assistantAvatarMediaId AS id FROM messages WHERE assistantAvatarMediaId IS NOT NULL`;
const safeName = (name: string) => {
  if (!name || name !== basename(name) || name === '.' || name === '..')
    throw new Error('数据库媒体路径无效，未删除数据');
  return name;
};
// The manager stops writers before scanning. Persisted references, not the existence of
// a media row, determine reachability. Unpublished uploads are all eligible.
export async function mediaReferences(db: DB, includePending = true) {
  const referenced = new Set((await db.prepare(referenceSQL).all()).map((r) => String(r.id)));
  // Pending tool calls may still consume an uploaded ID; completed AI history is not a media owner.
  const pending = includePending
    ? await db.prepare("SELECT transcript FROM ai_jobs WHERE status IN ('pending','running')").all()
    : [];
  const protect = (value: unknown): void => {
    if (typeof value === 'string') {
      referenced.add(value);
      // Tool arguments and results are JSON encoded inside transcript strings.
      if (/^[\[{]/.test(value)) {
        try {
          protect(JSON.parse(value));
        } catch {
          /* Ordinary text. */
        }
      }
    } else if (Array.isArray(value)) value.forEach(protect);
    else if (value && typeof value === 'object') Object.values(value).forEach(protect);
  };
  for (const row of pending) if (row.transcript) protect(JSON.parse(String(row.transcript)));
  return referenced;
}
export async function inspectMediaCleanup(db: DB, directory: string): Promise<CleanupPlan> {
  const referenced = await mediaReferences(db, false);
  const rows = await db
    .prepare(
      'SELECT m.*,s.totalBytes FROM media m LEFT JOIN media_sizes s ON s.mediaId=m.id ORDER BY m.id',
    )
    .all();
  const plan: CleanupPlan = { media: [], uploads: [], files: [], staging: [], skipped: 0 };
  const retainedNames = new Set<string>();
  for (const row of rows) {
    const names = [
      ...new Set(
        [row.original, row.preview, row.thumbnail].filter(Boolean).map((n) => safeName(String(n))),
      ),
    ];
    if (!referenced.has(String(row.id))) {
      plan.media.push({
        id: String(row.id),
        kind: String(row.kind),
        createdAt: String(row.createdAt),
        bytes: Number(row.totalBytes || 0),
        names,
      });
    } else {
      names.forEach((n) => retainedNames.add(n));
    }
  }
  for (const row of await db.prepare('SELECT * FROM media_uploads ORDER BY id').all()) {
    const draft = JSON.parse(String(row.metadata));
    plan.uploads.push({
      id: String(row.id),
      kind: String(draft.kind),
      createdAt: String(row.createdAt),
      bytes: Number(draft.totalBytes),
      names: [
        ...new Set(
          [draft.original, draft.preview, draft.thumbnail]
            .filter(Boolean)
            .map((n) => safeName(String(n))),
        ),
      ] as string[],
    });
  }
  if (db.provider === 'postgres') {
    for (const row of await db
      .prepare('SELECT name,bytes,updatedAt FROM media_files WHERE mediaId IS NULL ORDER BY name')
      .all()) {
      const name = safeName(String(row.name));
      if (!retainedNames.has(name))
        plan.staging.push({ name, bytes: Number(row.bytes), updatedAt: String(row.updatedAt) });
    }
  }
  // Include loose files and variants of reviewed orphan records. Never follow links.
  const scan = async (relative = '') => {
    for (const entry of await readdir(join(directory, relative), { withFileTypes: true })) {
      const name = relative ? relative + '/' + entry.name : entry.name;
      if (!relative && retainedNames.has(name)) continue;
      if (entry.isFile()) {
        const info = await lstat(join(directory, name));
        if (info.isFile())
          plan.files.push({
            name,
            bytes: info.size,
            ino: info.ino,
            dev: info.dev,
            mtime: info.mtimeMs,
          });
      } else if (entry.isDirectory() && (name === 'tmp' || relative.startsWith('tmp/')))
        await scan(name);
      else plan.skipped++;
    }
  };
  await scan();
  plan.files.sort((a, b) => a.name.localeCompare(b.name));

  return plan;
}
export function cleanupFingerprint(plan: CleanupPlan) {
  return createHash('sha256').update(JSON.stringify(plan)).digest('hex');
}
export async function applyMediaCleanup(
  db: DB,
  directory: string,
  plan: CleanupPlan,
  reviewed: string,
) {
  if (cleanupFingerprint(plan) !== reviewed)
    throw new Error('清理清单发生变化，请重新预览并确认；未删除数据');
  // Recheck inside the database transaction. PostgreSQL serializes application transactions
  // with the same advisory lock; foreign keys provide an additional guard.
  await db.transaction(async () => {
    const current = await inspectMediaCleanup(db, directory);
    if (cleanupFingerprint(current) !== reviewed)
      throw new Error('清理清单发生变化，请重新预览并确认；未删除数据');
    for (const row of plan.uploads)
      await db.prepare('DELETE FROM media_uploads WHERE id=?').run(row.id);
    for (const row of plan.media) {
      await db.prepare('DELETE FROM media_sizes WHERE mediaId=?').run(row.id);
      await db.prepare('DELETE FROM media WHERE id=?').run(row.id);
    }
    for (const row of plan.staging)
      await db.prepare('DELETE FROM media_files WHERE name=? AND mediaId IS NULL').run(row.name);
  });
  // Delete disk bytes only after a confirmed commit. If commit status is uncertain, retain
  // files. A subsequent scan safely finishes loose-file cleanup without risking valid media.
  for (const file of plan.files) {
    const path = join(directory, file.name),
      info = await lstat(path);
    if (
      !info.isFile() ||
      info.ino !== file.ino ||
      info.dev !== file.dev ||
      info.size !== file.bytes ||
      info.mtimeMs !== file.mtime
    )
      throw new Error('待清理文件发生变化，已停止删除文件');
    await unlink(path);
  }
  return {
    media: plan.media.length,
    uploads: plan.uploads.length,
    files: plan.files.length,
    staging: plan.staging.length,
  };
}
