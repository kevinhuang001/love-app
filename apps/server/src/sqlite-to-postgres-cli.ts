import { writeFile } from 'node:fs/promises';
import { openDatabase } from './db.js';
import { migrateSQLiteToPostgres } from './sqlite-to-postgres.js';
import { withSQLiteSnapshot } from './sqlite-snapshot.js';

const argument = (name: string) => process.argv[process.argv.indexOf(name) + 1];
let db;
try {
  const sourcePath = argument('--source'),
    mediaDirectory = argument('--media'),
    reportPath = argument('--report');
  if (
    !process.argv.includes('--source') ||
    !process.argv.includes('--media') ||
    !process.argv.includes('--report') ||
    !sourcePath ||
    !mediaDirectory ||
    !reportPath
  )
    throw new Error('缺少迁移路径');
  db = await openDatabase({ path: process.env.DATABASE_URL || '', provider: 'postgres' });
  const target = db;
  const report = await withSQLiteSnapshot(sourcePath, (snapshot) =>
    migrateSQLiteToPostgres({
      sourcePath: snapshot,
      mediaDirectory,
      target,
      progress: console.log,
    }),
  );
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  console.log(
    `核对通过：${report.tables.users} 个用户，${report.tables.couples} 对配对，${report.mediaFiles} 个媒体文件，${(report.mediaBytes / 1048576).toFixed(1)} MiB。`,
  );
} catch (error) {
  // Driver messages can contain connection URLs. Keep credentials out of terminal logs.
  const message =
    error instanceof Error && !/postgres(?:ql)?:\/\//i.test(error.message)
      ? error.message
      : '数据库连接或迁移失败';
  console.error(message);
  process.exitCode = 1;
} finally {
  await db?.close();
}
