// Exercise the real shell menu and actual SQLite / PostgreSQL backup restoration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
else {const r=cp.spawnSync(process.env.MANAGER_DOCKER,a,{stdio:'inherit'});process.exit(r.status??1);}
`,
  );
  await chmod(join(dir, 'bin/docker'), 0o755);
  const menu = (input) => {
    const actions = {
      2: 'start',
      8: 'backup',
      9: 'restore',
      16: 'cleanup',
      0: 'exit',
    };
    let inDatabase = false;
    const values = input
      .trimEnd()
      .split('\n')
      .flatMap((value) => {
        if (['8', '9', '16'].includes(value)) {
          const operation = actions[value];
          if (!inDatabase) {
            inDatabase = true;
            return ['database', operation];
          }
          return [operation];
        }
        if (value === '0' && inDatabase) return ['back', 'exit'];
        return [actions[value] || value];
      });
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
    query(
      `await db.prepare("UPDATE server_config SET value='after' WHERE key='backup-proof'").run();await fs.writeFile('/app/data/after-backup-marker','after');`,
    );
    menu('9\n' + name + '\nRESTORE\nbackup\n0\n');
    const proof = JSON.parse(
      query(
        `console.log(JSON.stringify({value:(await db.prepare("SELECT value FROM server_config WHERE key='backup-proof'").get()).value,marker:await fs.stat('/app/data/after-backup-marker').then(()=>true,()=>false)}));`,
      ).trim(),
    );
    assert.deepEqual(proof, { value: 'before', marker: true });
    assert.equal(
      (await readdir(join(dir, 'backups'))).length,
      2,
      'restore saves the state it replaces',
    );
    console.log(
      `Interactive manager ${database}: start, consistent backup, checksums, database/media restore and safety backup verified.`,
    );
    if (database === 'postgres') {
      const legacyDirectory = join(dir, 'backups', 'legacy-postgres');
      await mkdir(legacyDirectory);
      const dump = execFileSync(
        'docker',
        [
          ...composeArgs,
          'exec',
          '-T',
          'postgres',
          'sh',
          '-c',
          'pg_dump --format=custom -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
        ],
        { maxBuffer: 32 * 1024 * 1024 },
      );
      const data = execFileSync(
        'docker',
        [
          'run',
          '--rm',
          '--user',
          '0',
          '--mount',
          `type=volume,src=${project}_love-data,dst=/data,readonly`,
          '--entrypoint',
          'tar',
          'love-ci',
          '-C',
          '/data',
          '-czf',
          '-',
          '.',
        ],
        { maxBuffer: 32 * 1024 * 1024 },
      );
      await writeFile(join(legacyDirectory, 'database.dump'), dump);
      await writeFile(join(legacyDirectory, 'data.tar.gz'), data);
      await copyFile(join(dir, '.env'), join(legacyDirectory, 'deployment.env'));
      const hashes = await Promise.all(
        ['deployment.env', 'data.tar.gz', 'database.dump'].map(
          async (name) =>
            createHash('sha256')
              .update(await readFile(join(legacyDirectory, name)))
              .digest('hex') +
            '  ' +
            name,
        ),
      );
      await writeFile(join(legacyDirectory, 'SHA256SUMS'), hashes.join('\n') + '\n');
      query(
        `await db.prepare("UPDATE server_config SET value='changed' WHERE key='backup-proof'").run();`,
      );
      const beforeConfig = await readFile(join(dir, '.env'), 'utf8');
      const restored = menu('9\nlegacy-postgres\nRESTORE\nbackup\n0\n');
      assert.match(restored, /恢复完成/);
      assert.equal(await readFile(join(dir, '.env'), 'utf8'), beforeConfig);
      assert.equal(
        query(
          `console.log((await db.prepare("SELECT value FROM server_config WHERE key='backup-proof'").get()).value);`,
        ).trim(),
        'before',
      );
      console.log(
        'Legacy PGDMP backup decoded in a disposable database and restored successfully.',
      );
    }
    if (database === 'sqlite') {
      query(`await db.prepare("INSERT INTO couples(id) VALUES('migration-pair')").run();
        await db.prepare("INSERT INTO users(id,username,name,password,coupleId,email) VALUES('migration-user','migration_user','用户迁移','fixture-hash','migration-pair','migration@example.test')").run();
        await fs.mkdir('/app/data/media/tmp',{recursive:true});
        await fs.writeFile('/app/data/media/kept.preview.webp','referenced-media-fixture');
        await fs.writeFile('/app/data/media/orphan.mp4','old-unreferenced-file');
        await fs.writeFile('/app/data/media/tmp/interrupted','old-upload-temp');
        await db.prepare("INSERT INTO media(id,coupleId,ownerId,kind,original,preview,thumbnail,createdAt) VALUES('migration-media','migration-pair','migration-user','image','','kept.preview.webp','kept.preview.webp','2026-10-09')").run();
        await db.prepare("INSERT INTO media_sizes VALUES('migration-media',0,24,0,24)").run();
        await db.prepare("UPDATE users SET avatarMediaId='migration-media' WHERE id='migration-user'").run();`);
      // The selector regression above intentionally created a SQLite one-off container.
      // Remove it before changing providers; Compose exec must inspect the new application.
      execFileSync('docker', ['rm', '-f', maintenanceContainer], { stdio: 'ignore' });
      maintenanceContainer = undefined;
      menu('16\nyes\nbackup\nyes\n0\n');
      const cleaned = JSON.parse(
        query(
          `console.log(JSON.stringify({kept:await fs.readFile('/app/data/media/kept.preview.webp','utf8'),orphan:await fs.stat('/app/data/media/orphan.mp4').then(()=>true,()=>false),temp:await fs.stat('/app/data/media/tmp/interrupted').then(()=>true,()=>false)}));`,
        ).trim(),
      );
      assert.deepEqual(cleaned, { kept: 'referenced-media-fixture', orphan: false, temp: false });
      const beforeSqliteBackup = new Set(await readdir(join(dir, 'backups')));
      menu('8\n0\n');
      const sqliteBackup = (await readdir(join(dir, 'backups'))).find(
        (name) => !beforeSqliteBackup.has(name),
      );
      const originalSourceConfig = await readFile(join(dir, '.env'), 'utf8');
      const externalName = project + '-external';
      execFileSync(
        'docker',
        [
          'run',
          '-d',
          '--name',
          externalName,
          '--network',
          project + '_default',
          '-e',
          'POSTGRES_PASSWORD=external-test-password',
          'postgres:18-alpine',
        ],
        { stdio: 'ignore' },
      );
      try {
        execFileSync('docker', [
          'exec',
          externalName,
          'sh',
          '-c',
          'i=0; until pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do i=$((i+1)); [ "$i" -lt 60 ] || exit 1; sleep 1; done',
        ]);
        const target = {
          ...config,
          LOVE_DATABASE: 'external',
          DATABASE_PROVIDER: 'postgres',
          LOVE_DATA_VOLUME: 'postgres-work',
          DATABASE_URL:
            'postgresql://postgres:external-test-password@' + externalName + ':5432/postgres',
          MEDIA_SIGNING_SECRET: 'new-external-deployment-key-at-least-32',
        };
        const targetEnv =
          Object.entries(target)
            .map(([k, v]) => k + '=' + quoteEnv(v))
            .join('\n') + '\n';
        await writeFile(join(dir, '.env'), targetEnv);
        const countBeforeSkip = (await readdir(join(dir, 'backups'))).length;
        const output = menu('9\n' + sqliteBackup + '\nRESTORE\nskip\n0\n');
        assert.equal((await readdir(join(dir, 'backups'))).length, countBeforeSkip);
        assert.match(output, /恢复完成/);
        assert.equal(await readFile(join(dir, '.env'), 'utf8'), targetEnv);
        const convertedCompose = (...args) =>
          execFileSync(
            'docker',
            [...composeArgs, '-f', join(dir, 'compose.storage.yml'), ...args],
            { encoding: 'utf8' },
          );
        const convertedQuery = (code) =>
          convertedCompose(
            'exec',
            '-T',
            'love',
            'node',
            '--input-type=module',
            '-e',
            `import {openDatabase} from '/app/apps/server/dist/db.js';import {MediaRepository} from '/app/apps/server/dist/media-repository.js';const db=await openDatabase({path:process.env.DATABASE_URL,provider:'postgres'});try{${code}}finally{await db.close()}`,
          );
        const proof = JSON.parse(
          convertedQuery(
            `console.log(JSON.stringify({name:(await db.prepare("SELECT name FROM users WHERE id='migration-user'").get()).name,content:(await new MediaRepository(db,'/app/data/media').read('kept.preview.webp')).toString()}));`,
          ).trim(),
        );
        assert.deepEqual(proof, { name: '用户迁移', content: 'referenced-media-fixture' });
        const beforePgBackup = new Set(await readdir(join(dir, 'backups')));
        menu('8\n0\n');
        const pgBackup = (await readdir(join(dir, 'backups'))).find(
          (name) => !beforePgBackup.has(name),
        );
        await writeFile(join(dir, '.env'), originalSourceConfig);
        const back = menu('9\n' + pgBackup + '\nRESTORE\nbackup\n0\n');
        assert.match(back, /恢复完成/);
        assert.equal(await readFile(join(dir, '.env'), 'utf8'), originalSourceConfig);
        assert.equal(
          query(
            `console.log((await fs.readFile('/app/data/media/kept.preview.webp')).toString());`,
          ).trim(),
          'referenced-media-fixture',
        );
        assert.equal(
          query(
            `console.log((await db.prepare("SELECT name FROM users WHERE id='migration-user'").get()).name);`,
          ).trim(),
          '用户迁移',
        );
        console.log(
          'Real SQLite → external PostgreSQL → SQLite backup restoration, current config preservation and media bytes verified.',
        );
      } finally {
        execFileSync('docker', ['rm', '-f', externalName], { stdio: 'ignore' });
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
