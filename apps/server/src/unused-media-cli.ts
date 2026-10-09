import { cleanUnusedSQLiteMedia } from './unused-media.js';
try {
  const report = await cleanUnusedSQLiteMedia(
    process.env.DATABASE_PATH || '/app/data/love.sqlite',
    process.env.UPLOADS_PATH || '/app/data/media',
    process.argv.includes('--apply'),
  );
  console.log(
    `${report.applied ? '已清理' : '可清理'} ${report.files} 个未引用/临时文件，${(report.bytes / 1048576).toFixed(1)} MiB；跳过 ${report.skipped} 个目录或链接。`,
  );
} catch {
  console.error(
    '媒体清理未完成，请查看源 SQLite 的版本、完整性、路径或文件权限；数据库引用的媒体不会删除。',
  );
  process.exitCode = 1;
}
