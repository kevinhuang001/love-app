import { lstat } from 'node:fs/promises';
import { openDatabase } from './db.js';
import { checkDatabase } from './database-check.js';
let db;
try {
  const postgres =
    process.env.DATABASE_PROVIDER === 'postgres' ||
    /^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL || '');
  const path = postgres
    ? process.env.DATABASE_URL!
    : process.env.DATABASE_PATH || '/app/data/love.sqlite';
  if (!path) throw new Error('未配置数据库');
  if (!postgres && !(await lstat(path)).isFile()) throw new Error('SQLite 数据库未初始化');
  db = await openDatabase({ path, provider: postgres ? 'postgres' : 'sqlite' });
  const report = await db.transaction(
    () =>
      checkDatabase(
        db!,
        process.env.UPLOADS_PATH || '/app/data/media',
        process.argv.includes('--deep'),
        console.log,
      ),
    { snapshot: true },
  );
  if (report.issues.length) process.exitCode = 1;
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await db?.close();
}
