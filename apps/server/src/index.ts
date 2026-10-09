import { resolve } from 'node:path';
import { recoverSQLiteRestore } from './database-backup.js';
import { createApp } from './app.js';
const production = process.env.NODE_ENV === 'production';
if (
  production &&
  (!process.env.MEDIA_SIGNING_SECRET || process.env.MEDIA_SIGNING_SECRET.length < 32)
)
  throw new Error('生产环境必须配置至少 32 字符的 MEDIA_SIGNING_SECRET');
if (
  process.env.DATABASE_PROVIDER &&
  !['sqlite', 'postgres'].includes(process.env.DATABASE_PROVIDER)
)
  throw new Error('DATABASE_PROVIDER 必须为 sqlite 或 postgres');
if (production && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD))
  throw new Error('生产环境必须配置 ADMIN_USERNAME 与 ADMIN_PASSWORD');
if (
  process.env.DATABASE_PROVIDER !== 'postgres' &&
  !/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL || '')
)
  await recoverSQLiteRestore(process.env.DATABASE_PATH || '../../data/love.sqlite');
const server = await createApp({
  database: process.env.DATABASE_URL || process.env.DATABASE_PATH || '../../data/love.sqlite',
  databaseProvider: (process.env.DATABASE_PROVIDER || undefined) as
    'sqlite' | 'postgres' | undefined,
  uploads: process.env.UPLOADS_PATH || '../../data/media',
  mediaSecret: process.env.MEDIA_SIGNING_SECRET,
  origins: process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()),
  production,
  adminCredentials:
    process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD
      ? { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }
      : undefined,
  staticDir: production ? resolve('../client/dist') : undefined,
});
await server.control.bootstrap;
const port = Number(process.env.PORT || 3000);
server.http.listen(port, '0.0.0.0', () => console.log(`Love API listening on :${port}`));
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, async () => {
    await server.close();
    process.exit(0);
  });
