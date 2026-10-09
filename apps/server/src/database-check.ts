import { createHash } from 'node:crypto';
import { lstat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { DB } from './db.js';
import { MediaRepository, MEDIA_CHUNK_BYTES } from './media-repository.js';
import { inspectMediaCleanup } from './media-cleanup.js';
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
export async function checkDatabase(
  db: DB,
  directory: string,
  deep = false,
  log: (message: string) => void = () => {},
) {
  const issues: string[] = [];
  const issue = (text: string) => {
    issues.push(text);
    log('异常：' + text);
  };
  if (db.provider === 'sqlite') {
    for (const row of await db.prepare('PRAGMA integrity_check').all())
      if (row.integrity_check !== 'ok') issue('SQLite 完整性：' + String(row.integrity_check));
    for (const row of await db.prepare('PRAGMA foreign_key_check').all())
      issue('外键关联损坏：' + String(row.table) + ' / ' + String(row.rowid));
  } else {
    const constraints = await db
      .prepare(
        `SELECT cn.nspname AS childSchema,c.relname AS childTable,pn.nspname AS parentSchema,p.relname AS parentTable,
      json_agg(a.attname ORDER BY i.n) AS childColumns,json_agg(b.attname ORDER BY i.n) AS parentColumns
      FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid JOIN pg_namespace cn ON cn.oid=c.relnamespace
      JOIN pg_class p ON p.oid=co.confrelid JOIN pg_namespace pn ON pn.oid=p.relnamespace
      CROSS JOIN LATERAL generate_subscripts(co.conkey,1) i(n)
      JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=co.conkey[i.n]
      JOIN pg_attribute b ON b.attrelid=p.oid AND b.attnum=co.confkey[i.n]
      WHERE co.contype='f' AND cn.nspname=current_schema()
      GROUP BY co.oid,cn.nspname,c.relname,pn.nspname,p.relname`,
      )
      .all();
    for (const row of constraints) {
      const child = row.childColumns as unknown as string[],
        parent = row.parentColumns as unknown as string[];
      const sql = `SELECT COUNT(*) n FROM ${quote(String(row.childSchema))}.${quote(String(row.childTable))} c WHERE ${child.map((col) => 'c.' + quote(col) + ' IS NOT NULL').join(' AND ')} AND NOT EXISTS(SELECT 1 FROM ${quote(String(row.parentSchema))}.${quote(String(row.parentTable))} p WHERE ${child.map((col, i) => 'c.' + quote(col) + '=p.' + quote(parent[i])).join(' AND ')})`;
      if (Number((await db.prepare(sql).get())!.n))
        issue('外键关联损坏：' + String(row.childTable));
    }
  }
  const repository = new MediaRepository(db, directory);
  const stored = new Map<
    string,
    {
      bytes: number;
      sha256?: string;
      complete: number;
      chunks: number;
      actual: number;
      first: number;
      last: number;
    }
  >();
  if (db.provider === 'postgres')
    for (const row of await db
      .prepare(
        `SELECT f.name,f.bytes,f.sha256,f.complete,COUNT(c.position) AS chunks,COALESCE(SUM(octet_length(c.data)),0) AS actual,COALESCE(MIN(c.position),-1) AS first,COALESCE(MAX(c.position),-1) AS last FROM media_files f LEFT JOIN media_chunks c ON c.name=f.name WHERE f.mediaId IS NOT NULL GROUP BY f.name ORDER BY f.name`,
      )
      .all())
      stored.set(String(row.name), {
        bytes: Number(row.bytes),
        sha256: String(row.sha256),
        complete: Number(row.complete),
        chunks: Number(row.chunks),
        actual: Number(row.actual),
        first: Number(row.first),
        last: Number(row.last),
      });
  const media = await db
    .prepare(
      'SELECT m.*,s.originalBytes,s.previewBytes,s.thumbnailBytes,s.totalBytes FROM media m LEFT JOIN media_sizes s ON s.mediaId=m.id ORDER BY m.id',
    )
    .all();
  let files = 0,
    checksums = 0;
  const checked = new Map<string, number>();
  for (const row of media) {
    const names = [row.original, row.preview, row.thumbnail].map(String),
      sizes = [row.originalBytes, row.previewBytes, row.thumbnailBytes];
    let actual = 0;
    for (const name of new Set(names.filter(Boolean))) {
      if (!name || name !== basename(name) || name === '.' || name === '..') {
        issue('媒体路径无效：' + String(row.id));
        continue;
      }
      try {
        let bytes = checked.get(name);
        if (bytes === undefined) {
          if (db.provider === 'sqlite') {
            const info = await lstat(join(directory, name));
            if (!info.isFile() || info.size <= 0) throw new Error('不是有效的普通文件');
            bytes = info.size;
          } else {
            const info = stored.get(name);
            if (
              !info ||
              info.complete !== 1 ||
              info.bytes <= 0 ||
              info.actual !== info.bytes ||
              info.first !== 0 ||
              info.chunks !== Math.ceil(info.bytes / MEDIA_CHUNK_BYTES) ||
              info.last !== info.chunks - 1
            )
              throw new Error('数据库文件或分块不完整');
            bytes = info.bytes;
          }
          if (deep) {
            log(`读取媒体 ${files + 1}：${name}（${(bytes / 1048576).toFixed(1)} MiB）`);
            const hash = createHash('sha256');
            let read = 0;
            for await (const chunk of repository.stream(name)) {
              hash.update(chunk);
              read += chunk.length;
            }
            if (read !== bytes) throw new Error('媒体读取长度不一致');
            const digest = hash.digest('hex'),
              expected = stored.get(name)?.sha256;
            if (expected) {
              checksums++;
              if (digest !== expected) throw new Error('SHA-256 校验失败');
            }
          }
          checked.set(name, bytes);
          files++;
        }
        actual += bytes;
        for (const [index, variant] of names.entries())
          if (variant === name && Number(sizes[index]) > 0 && Number(sizes[index]) !== bytes)
            issue('媒体容量记录不一致：' + String(row.id) + ' / ' + name);
      } catch (error) {
        issue(String(row.id) + ' / ' + name + '：' + (error as Error).message);
      }
    }
    if (
      row.totalBytes === null ||
      Number(row.totalBytes) !== actual ||
      sizes.reduce<number>((n, v) => n + Number(v), 0) !== Number(row.totalBytes)
    )
      issue('媒体总容量不一致：' + String(row.id));
  }
  const unused = await inspectMediaCleanup(db, directory);
  const counts: Record<string, number> = {};
  for (const table of ['users', 'couples', 'messages', 'moments', 'media'])
    counts[table] = Number((await db.prepare(`SELECT COUNT(*) n FROM ${table}`).get())!.n);
  log(
    `${db.provider}：${counts.users} 个用户、${counts.couples} 对配对、${counts.messages} 条消息、${counts.moments} 条回忆、${counts.media} 条正式媒体、${files} 个文件。`,
  );
  log(
    `可清理：${unused.media.length} 条未使用媒体、${unused.uploads.length} 条未发布上传、${unused.files.length} 个磁盘文件、${unused.staging.length} 个数据库暂存文件。`,
  );
  if (deep)
    log(
      `已完整读取 ${files} 个文件，核对 ${checksums} 份已存 SHA-256；没有历史校验值的文件仅验证可读性和长度。`,
    );
  log(
    issues.length
      ? `发现 ${issues.length} 处一致性问题；未修改数据。`
      : '一致性检查通过；未修改数据。',
  );
  return { issues, files, checksums, counts, unused };
}
