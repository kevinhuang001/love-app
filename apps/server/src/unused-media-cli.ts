import { mkdir } from 'node:fs/promises';
import { openDatabase } from './db.js';
import { inspectMediaCleanup, cleanupFingerprint, applyMediaCleanup } from './media-cleanup.js';
const args = process.argv.slice(2);
const argument = (name: string) => args[args.indexOf(name) + 1];
let db;
try {
  const postgres =
    process.env.DATABASE_PROVIDER === 'postgres' ||
    /^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL || '');
  const path = postgres
    ? process.env.DATABASE_URL!
    : process.env.DATABASE_PATH || '/app/data/love.sqlite';
  if (!path) throw new Error('未配置数据库');
  const directory = process.env.UPLOADS_PATH || '/app/data/media';
  await mkdir(directory, { recursive: true });
  db = await openDatabase({ path, provider: postgres ? 'postgres' : 'sqlite' });
  const plan = await inspectMediaCleanup(db, directory);
  if (args.includes('--apply')) {
    if (!args.includes('--review')) throw new Error('必须先预览并确认清理清单');
    const result = await applyMediaCleanup(db, directory, plan, argument('--review'));
    console.error(
      `已清理 ${result.media} 条未使用媒体记录、${plan.uploads.length} 条未发布草稿、${result.files} 个磁盘文件、${result.staging} 个未完成数据库文件；对应容量已释放。`,
    );
    if (postgres)
      console.error('PostgreSQL 删除的空间可由数据库复用，数据库文件体积不会立即缩小。');
  } else {
    const disk = plan.files.reduce((n, r) => n + r.bytes, 0);
    const databaseBytes =
      plan.media.reduce((n, r) => n + r.bytes, 0) + plan.staging.reduce((n, r) => n + r.bytes, 0);
    console.error(
      `可清理：${plan.media.length} 条未使用媒体，${plan.uploads.length} 条未发布草稿，${plan.files.length} 个磁盘文件，${plan.staging.length} 个未完成数据库文件。`,
    );
    console.error(
      `磁盘文件 ${(disk / 1048576).toFixed(1)} MiB；未使用媒体及数据库暂存 ${(databaseBytes / 1048576).toFixed(1)} MiB（磁盘与记录容量可能重复，不能相加）。`,
    );
    for (const row of [...plan.media, ...plan.uploads])
      console.error(
        `  ${row.id} · ${row.kind} · ${row.createdAt} · ${(row.bytes / 1048576).toFixed(1)} MiB · ${row.names.join(', ')}`,
      );
    console.error(
      `保护所有回忆、聊天附件、双方及 AI 头像；所有未发布上传均纳入清理。跳过 ${plan.skipped} 个目录或链接。既有备份不会修改。`,
    );
    console.log(cleanupFingerprint(plan));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : '媒体清理未完成');
  process.exitCode = 1;
} finally {
  await db?.close();
}
