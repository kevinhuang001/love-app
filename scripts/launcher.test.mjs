import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtemp,
  copyFile,
  chmod,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
  lstat,
  readdir,
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
async function launch(t, config, input, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'love-manager-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await copyFile(new URL('../love', import.meta.url), join(dir, 'love'));
  if (config !== null) await writeFile(join(dir, '.env'), config);
  await writeFile(join(dir, 'answers'), input);
  await mkdir(join(dir, 'deploy'));
  await copyFile(
    new URL('../deploy/terminal-ui.mjs', import.meta.url),
    join(dir, 'deploy/terminal-ui.mjs'),
  );
  await writeFile(join(dir, 'compose.yml'), 'services: {}\n');
  await writeFile(join(dir, 'Caddyfile'), 'request_body {\n max_size 105MB\n}\n');
  await writeFile(join(dir, 'deploy/certbot-proxy.sh'), 'max_size 105MB\n');
  await mkdir(join(dir, 'bin'));
  if (options.failToolCopy) {
    await writeFile(
      join(dir, 'bin/cp'),
      `#!/bin/sh
case "$3" in */.love-Caddyfile.*) echo 'fixture: copy failed' >&2; exit 1;; esac
exec /bin/cp "$@"
`,
    );
    await chmod(join(dir, 'bin/cp'), 0o755);
  }
  await writeFile(
    join(dir, 'bin/docker'),
    `#!/usr/bin/env node
const fs=require('node:fs'),a=process.argv.slice(2);fs.appendFileSync(process.env.TEST_CALLS,JSON.stringify(a)+'\\n');
if(a.includes('/setup/deploy/terminal-ui.mjs')){
 const index=a.indexOf('/setup/deploy/terminal-ui.mjs'),kind=a[index+1],file=a[index+2].replace('/setup/',process.cwd()+'/');
 if(kind==='continue'){fs.writeFileSync(file,'continue');process.exit(0);}
 const queue=fs.readFileSync('answers','utf8').split('\\n'),next=queue.shift();fs.writeFileSync('answers',queue.join('\\n'));
 const menus={1:'configure',2:'start',3:'stop',4:'restart',5:'status',6:'logs',7:'update',8:'backup',9:'restore',12:'uninstall',13:'rollback',14:'refresh',16:'cleanup',0:'exit'};
 let result=next;
 if(kind==='menu')result=menus[next];
 if(kind==='confirm')result=next==='y'?'yes':'no';
 if(kind==='uninstall')result=next==='2'?'volumes':'containers';
 fs.writeFileSync(file,result||'');process.exit(0);
}
if(a.includes('/app/apps/server/dist/database-backup-cli.js')){
 if(a.includes('inspect')){console.log(process.env.TEST_BACKUP_PROVIDER||'sqlite');process.exit(process.env.TEST_UNREADABLE_CREDENTIALS==='1'?2:0);}
 if(a.includes('backup')){process.stdout.write('fixture-portable-backup');process.exit(process.env.TEST_BACKUP_FAIL==='1'?1:0);}
 if(a.includes('restore'))process.exit(process.env.TEST_RESTORE_FAIL==='1'?1:0);
}
if(a.includes('/app/apps/server/dist/unused-media-cli.js'))process.exit(process.env.TEST_CLEANUP_FAIL==='1'?1:0);
if(a.includes('inspect')&&process.env.TEST_IMAGE_MISSING==='1')process.exit(1);
if(a[0]==='ps'){console.log(process.env.TEST_RUNNING_IDS);process.exit(0);}
if(a[0]==='container'&&a[1]==='inspect'){
 const id=a[2];if(!/^[a-f0-9]{64}$/.test(id)){console.error('error: no such object: '+id);process.exit(1);}
 const ids=process.env.TEST_RUNNING_IDS.split('\\n');if(!ids.includes(id))process.exit(1);
 console.log('sha256:'+(process.env.TEST_MIXED_IMAGES==='1'&&id===ids[1]?'d':'c').repeat(64));process.exit(0);
}
if(a.includes('--input-type=module')&&a.includes('-')){if(process.env.TEST_HAS_UPDATE==='1')console.log('ghcr.io/kevinhuang001/love-app@sha256:'+'a'.repeat(64));process.exit(process.env.TEST_CHECK_FAIL==='1'?1:0);}
if(a.includes('--format'))console.log('fixture-status-output');
if(a.includes('ps')&&a.includes('--status'))console.log('test-running-container');
if(a.includes('exec')&&a.includes('pg_dump'))process.stdout.write('fixture-db-dump');
if(a[0]==='run'&&a.includes('-cf'))process.stdout.write(fs.readFileSync(process.env.TEST_BUNDLE));
else if(a[0]==='run'&&a.includes('tar'))process.stdout.write('fixture-media-backup');
`,
  );
  await chmod(join(dir, 'bin/docker'), 0o755);
  await mkdir(join(dir, 'bundle/deploy'), { recursive: true });
  for (const file of [
    'love',
    'compose.yml',
    'compose.postgres.yml',
    'compose.https.yml',
    'compose.certbot.yml',
    'compose.storage.yml',
    'Caddyfile',
    'deploy/terminal-ui.mjs',
    'deploy/certbot-proxy.sh',
    'deploy/certbot-renew.sh',
  ])
    await copyFile(new URL('../' + file, import.meta.url), join(dir, 'bundle', file));
  execFileSync('tar', [
    '-cf',
    join(dir, 'bundle.tar'),
    '-C',
    join(dir, 'bundle'),
    'love',
    'compose.yml',
    'compose.postgres.yml',
    'compose.https.yml',
    'compose.certbot.yml',
    'compose.storage.yml',
    'Caddyfile',
    'deploy',
  ]);
  if (options.bootstrap) await rm(join(dir, 'compose.yml'));
  if (options.prepare) await options.prepare(dir);
  const result = spawnSync(
    options.tty ? 'script' : 'sh',
    options.tty ? ['-q', '-e', '-c', 'sh love', '/dev/null'] : ['love', ...(options.args || [])],
    {
      cwd: dir,
      env: {
        ...process.env,
        PATH: join(dir, 'bin') + ':' + process.env.PATH,
        TEST_CALLS: join(dir, 'calls'),
        TEST_BUNDLE: join(dir, 'bundle.tar'),
        TEST_IMAGE_MISSING: options.missing ? '1' : '0',
        TEST_HAS_UPDATE: options.update ? '1' : '0',
        TEST_CHECK_FAIL: options.checkFail ? '1' : '0',
        TEST_RUNNING_IDS: (options.containers ?? ['a'.repeat(64)]).join('\n'),
        TEST_MIXED_IMAGES: options.mixedImages ? '1' : '0',
        TEST_RESTORE_FAIL: options.restoreFail ? '1' : '0',
        TEST_BACKUP_FAIL: options.backupFail ? '1' : '0',
        TEST_BACKUP_PROVIDER: options.backupProvider || 'sqlite',
        TEST_UNREADABLE_CREDENTIALS: options.unreadableCredentials ? '1' : '0',
        TEST_CLEANUP_FAIL: options.cleanupFail ? '1' : '0',
        TERM: 'xterm-256color',
      },
      encoding: 'utf8',
    },
  );
  const calls = (
    await readFile(join(dir, 'calls'), 'utf8').catch((e) => {
      if (e.code === 'ENOENT') return '';
      throw e;
    })
  )
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(JSON.parse);
  return {
    calls,
    result,
    dir,
    config: await readFile(join(dir, '.env'), 'utf8').catch((error) => {
      if (error.code === 'ENOENT') return '';
      throw error;
    }),
  };
}
const base =
  "LOVE_IMAGE='ghcr.io/kevinhuang001/love-app:latest'\nLOVE_DATABASE='sqlite'\nLOVE_HTTPS='0'\nCOMPOSE_PROJECT_NAME='love-test'\n";
test('interactive start never builds, preserves PostgreSQL / HTTPS order, and returns to menu', async (t) => {
  const { calls, result } = await launch(
    t,
    base
      .replace("'sqlite'", "'postgres'")
      .replace("LOVE_HTTPS='0'", "LOVE_HTTPS='1'\nLOVE_TLS_PROVIDER='certbot'"),
    '2\n5\n0\n',
  );
  assert.equal(result.status, 0);
  const up = calls.find((x) => x.includes('up'));
  assert.ok(up.includes('--no-build'));
  assert.ok(up.indexOf('compose.yml') < up.indexOf('compose.postgres.yml'));
  assert.ok(up.indexOf('compose.postgres.yml') < up.indexOf('compose.https.yml'));
  assert.ok(up.includes('compose.certbot.yml'));
  assert.ok(up.includes('love-test'));
  assert.ok(calls.some((x) => x.includes('ps')));
  assert.ok(calls.every((x) => !x.includes('--build') && x[0] !== 'build'));
});
test('refresh clears an interactive screen; action results remain until returning; redirected output has no escapes', async (t) => {
  const interactive = await launch(t, base, '14\n5\n0\n', { tty: true });
  assert.equal(interactive.result.status, 0);
  const clear = '\u001b[H\u001b[2J\u001b[3J';
  assert.ok(interactive.result.stdout.split(clear).length >= 5);
  const status = interactive.result.stdout.indexOf('fixture-status-output');
  assert.ok(status >= 0);
  assert.ok(interactive.result.stdout.indexOf(clear, status) > status);
  const prompts = interactive.calls.filter((args) =>
    args.includes('/setup/deploy/terminal-ui.mjs'),
  );
  assert.deepEqual(
    prompts.map((args) => args[args.indexOf('/setup/deploy/terminal-ui.mjs') + 1]),
    ['menu', 'menu', 'continue', 'menu'],
  );
  assert.ok(!interactive.calls.some((args) => args.includes('restart') || args.includes('up')));
  assert.equal(interactive.config, base);
  const redirected = await launch(t, base, '5\n0\n');
  assert.equal(redirected.result.status, 0);
  assert.ok(!redirected.result.stdout.includes('\u001b'));
});
test('up-to-date GHCR metadata does not pull layers, stop application or create backup', async (t) => {
  const { calls, config, result } = await launch(
    t,
    base + "ADMIN_PASSWORD='$(touch injected)'\n",
    '7\n0\n',
  );
  assert.equal(result.status, 0);
  assert.ok(calls.some((x) => x.includes('--input-type=module') && x.includes('-')));
  assert.ok(
    calls.every(
      (x) => x[0] !== 'pull' && !x.includes('stop') && !x.includes('tar') && x[0] !== 'build',
    ),
  );
  assert.match(result.stdout, /已是最新版本/);
  assert.equal(config, base + "ADMIN_PASSWORD='$(touch injected)'\n");
});
test('multiple running IDs are inspected separately; only this project service and non-oneoff containers are selected', async (t) => {
  const containers = ['a'.repeat(64), 'b'.repeat(64)];
  const { calls, result, config } = await launch(t, base, '7\n0\n', { containers });
  assert.match(result.stdout, /已是最新版本/);
  assert.equal(config, base);
  const selected = calls.find((args) => args[0] === 'ps');
  for (const label of ['project=love-test', 'service=love', 'oneoff=False'])
    assert.ok(selected.includes('label=com.docker.compose.' + label));
  assert.deepEqual(
    calls.filter((args) => args[0] === 'container' && args[1] === 'inspect').map((args) => args[2]),
    containers,
  );
  assert.ok(calls.every((args) => args[0] !== 'pull' && !args.includes('stop')));
});
test('mixed running image versions stop before registry checks, backup or mutation', async (t) => {
  const { calls, result, config } = await launch(t, base, '7\n0\n', {
    containers: ['a'.repeat(64), 'b'.repeat(64)],
    mixedImages: true,
  });
  assert.match(result.stderr, /多个运行实例使用不同镜像/);
  assert.equal(config, base);
  assert.ok(
    calls.every(
      (args) =>
        !args.includes('--input-type=module') &&
        args[0] !== 'pull' &&
        !args.includes('stop') &&
        !args.includes('tar'),
    ),
  );
});
test('a stopped application compares its local image without inspecting a container ID', async (t) => {
  const { calls, result } = await launch(t, base, '7\n0\n', { containers: [] });
  assert.match(result.stdout, /已是最新版本/);
  assert.ok(
    calls.some((args) => args[0] === 'image' && args[1] === 'inspect' && args.includes('{{.Id}}')),
  );
  assert.ok(!calls.some((args) => args[0] === 'container'));
});
test('failed update check and cancelled new version leave application and config unchanged', async (t) => {
  for (const options of [{ checkFail: true }, { update: true }]) {
    const { calls, config, result } = await launch(
      t,
      base,
      options.update ? '7\nn\n0\n' : '7\n0\n',
      options,
    );
    assert.equal(result.status, 0);
    assert.ok(
      calls.every(
        (x) => x[0] !== 'pull' && !x.includes('stop') && !x.includes('tar') && x[0] !== 'build',
      ),
    );
    assert.equal(config, base);
  }
});
test('missing registry image is pulled before start and existing images do not pull during inspection', async (t) => {
  const a = await launch(t, base, '2\n0\n', { missing: true });
  assert.ok(a.calls.some((x) => x[0] === 'pull'));
  const b = await launch(t, base, '5\n6\n0\n');
  assert.ok(!b.calls.some((x) => x[0] === 'pull' || x[0] === 'build'));
  assert.ok(b.calls.some((x) => x.includes('logs')));
});
test('HTTPS modes select only required overlays', async (t) => {
  for (const tls of ['certbot', 'caddy', 'external', 'none']) {
    const { calls } = await launch(
      t,
      base.replace(
        "LOVE_HTTPS='0'",
        `LOVE_HTTPS='${tls === 'none' ? '0' : '1'}'\nLOVE_TLS_PROVIDER='${tls}'`,
      ),
      '2\n0\n',
    );
    const up = calls.find((x) => x.includes('up'));
    assert.equal(up.includes('compose.https.yml'), ['caddy', 'certbot'].includes(tls));
    assert.equal(up.includes('compose.certbot.yml'), tls === 'certbot');
  }
});
test('backup stops writers, archives volume and resumes app; uninstall defaults to preserving volumes', async (t) => {
  const { calls, dir } = await launch(t, base, '8\n12\n\ny\n0\n');
  const stop = calls.findIndex((x) => x.includes('stop') && x.at(-1) === 'love'),
    archive = calls.findIndex(
      (x) => x.includes('/app/apps/server/dist/database-backup-cli.js') && x.includes('backup'),
    ),
    resume = calls.findIndex((x) => x.includes('start'));
  assert.ok(stop < archive && archive < resume);
  assert.ok(calls[archive].includes('--no-deps'));
  assert.ok(!calls.some((x) => x.includes('database-tools') || x.includes('pg_dump')));
  const down = calls.find((x) => x.includes('down'));
  assert.ok(!down.includes('--volumes'));
  const files = execFileSync('find', [join(dir, 'backups'), '-name', 'SHA256SUMS'], {
    encoding: 'utf8',
  });
  assert.ok(files.includes('SHA256SUMS'));
});
test('data deletion requires exact deployment-specific confirmation; subcommands are rejected', async (t) => {
  const no = await launch(t, base, '12\n2\nDELETE-another\n0\n');
  assert.ok(!no.calls.some((x) => x.includes('down')));
  const yes = await launch(t, base, '12\n2\nDELETE-love-test\n0\n');
  assert.ok(yes.calls.some((x) => x.includes('down') && x.includes('--volumes')));
  const old = await launch(t, base, '', { args: ['up'] });
  assert.equal(old.result.status, 1);
  assert.match(old.result.stderr, /直接运行/);
});

test('new deployment starts from the management script and retrieves all tools from GHCR, without Release downloads', async (t) => {
  const { calls, result, dir } = await launch(t, null, '0\n', { bootstrap: true });
  assert.equal(result.status, 0);
  assert.ok(calls.some((args) => args[0] === 'run' && args.includes('-cf')));
  assert.match(await readFile(join(dir, 'compose.yml'), 'utf8'), /services:/);
  assert.ok(calls.every((args) => !['load', 'build', 'curl'].includes(args[0])));
});
test('a confirmed GHCR update preserves deployment values, refreshes bundled scripts and removes proxy upload caps', async (t) => {
  const secret = "ADMIN_PASSWORD='$(touch injected)'\n",
    original =
      base.replace("LOVE_HTTPS='0'", "LOVE_HTTPS='1'\nLOVE_TLS_PROVIDER='certbot'") + secret;
  const { calls, result, config, dir } = await launch(t, original, '7\ny\nbackup\n0\n', {
    update: true,
  });
  assert.equal(result.status, 0);
  const stop = calls.findIndex((a) => a.includes('stop') && a.at(-1) === 'love'),
    pull = calls.findIndex((a) => a[0] === 'pull'),
    start = calls.findIndex((a, i) => i > pull && a.includes('up'));
  assert.ok(stop >= 0 && pull > stop && start > pull);
  assert.equal(calls[pull][1], 'ghcr.io/kevinhuang001/love-app@sha256:' + 'a'.repeat(64));
  assert.equal(await readFile(join(dir, 'compose.yml'), 'utf8'), 'services: {}\n');
  for (const path of ['Caddyfile', 'deploy/certbot-proxy.sh']) {
    assert.equal(
      await readFile(join(dir, path), 'utf8'),
      await readFile(new URL('../' + path, import.meta.url), 'utf8'),
    );
    assert.doesNotMatch(await readFile(join(dir, path), 'utf8'), /max_size/);
  }
  assert.ok(
    calls.some((args, i) => i > start && args.includes('restart') && args.at(-1) === 'proxy'),
  );
  assert.ok(config.includes(secret));
  assert.match(config, /LOVE_IMAGE='ghcr.io\/kevinhuang001\/love-app@sha256:/);
  assert.ok(calls.every((a) => !['build', 'load', 'curl'].includes(a[0])));
  await assert.rejects(readFile(join(dir, 'injected')), (error) => error.code === 'ENOENT');
});

test('bootstrap and repeated updates ignore stale .next files, directories and dangling links', async (t) => {
  for (const bootstrap of [false, true]) {
    for (const residue of ['file', 'directory', 'symlink']) {
      const { result, config, dir, calls } = await launch(
        t,
        bootstrap ? null : base,
        bootstrap ? '0\n' : '7\ny\nbackup\n7\ny\nbackup\n0\n',
        {
          bootstrap,
          update: true,
          prepare: async (directory) => {
            // cp to a dangling love.next reproduces the user's exact EEXIST failure.
            for (const name of ['love.next', '.env.next', 'compose.yml.next', 'Caddyfile.next']) {
              const path = join(directory, name);
              if (residue === 'file') await writeFile(path, 'previous interrupted write');
              if (residue === 'directory') await mkdir(path);
              if (residue === 'symlink') await symlink('missing-target', path);
            }
          },
        },
      );
      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(result.stderr, /操作未完成|File exists/);
      assert.equal(
        await readFile(join(dir, 'love'), 'utf8'),
        await readFile(new URL('../love', import.meta.url), 'utf8'),
      );
      assert.equal((await lstat(join(dir, 'love'))).mode & 0o777, 0o755);
      assert.equal((await lstat(join(dir, 'love.next'))).isSymbolicLink(), residue === 'symlink');
      assert.equal((await lstat(join(dir, 'love.next'))).isDirectory(), residue === 'directory');
      for (const folder of [dir, join(dir, 'deploy')])
        assert.ok(
          !(await readdir(folder)).some((name) => /^\.love-.*\.[a-zA-Z0-9]{8}$/.test(name)),
        );
      if (!bootstrap) {
        assert.equal((await lstat(join(dir, '.env'))).mode & 0o777, 0o600);
        assert.match(config, /LOVE_IMAGE='ghcr.io\/kevinhuang001\/love-app@sha256:/);
        assert.equal(calls.filter((a) => a.includes('up')).length, 2);
      }
    }
  }
});

test('deployment writes never follow stale links; failed tool copy cleans temp files and preserves the active image', async (t) => {
  const { result, dir, config, calls } = await launch(t, base, '7\ny\nbackup\n0\n', {
    update: true,
    failToolCopy: true,
    prepare: async (directory) => {
      await writeFile(join(directory, 'untouched'), 'private configuration');
      await symlink('untouched', join(directory, 'love.next'));
      await symlink('untouched', join(directory, '.env.next'));
    },
  });
  assert.match(result.stderr, /fixture: copy failed/);
  assert.match(result.stderr, /操作未完成/);
  assert.equal(await readFile(join(dir, 'untouched'), 'utf8'), 'private configuration');
  assert.equal(config, base);
  assert.equal(
    await readFile(join(dir, 'love'), 'utf8'),
    await readFile(new URL('../love', import.meta.url), 'utf8'),
  );
  const pull = calls.findIndex((a) => a[0] === 'pull');
  assert.ok(pull > 0);
  assert.ok(calls.some((a, i) => i < pull && a.includes('start') && a.at(-1) === 'love'));
  assert.ok(!calls.some((a, i) => i > pull && a.includes('up')));
  const prompts = calls.filter((a, i) => i > pull && a.includes('/setup/deploy/terminal-ui.mjs'));
  assert.ok(prompts.length > 0);
  assert.ok(prompts.every((a) => a.includes('ghcr.io/kevinhuang001/love-app:latest')));
  assert.ok(!(await readdir(join(dir, 'deploy'))).some((name) => name.startsWith('.love-')));
  assert.ok(!(await readdir(dir)).some((name) => name.startsWith('.love-Caddyfile.')));
});

test('restore detects source type, preserves external configuration, backs up and resumes on failure', async (t) => {
  for (const restoreFail of [false, true])
    for (const backupProvider of ['sqlite', 'postgres']) {
      const current =
        base.replace("'sqlite'", "'external'") +
        "DATABASE_PROVIDER='postgres'\nDATABASE_URL='postgresql://external.example/love'\n";
      const { calls, config, result } = await launch(
        t,
        current,
        '9\noriginal-backup\nRESTORE\nbackup\n0\n',
        {
          restoreFail,
          backupProvider,
          prepare: async (dir) => {
            await mkdir(join(dir, 'backups', 'original-backup'), { recursive: true });
          },
        },
      );
      assert.equal(result.status, 0, result.stderr);
      assert.equal(config, current);
      const restore = calls.findIndex(
        (a) => a.includes('/app/apps/server/dist/database-backup-cli.js') && a.includes('restore'),
      );
      const before = calls.findIndex(
        (a) => a.includes('/app/apps/server/dist/database-backup-cli.js') && a.includes('backup'),
      );
      assert.ok(restore > before && before >= 0);
      assert.ok(calls[restore].includes('--no-deps'));
      assert.ok(
        !calls.some(
          (a) =>
            a.includes('database-tools') ||
            a.includes('pg_restore') ||
            a.includes('compose.postgres.yml') ||
            a.includes('postgres:18-alpine'),
        ),
      );
      assert.ok(calls.some((a, i) => i > restore && a.includes(restoreFail ? 'start' : 'up')));
    }
});
test('unreadable credential recovery is opt-in and cancellation does not stop or mutate the app', async (t) => {
  for (const recover of [false, true]) {
    const current =
      base.replace("'sqlite'", "'external'") +
      "DATABASE_PROVIDER='postgres'\nDATABASE_URL='postgresql://external.example/love'\n";
    const { calls, config, result } = await launch(
      t,
      current,
      recover
        ? '9\noriginal-backup\nrecover\nRESTORE\nskip\n0\n'
        : '9\noriginal-backup\ncancel\n0\n',
      {
        unreadableCredentials: true,
        prepare: (dir) => mkdir(join(dir, 'backups', 'original-backup'), { recursive: true }),
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(config, current);
    const restore = calls.find(
      (a) => a.includes('/app/apps/server/dist/database-backup-cli.js') && a.includes('restore'),
    );
    assert.equal(Boolean(restore), recover);
    if (recover) assert.ok(restore.includes('--reset-unreadable-credentials'));
    else assert.ok(!calls.some((a) => a.includes('stop') || a.includes('up')));
    assert.ok(
      !calls.some(
        (a) => a.includes('backup') && a.includes('/app/apps/server/dist/database-backup-cli.js'),
      ),
    );
  }
});

test('cleanup backs up before deletion, stops writers, restores running state on failure and never changes database config', async (t) => {
  for (const cleanupFail of [false, true]) {
    const { calls, config, result } = await launch(t, base, '16\ny\nbackup\n0\n', { cleanupFail });
    assert.equal(result.status, 0);
    assert.equal(config, base);
    const cleanup = calls.findIndex((a) => a.includes('/app/apps/server/dist/unused-media-cli.js'));
    assert.ok(
      cleanup >
        calls.findIndex(
          (a) => a.includes('/app/apps/server/dist/database-backup-cli.js') && a.includes('backup'),
        ),
    );
    assert.ok(calls[cleanup].includes('--apply'));
    assert.ok(calls.some((a, i) => i > cleanup && a.includes('start') && a.at(-1) === 'love'));
  }
});

test('update, restore and cleanup can skip backups entirely or cancel before mutations', async (t) => {
  for (const action of ['update', 'restore', 'cleanup'])
    for (const policy of ['skip', 'cancel']) {
      const input =
        action === 'update'
          ? `7\ny\n${policy}\n0\n`
          : action === 'restore'
            ? `9\noriginal-backup\nRESTORE\n${policy}\n0\n`
            : `16\ny\n${policy}\n0\n`;
      const { calls, result, dir } = await launch(t, base, input, {
        update: action === 'update',
        backupFail: true,
        prepare: async (dir) => {
          await mkdir(join(dir, 'backups', 'original-backup'), { recursive: true });
        },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.ok(
        !calls.some(
          (a) => a.includes('/app/apps/server/dist/database-backup-cli.js') && a.includes('backup'),
        ),
      );
      assert.deepEqual(await readdir(join(dir, 'backups')), ['original-backup']);
      const mutations = calls.filter(
        (a) =>
          a.includes('stop') ||
          a.includes('up') ||
          a.includes('/app/apps/server/dist/unused-media-cli.js') ||
          (a.includes('/app/apps/server/dist/database-backup-cli.js') && a.includes('restore')),
      );
      assert.equal(mutations.length > 0, policy === 'skip');
    }
});
