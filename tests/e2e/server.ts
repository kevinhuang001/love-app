// Test-only mail delivery and captcha observation. Production never loads this entry point.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '../../apps/server/src/app.js';
const temp = resolve('../admin-temp');
mkdirSync(temp, { recursive: true });
const evidence: {
  captcha: Record<string, string>;
  mail: { to: string; subject: string; text: string }[];
} = { captcha: {}, mail: [] };
const save = () => writeFileSync(resolve(temp, 'e2e-auth.json'), JSON.stringify(evidence));
save();
const server = await createApp({
  staticDir: resolve('apps/client/dist'),
  database: process.env.DATABASE_PATH || 'data/e2e-admin.sqlite',
  uploads: process.env.UPLOADS_PATH || 'data/e2e-admin-media',
  mediaSecret: 'test-key-for-ci-not-for-production-use',
  adminCredentials: { username: 'admin_master', password: 'admin-test-password-123' },
  origins: [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'https://localhost',
    'http://public-http.test:3000',
  ],
  onCaptcha: (id, answer) => {
    evidence.captcha[id] = answer;
    save();
  },
  mailSender: async (_config, message) => {
    evidence.mail.push(message);
    save();
  },
});
await server.control.bootstrap;
// Bootstrap creates production defaults (closed registration). Set the mail fixture
// explicitly so a fresh database exercises the email registration flow.
await server.db.prepare("UPDATE server_config SET value=? WHERE key='control'").run(
  JSON.stringify({
    ...(await server.control.readSettings()),
    registration: 'email',
    smtp: {
      host: 'smtp.example.test',
      port: 587,
      security: 'starttls',
      user: '',
      from: 'noreply@example.test',
      senderName: 'Love',
    },
  }),
);
server.http.listen(3000, '127.0.0.1');
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, async () => {
    await server.close();
    process.exit(0);
  });
