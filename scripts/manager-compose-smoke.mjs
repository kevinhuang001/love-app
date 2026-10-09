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
execFileSync('docker', ['tag', 'love-ci', 'ghcr.io/kevinhuang001/love-app:ci']);
const realDocker = execFileSync('which', ['docker'], { encoding: 'utf8' }).trim();
// Bootstrap with the user's single downloaded file. Use the tested image under the official tag.
execFileSync('docker', ['tag', 'love-ci', 'ghcr.io/kevinhuang001/love-app:latest']);
const bootstrap = await mkdtemp(join(tmpdir(), 'love-bootstrap-real-'));
try {
  await copyFile('love', join(bootstrap, 'love'));
  await mkdir(join(bootstrap, 'bin'));
  await writeFile(
    join(bootstrap, 'bin/docker'),
    `#!/usr/bin/env node
const fs=require('node:fs'),cp=require('node:child_process'),a=process.argv.slice(2),i=a.indexOf('/setup/deploy/terminal-ui.mjs');
if(i>=0)fs.writeFileSync(a[i+2].replace('/setup/',process.cwd()+'/'),'exit');
else {const r=cp.spawnSync(process.env.MANAGER_DOCKER,a,{stdio:'inherit'});process.exit(r.status??1);}
`,
  );
  await chmod(join(bootstrap, 'bin/docker'), 0o755);
  execFileSync('sh', ['love'], {
    cwd: bootstrap,
    env: {
      ...process.env,
      PATH: join(bootstrap, 'bin') + ':' + process.env.PATH,
      MANAGER_DOCKER: realDocker,
    },
    stdio: 'inherit',
  });
  for (const file of [
    'love',
    'compose.yml',
    'compose.postgres.yml',
    'compose.https.yml',
    'compose.certbot.yml',
    'compose.storage.yml',
    'Caddyfile',
    'deploy/terminal-ui.mjs',
  ])
    assert.equal(await readFile(join(bootstrap, file), 'utf8'), await readFile(file, 'utf8'));
  assert.ok(!(await readdir(bootstrap)).includes('.env'));
  console.log(
    'Single-file manager bootstrap extracted verified deployment tools from the tested GHCR image.',
  );
} finally {
  await rm(bootstrap, { recursive: true, force: true });
}
for (const database of ['sqlite', 'postgres']) {
  const dir = await mkdtemp(join(tmpdir(), 'love-manager-real-')),
    project = 'love-manager-' + database + '-ci';
  for (const file of [
    'love',
    'compose.yml',
    'compose.postgres.yml',
    'compose.https.yml',
    'compose.certbot.yml',
    'compose.storage.yml',
    'Caddyfile',
  ])
    await copyFile(file, join(dir, file));
  const config = {
    COMPOSE_PROJECT_NAME: project,
    LOVE_DATABASE: database,
    LOVE_HTTPS: '0',
    LOVE_TLS_PROVIDER: 'none',
    LOVE_IMAGE: 'ghcr.io/kevinhuang001/love-app:ci',
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
if(i>=0){const file=a[i+2].replace('/setup/',process.cwd()+'/');if(a[i+1]==='continue')fs.writeFileSync(file,'continue');else{const answers=fs.readFileSync(process.env.MANAGER_ANSWERS,'utf8').split('\\n');fs.writeFileSync(file,answers.shift());fs.writeFileSync(process.env.MANAGER_ANSWERS,answers.join('\\n'));}}
else if(a.includes('/app/scripts/database-migration.mjs')){const out=a.at(-1).replace('/setup/',process.cwd()+'/');fs.copyFileSync(process.env.MANAGER_TARGET_ENV,out);}
else {const r=cp.spawnSync(process.env.MANAGER_DOCKER,a,{stdio:'inherit'});process.exit(r.status??1);}
`,
  );
  await chmod(join(dir, 'bin/docker'), 0o755);
  const menu = (input) => {
    const actions = {
      2: 'start',
      8: 'backup',
      9: 'restore',
      15: 'migrate',
      16: 'cleanup',
      0: 'exit',
    };
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
        MANAGER_TARGET_ENV: join(dir, 'target.env'),
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
  let maintenanceContainer;
  try {
    menu('2\n0\n');
    const applicationContainer = compose('ps', '--status', 'running', '-q', 'love').trim();
    maintenanceContainer = compose(
      'run',
      '-d',
      '--no-deps',
      '--entrypoint',
      'sh',
      'love',
      '-c',
      'sleep 300',
    ).trim();
    assert.notEqual(maintenanceContainer, applicationContainer);
    const selector = (await readFile('love', 'utf8')).match(
      /^running_app_containers\(\) \{[\s\S]*?^\}/m,
    )[0];
    const selected = execFileSync(
      'sh',
      ['-c', selector + '\nproject=$1; running_app_containers', 'manager-selector', project],
      { encoding: 'utf8' },
    ).trim();
    assert.equal(
      selected,
      applicationContainer,
      'the manager ignores a running Compose one-off task',
    );
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
    if (database === 'sqlite') {
      // Exercise the compiled migration CLI through real Compose, including the read-only
      // source mount and the switch to a separate temporary-media volume.
      query(`await db.prepare("INSERT INTO couples(id) VALUES('migration-pair')").run();
        await db.prepare("INSERT INTO users(id,username,name,password,coupleId,email) VALUES('migration-user','migration_user','用户迁移','fixture-hash','migration-pair','migration@example.test')").run();
        await fs.mkdir('/app/data/media/tmp',{recursive:true});
        await fs.writeFile('/app/data/media/kept.preview.webp','referenced-media-fixture');
        await fs.writeFile('/app/data/media/orphan.mp4','old-unreferenced-file');
        await fs.writeFile('/app/data/media/tmp/interrupted','old-upload-temp');
        await db.prepare("INSERT INTO media(id,coupleId,ownerId,kind,original,preview,thumbnail,createdAt) VALUES('migration-media','migration-pair','migration-user','image','','kept.preview.webp','kept.preview.webp','2026-10-09')").run();
        await db.prepare("INSERT INTO media_sizes VALUES('migration-media',0,24,0,24)").run();`);
      // The selector regression above intentionally created a SQLite one-off container.
      // Remove it before changing providers; Compose exec must inspect the new application.
      execFileSync('docker', ['rm', '-f', maintenanceContainer], { stdio: 'ignore' });
      maintenanceContainer = undefined;
      menu('16\nyes\n0\n');
      const cleaned = JSON.parse(
        query(
          `console.log(JSON.stringify({kept:await fs.readFile('/app/data/media/kept.preview.webp','utf8'),orphan:await fs.stat('/app/data/media/orphan.mp4').then(()=>true,()=>false),temp:await fs.stat('/app/data/media/tmp/interrupted').then(()=>true,()=>false)}));`,
        ).trim(),
      );
      assert.deepEqual(cleaned, { kept: 'referenced-media-fixture', orphan: false, temp: false });
      const target = {
        ...config,
        LOVE_DATABASE: 'postgres',
        DATABASE_PROVIDER: 'postgres',
        LOVE_DATA_VOLUME: 'postgres-work',
      };
      await writeFile(
        join(dir, 'target.env'),
        Object.entries(target)
          .map(([key, value]) => `${key}=${quoteEnv(value)}`)
          .join('\n') + '\n',
        { mode: 0o600 },
      );
      const migrationOutput = menu('15\n0\n');
      assert.match(migrationOutput, /迁移完成并切换到 PostgreSQL/);
      const migratedCompose = (...args) =>
        execFileSync(
          'docker',
          [
            ...composeArgs,
            '-f',
            join(dir, 'compose.postgres.yml'),
            '-f',
            join(dir, 'compose.storage.yml'),
            ...args,
          ],
          {
            encoding: 'utf8',
          },
        );
      try {
        const migratedApplication = execFileSync(
          'sh',
          ['-c', selector + '\nproject=$1; running_app_containers', 'manager-selector', project],
          { encoding: 'utf8' },
        ).trim();
        assert.match(migratedApplication, /^[a-f0-9]{64}$/);
        const proof = JSON.parse(
          execFileSync(
            'docker',
            [
              'exec',
              migratedApplication,
              'node',
              '--input-type=module',
              '-e',
              `import {openDatabase} from '/app/apps/server/dist/db.js';const db=await openDatabase({path:'',provider:'postgres'});try{console.log(JSON.stringify({user:(await db.prepare("SELECT name FROM users WHERE id='migration-user'").get()).name,files:(await db.prepare("SELECT COUNT(*) n FROM media_files WHERE mediaId='migration-media'").get()).n,content:(await db.prepare("SELECT data FROM media_chunks WHERE name='kept.preview.webp' AND position=0").get()).data.toString()}))}finally{await db.close()}`,
            ],
            { encoding: 'utf8' },
          ).trim(),
        );
        assert.deepEqual(proof, {
          user: '用户迁移',
          files: 1,
          content: 'referenced-media-fixture',
        });
        const sourceProof = execFileSync(
          'docker',
          [
            'run',
            '--rm',
            '--user',
            '0',
            '--volume',
            `${project}_love-data:/source:ro`,
            '--entrypoint',
            'node',
            'love-ci',
            '--input-type=module',
            '-e',
            `import fs from 'node:fs/promises';console.log(await fs.readFile('/source/media/kept.preview.webp','utf8'));`,
          ],
          { encoding: 'utf8' },
        ).trim();
        assert.equal(sourceProof, 'referenced-media-fixture');
        console.log(
          'Real SQLite cleanup + PostgreSQL migration, immutable source media, and compiled CLI verified.',
        );
      } finally {
        migratedCompose('--profile', 'https', 'down', '--volumes', '--remove-orphans');
      }
    }
  } finally {
    if (maintenanceContainer) {
      try {
        execFileSync('docker', ['rm', '-f', maintenanceContainer], { stdio: 'ignore' });
      } catch {}
    }
    compose('--profile', 'https', 'down', '--volumes', '--remove-orphans');
    await rm(dir, { recursive: true, force: true });
  }
}
