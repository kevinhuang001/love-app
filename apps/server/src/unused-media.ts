import { DatabaseSync } from 'node:sqlite';
import { readdir, lstat, unlink } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { SCHEMA_VERSION, sqliteSchemaVersion } from './migrations.js';
import { withSQLiteSnapshot } from './sqlite-snapshot.js';

type Candidate = { name: string; bytes: number; ino: number; dev: number; mtime: number };
export async function cleanUnusedSQLiteMedia(sourcePath: string, directory: string, apply = false) {
  return withSQLiteSnapshot(sourcePath, async (snapshot) => {
    const db = new DatabaseSync(snapshot, { readOnly: true });
    const referenced = new Set<string>();
    try {
      if (
        sqliteSchemaVersion(db) !== SCHEMA_VERSION ||
        db.prepare('PRAGMA integrity_check').get()!.integrity_check !== 'ok' ||
        db.prepare('PRAGMA foreign_key_check').all().length
      )
        throw new Error('SQLite 版本、完整性或关联检查未通过，未删除文件');
      for (const row of db.prepare('SELECT original,preview,thumbnail FROM media').iterate()) {
        for (const name of [row.original, row.preview, row.thumbnail].filter(Boolean).map(String)) {
          if (name !== basename(name) || name === '.' || name === '..')
            throw new Error('数据库媒体路径无效，未删除文件');
          referenced.add(name);
        }
      }
    } finally {
      db.close();
    }
    const candidates: Candidate[] = [];
    let skipped = 0;
    const scan = async (relative = '') => {
      for (const entry of await readdir(join(directory, relative), { withFileTypes: true })) {
        const name = relative ? relative + '/' + entry.name : entry.name;
        if (!relative && referenced.has(name)) continue;
        if (entry.isFile()) {
          const info = await lstat(join(directory, name));
          if (info.isFile())
            candidates.push({
              name,
              bytes: info.size,
              ino: info.ino,
              dev: info.dev,
              mtime: info.mtimeMs,
            });
        } else if (entry.isDirectory() && (name === 'tmp' || relative.startsWith('tmp')))
          await scan(name);
        else skipped++;
      }
    };
    await scan();
    let bytes = 0,
      files = 0;
    for (const candidate of candidates) {
      if (apply) {
        const path = join(directory, candidate.name),
          info = await lstat(path);
        if (
          !info.isFile() ||
          info.ino !== candidate.ino ||
          info.dev !== candidate.dev ||
          info.size !== candidate.bytes ||
          info.mtimeMs !== candidate.mtime
        )
          throw new Error('待清理文件发生变化，已停止清理');
        await unlink(path);
      }
      bytes += candidate.bytes;
      files++;
    }
    return { files, bytes, skipped, applied: apply };
  });
}
