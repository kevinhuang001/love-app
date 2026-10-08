// Exercise the real shell menu and actual SQLite / PostgreSQL backup restoration.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtemp,
  copyFile,
  writeFile,
  readdir,
  readFile,
  rm,
  mkdir,
  chmod,
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { quoteEnv } from './setup.mjs';
const realDocker = execFileSync('which', ['docker'], { encoding: 'utf8' }).trim();
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
  await mkdir(join(dir, 'deploy'));
  await copyFile('deploy/terminal-ui.mjs', join(dir, 'deploy/terminal-ui.mjs'));
  await mkdir(join(dir, 'bin'));
  // Only prompt responses are injected. All actual Compose / image / volume commands run Docker.
  await writeFile(
    join(dir, 'bin/docker'),
    `#!/usr/bin/env node
const fs=require('node:fs'),cp=require('node:child_process'),a=process.argv.slice(2),i=a.indexOf('/setup/deploy/terminal-ui.mjs');
if(i>=0){const answers=fs.readFileSync(process.env.MANAGER_ANSWERS,'utf8').split('\\n');fs.writeFileSync(a[i+2].replace('/setup/',process.cwd()+'/'),answers.shift());fs.writeFileSync(process.env.MANAGER_ANSWERS,answers.join('\\n'));}
else {const r=cp.spawnSync(process.env.MANAGER_DOCKER,a,{stdio:'inherit'});process.exit(r.status??1);}
`,
  );
  await chmod(join(dir, 'bin/docker'), 0o755);
  const menu = (input) => {
    const actions = { 2: 'start', 8: 'backup', 9: 'restore', 0: 'exit' };
    const values = input
      .trimEnd()
      .split('\n')
      .map((value) => actions[value] || value);
    execFileSync('node', [
      '-e',
      'require("node:fs").writeFileSync(process.argv[1],process.argv[2])',
      join(dir, 'answers'),
      values.join('\n'),
    ]);
    return execFileSync('sh', ['love'], {
      cwd: dir,
      env: {
        ...process.env,
        PATH: join(dir, 'bin') + ':' + process.env.PATH,
        MANAGER_DOCKER: realDocker,
        MANAGER_ANSWERS: join(dir, 'answers'),
      },
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  };
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
