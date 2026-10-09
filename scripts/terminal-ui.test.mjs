import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prompt, menuOptions } from '../deploy/terminal-ui.mjs';
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'love-ui-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const notes = [],
    calls = [];
  const ui = {
    intro() {},
    outro() {},
    note(value) {
      notes.push(value);
    },
    log: {
      info(value) {
        notes.push(value);
      },
    },
    isCancel: (value) => typeof value === 'symbol',
    select: async (p) => {
      calls.push(p);
      return p.initialValue ?? p.options[0].value;
    },
    text: async () => '',
    confirm: async () => false,
  };
  return { directory, notes, calls, ui };
}
test('modern menu exposes named actions and deployment summary without passwords', async (t) => {
  const f = await fixture(t);
  await writeFile(
    join(f.directory, '.env'),
    "LOVE_HTTPS='0'\nLOVE_DATABASE='postgres'\nADMIN_PASSWORD='private-password'\nCOMPOSE_PROJECT_NAME='love-ui'\n",
  );
  assert.equal(
    await prompt({
      ...f,
      kind: 'menu',
      env: { LOVE_UI_IMAGE: 'ghcr.io/kevinhuang001/love-app:latest' },
    }),
    'status',
  );
  assert.match(f.notes[0], /love-ui · postgres · HTTP/);
  assert.ok(!f.notes[0].includes('private-password'));
  assert.equal(f.calls[0].maxItems, 11);
  assert.ok(menuOptions.some((option) => option.value === 'database'));
  assert.ok(
    menuOptions.every((option) => !['backup', 'restore', 'cleanup'].includes(option.value)),
  );
  assert.ok(menuOptions.some((option) => option.value === 'refresh'));
  assert.equal(menuOptions.at(-1).value, 'exit');
});
test('first configuration is selected initially and destructive confirmations default to no', async (t) => {
  const f = await fixture(t);
  assert.equal(await prompt({ ...f, kind: 'menu', env: {} }), 'configure');
  assert.equal(await prompt({ ...f, kind: 'confirm', message: '删除？' }), 'no');
  assert.equal(await prompt({ ...f, kind: 'uninstall', message: 'love-ui' }), 'containers');
  assert.ok(menuOptions.every((option) => !['source', 'manage', 'migrate'].includes(option.value)));
});
test('backup picker orders newest first, skips non-directories and supports cancellation', async (t) => {
  const f = await fixture(t);
  assert.equal(await prompt({ ...f, kind: 'backup' }), '');
  await mkdir(join(f.directory, 'backups'));
  await mkdir(join(f.directory, 'backups', '20261008T010000Z-1'));
  await mkdir(join(f.directory, 'backups', '20261008T020000Z-1'));
  await writeFile(join(f.directory, 'backups', 'not-a-backup'), '');
  assert.equal(await prompt({ ...f, kind: 'backup' }), '20261008T020000Z-1');
  assert.equal(f.calls.at(-1).options.at(-1).value, '');
  await assert.rejects(
    prompt({ ...f, kind: 'backup', ui: { ...f.ui, select: async () => Symbol('cancel') } }),
    /PROMPT_CANCELLED/,
  );
});

test('partial credential recovery lists an explicit recovery option and defaults to cancellation', async (t) => {
  const f = await fixture(t);
  assert.equal(await prompt({ ...f, kind: 'recovery-policy' }), 'cancel');
  assert.deepEqual(
    f.calls.at(-1).options.map((o) => o.value),
    ['recover', 'cancel'],
  );
  assert.match(f.calls.at(-1).options[0].hint, /仅清空.*无法解密凭据/);
  assert.equal(
    await prompt({ ...f, kind: 'recovery-policy', ui: { ...f.ui, select: async () => 'recover' } }),
    'recover',
  );
});

test('operation backup policy defaults to skipping, permits explicit backup and cancellation', async (t) => {
  const f = await fixture(t);
  assert.equal(await prompt({ ...f, kind: 'backup-policy' }), 'skip');
  assert.deepEqual(
    f.calls.at(-1).options.map((o) => o.value),
    ['skip', 'backup', 'cancel'],
  );
  assert.equal(
    await prompt({ ...f, kind: 'backup-policy', ui: { ...f.ui, select: async () => 'backup' } }),
    'backup',
  );
  await assert.rejects(
    prompt({ ...f, kind: 'backup-policy', ui: { ...f.ui, select: async () => Symbol('cancel') } }),
    /PROMPT_CANCELLED/,
  );
});

test('database submenu groups checks, backups, recovery and cleanup; quick checks are the default', async (t) => {
  const f = await fixture(t);
  assert.equal(await prompt({ ...f, kind: 'database-menu' }), 'check');
  assert.deepEqual(
    f.calls.at(-1).options.map((o) => o.value),
    ['check', 'backup', 'restore', 'cleanup', 'back'],
  );
  assert.equal(await prompt({ ...f, kind: 'check-mode' }), 'quick');
  assert.deepEqual(
    f.calls.at(-1).options.map((o) => o.value),
    ['quick', 'deep', 'cancel'],
  );
});
