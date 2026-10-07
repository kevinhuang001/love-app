import { resolve } from 'node:path';
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
const server = await createApp({
  database: process.env.DATABASE_URL || process.env.DATABASE_PATH || '../../data/love.sqlite',
  databaseProvider: (process.env.DATABASE_PROVIDER || undefined) as
    'sqlite' | 'postgres' | undefined,
  uploads: process.env.UPLOADS_PATH || '../../data/media',
  mediaSecret: process.env.MEDIA_SIGNING_SECRET,
  origins: process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()),
  production,
  initialSettings: {
    defaultQuotaMiB: Number(process.env.INITIAL_QUOTA_MIB || 1024),
    registration: (process.env.INITIAL_REGISTRATION || 'closed') as
      'closed' | 'email' | 'whitelist',
    smtp: {
      host: process.env.INITIAL_SMTP_HOST || '',
      port: Number(process.env.INITIAL_SMTP_PORT || 587),
      security: (process.env.INITIAL_SMTP_SECURITY || 'starttls') as 'plain' | 'tls' | 'starttls',
      user: process.env.INITIAL_SMTP_USER || '',
      password: process.env.INITIAL_SMTP_PASSWORD || '',
      from: process.env.INITIAL_SMTP_FROM || '',
      senderName: 'Love',
    },
  },
  adminBootstrap:
    process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD
      ? { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }
      : undefined,
  staticDir: production ? resolve('../client/dist') : undefined,
});
await server.control.bootstrap;
const port = Number(process.env.PORT || 3000);
server.http.listen(
  port,
  '0.0.0.0',
  async () => await console.log(`Love API listening on :${port}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, async () => {
    await server.close();
    process.exit(0);
  });
