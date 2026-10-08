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
    await prompt({ ...f, kind: 'menu', env: { LOVE_UI_IMAGE: 'love-app:prebuilt' } }),
    'status',
  );
  assert.match(f.notes[0], /love-ui · postgres · HTTP/);
  assert.ok(!f.notes[0].includes('private-password'));
  assert.equal(f.calls[0].maxItems, 15);
  assert.ok(menuOptions.some((option) => option.value === 'refresh'));
  assert.equal(menuOptions.at(-1).value, 'exit');
});
test('first configuration is selected initially and destructive confirmations default to no', async (t) => {
  const f = await fixture(t);
  assert.equal(await prompt({ ...f, kind: 'menu', env: {} }), 'configure');
  assert.equal(await prompt({ ...f, kind: 'confirm', message: '删除？' }), 'no');
  assert.equal(await prompt({ ...f, kind: 'uninstall', message: 'love-ui' }), 'containers');
  assert.equal(await prompt({ ...f, kind: 'source' }), 'release');
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
    prompt({ ...f, kind: 'source', ui: { ...f.ui, select: async () => Symbol('cancel') } }),
    /PROMPT_CANCELLED/,
  );
});
