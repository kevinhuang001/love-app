import type { DB } from './db.js';
import { fail } from './errors.js';
import { syncMediaFiles } from './media-storage.js';
const directories = new WeakMap<DB, string>();
export const registerMediaDirectory = (db: DB, directory: string) => directories.set(db, directory);
export type MediaDraft = {
  id: string;
  kind: string;
  original: string;
  preview: string;
  thumbnail: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  sizes: number[];
  totalBytes: number;
  retainOriginal: boolean;
};
// Must run within the SAME transaction as the message, memory, or avatar update.
export async function publishMediaDraft(
  db: DB,
  id: string,
  ownerId: string,
  coupleId: string | null,
  allowPairExisting = false,
) {
  const existing = await db
    .prepare(
      'SELECT id FROM media WHERE id=? AND (ownerId=? OR ?=1) AND (coupleId=? OR coupleId IS NULL)',
    )
    .get(id, ownerId, allowPairExisting ? 1 : 0, coupleId);
  if (existing) return;
  const row = await db
    .prepare('SELECT * FROM media_uploads WHERE id=? AND ownerId=? AND coupleId=?')
    .get(id, ownerId, coupleId);
  if (!row || !coupleId) fail(403, '上传草稿不存在或已清理，请重新上传');
  const draft = JSON.parse(String(row!.metadata)) as MediaDraft;
  const current = await db.prepare('SELECT coupleId,disabled FROM users WHERE id=?').get(ownerId);
  if (!current || current.disabled || current.coupleId !== coupleId)
    fail(409, '账号或配对状态已改变');
  const retention = await db
    .prepare('SELECT retainOriginal FROM couple_media_settings WHERE coupleId=?')
    .get(coupleId);
  if ((retention ? Boolean(retention.retainOriginal) : true) !== draft.retainOriginal)
    fail(409, '媒体保存设置已改变，请重新上传');
  const names = [draft.original, draft.preview, draft.thumbnail];
  if (db.provider === 'sqlite') {
    const directory = directories.get(db) || fail(500, '未初始化媒体存储');
    const sizes = await syncMediaFiles(directory, names);
    if (JSON.stringify(sizes) !== JSON.stringify(draft.sizes))
      fail(422, '上传草稿文件不完整，未发布');
  } else {
    for (const [i, name] of names.entries())
      if (name && names.indexOf(name) === i) {
        const file = await db
          .prepare('SELECT bytes,complete,mediaId FROM media_files WHERE name=?')
          .get(name);
        if (
          !file ||
          file.mediaId ||
          Number(file.complete) !== 1 ||
          Number(file.bytes) !== draft.sizes[i]
        )
          fail(422, '上传草稿未完整写入数据库，未发布');
      }
  }
  const limit =
    Number(
      (await db.prepare('SELECT quotaMiB FROM couple_limits WHERE coupleId=?').get(coupleId))
        ?.quotaMiB || 0,
    ) * 1048576;
  const used = Number(
    (await db
      .prepare(
        'SELECT COALESCE(SUM(s.totalBytes),0) n FROM media m JOIN media_sizes s ON s.mediaId=m.id WHERE m.coupleId=?',
      )
      .get(coupleId))!.n,
  );
  if (used + draft.totalBytes > limit) fail(413, '两人空间存储已达到配额，请联系管理员');
  await db
    .prepare('INSERT INTO media VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(
      id,
      coupleId,
      ownerId,
      draft.kind,
      draft.original,
      draft.preview,
      draft.thumbnail,
      draft.width,
      draft.height,
      draft.duration,
      row!.createdAt,
    );
  await db
    .prepare('INSERT INTO media_sizes VALUES(?,?,?,?,?)')
    .run(id, ...draft.sizes, draft.totalBytes);
  if (db.provider === 'postgres')
    for (const name of new Set(names.filter(Boolean))) {
      const bound = await db
        .prepare('UPDATE media_files SET mediaId=? WHERE name=? AND complete=1 AND mediaId IS NULL')
        .run(id, name);
      if (bound.changes !== 1) fail(503, '媒体暂存绑定失败，未发布');
    }
  await db.prepare('DELETE FROM media_uploads WHERE id=?').run(id);
}
