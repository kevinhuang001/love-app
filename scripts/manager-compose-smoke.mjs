// Exercise the real shell menu and actual SQLite / PostgreSQL backup restoration.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, copyFile, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { quoteEnv } from './setup.mjs';
for (const database of ['sqlite', 'postgres']) {
  const dir = await mkdtemp(join(tmpdir(), 'love-manager-real-')),
    project = 'love-manager-' + database + '-ci';
  for (const file of ['love', 'compose.yml', 'compose.postgres.yml', 'Caddyfile'])
    await copyFile(file, join(dir, file));
  const config = {
    COMPOSE_PROJECT_NAME: project,
    LOVE_DATABASE: database,
    LOVE_HTTPS: '0',
    LOVE_TLS_PROVIDER: 'none',
    LOVE_IMAGE: 'love-ci',
    LOVE_IMAGE_SOURCE: 'registry',
    LOVE_PORT: '3002',
    LOVE_BIND_IP: '127.0.0.1',
    MEDIA_SIGNING_SECRET: 'ci-manager-compose-only-secret-at-least-32',
    ADMIN_USERNAME: 'ci_admin',
    ADMIN_PASSWORD: 'ci-manager-admin-password-123',
    POSTGRES_PASSWORD: `manager'pa"ss$word#\\literal`,
    POSTGRES_USER: 'love',
    POSTGRES_DB: 'love',
    DATABASE_PROVIDER: database === 'postgres' ? 'postgres' : 'sqlite',
  };
  await writeFile(
    join(dir, '.env'),
    Object.entries(config)
      .map(([k, v]) => k + '=' + quoteEnv(v))
      .join('\n') + '\n',
    { mode: 0o600 },
  );
  const menu = (input) =>
    execFileSync('sh', ['love'], {
      cwd: dir,
      input,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  const composeArgs = [
    'compose',
    '--project-name',
    project,
    '--env-file',
    join(dir, '.env'),
    '-f',
    join(dir, 'compose.yml'),
    ...(database === 'postgres' ? ['-f', join(dir, 'compose.postgres.yml')] : []),
  ];
  const compose = (...args) =>
    execFileSync('docker', [...composeArgs, ...args], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  const query = (code) =>
    compose(
      'exec',
      '-T',
      'love',
      'node',
      '--input-type=module',
      '-e',
      `import {openDatabase} from '/app/apps/server/dist/db.js';import fs from 'node:fs/promises';const db=await openDatabase({path:process.env.DATABASE_URL||process.env.DATABASE_PATH,provider:process.env.DATABASE_PROVIDER});try{${code}}finally{await db.close()}`,
    );
  try {
    menu('2\n0\n');
    query(
      `await db.prepare("INSERT INTO server_config(key,value) VALUES('backup-proof','before')").run();`,
    );
    menu('8\n0\n');
    const names = await readdir(join(dir, 'backups'));
    assert.equal(names.length, 1);
    const name = names[0];
    assert.ok(
      (await readFile(join(dir, 'backups', name, 'SHA256SUMS'), 'utf8')).includes('data.tar.gz'),
    );
    if (database === 'postgres')
      assert.ok(
        (await readFile(join(dir, 'backups', name, 'database.dump')))
          .subarray(0, 5)
          .equals(Buffer.from('PGDMP')),
      );
    query(
      `await db.prepare("UPDATE server_config SET value='after' WHERE key='backup-proof'").run();await fs.writeFile('/app/data/after-backup-marker','after');`,
    );
    menu('9\n' + name + '\nRESTORE\n0\n');
    const proof = JSON.parse(
      query(
        `console.log(JSON.stringify({value:(await db.prepare("SELECT value FROM server_config WHERE key='backup-proof'").get()).value,marker:await fs.stat('/app/data/after-backup-marker').then(()=>true,()=>false)}));`,
      ).trim(),
    );
    assert.deepEqual(proof, { value: 'before', marker: false });
    assert.equal(
      (await readdir(join(dir, 'backups'))).length,
      2,
      'restore saves the state it replaces',
    );
    console.log(
      `Interactive manager ${database}: start, consistent backup, checksums, database/media restore and safety backup verified.`,
    );
  } finally {
    compose('--profile', 'https', 'down', '--volumes', '--remove-orphans');
    await rm(dir, { recursive: true, force: true });
  }
}
