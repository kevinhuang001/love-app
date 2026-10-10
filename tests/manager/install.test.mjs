import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const installer = resolve('manager/install.sh');
async function fixture(t, { arch = 'x86_64', corrupt = false, fail = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'love-install-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const bin = join(directory, 'bin');
  await mkdir(bin);
  const binary = 'standalone-manager-fixture';
  const asset = arch === 'x86_64' ? 'love-linux-x64' : 'love-linux-arm64';
  const digest = createHash('sha256').update(binary).digest('hex');
  await writeFile(join(directory, 'binary'), binary);
  await writeFile(join(directory, 'checksums'), digest + '  ' + asset + '\n');
  await writeFile(
    join(bin, 'uname'),
    '#!/bin/sh\n[ "$1" = -s ] && echo Linux || echo ' + arch + '\n',
    { mode: 0o755 },
  );
  await writeFile(
    join(bin, 'curl'),
    `#!/bin/bash
set -eu
url= output=
while (( $# )); do
  case "$1" in
    --output) output=$2; shift 2;;
    https://*) url=$1; shift;;
    --proto|--proto-redir|--connect-timeout|--max-time|--retry|--retry-delay|--write-out) shift 2;;
    *) shift;;
  esac
done
printf '%s\\n' "$url" >> "$FIXTURE_DIR/requests"
case "$url" in
  */releases/latest) printf 'https://github.com/kevinhuang001/love-app/releases/tag/v2.9.2';;
  */download/v2.9.2/SHA256SUMS) cp "$FIXTURE_DIR/checksums" "$output";;
  */download/v2.9.2/love-linux-*) ${fail ? 'exit 22' : corrupt ? 'printf corrupted > "$output"' : 'cp "$FIXTURE_DIR/binary" "$output"'};;
  *) exit 23;;
esac
`,
    { mode: 0o755 },
  );
  await writeFile(join(directory, 'love'), 'previous-manager');
  await writeFile(join(directory, '.env'), 'deployment-secret');
  const run = () =>
    execFileSync('bash', ['-c', 'cat "$INSTALLER" | bash'], {
      cwd: directory,
      env: {
        ...process.env,
        PATH: bin + ':' + process.env.PATH,
        FIXTURE_DIR: directory,
        INSTALLER: installer,
      },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  return { directory, binary, asset, run };
}
for (const arch of ['x86_64', 'aarch64'])
  test(`piped installer downloads and verifies a pinned ${arch} binary without modifying deployment files`, async (t) => {
    const f = await fixture(t, { arch });
    const output = f.run();
    assert.match(output, /安装完成 · v2.9.2/);
    assert.equal(await readFile(join(f.directory, 'love'), 'utf8'), f.binary);
    assert.equal((await stat(join(f.directory, 'love'))).mode & 0o777, 0o755);
    assert.equal(await readFile(join(f.directory, '.env'), 'utf8'), 'deployment-secret');
    const urls = (await readFile(join(f.directory, 'requests'), 'utf8')).trim().split('\n');
    assert.equal(urls.length, 3);
    assert.ok(urls.slice(1).every((url) => url.includes('/download/v2.9.2/')));
    assert.ok(!(await readdir(f.directory)).some((name) => name.startsWith('.love-install.')));
  });
for (const options of [{ corrupt: true }, { fail: true }, { arch: 'riscv64' }])
  test(
    'installation failure preserves the existing executable and removes temporary downloads ' +
      JSON.stringify(options),
    async (t) => {
      const f = await fixture(t, options);
      assert.throws(f.run);
      assert.equal(await readFile(join(f.directory, 'love'), 'utf8'), 'previous-manager');
      assert.equal(await readFile(join(f.directory, '.env'), 'utf8'), 'deployment-secret');
      assert.ok(!(await readdir(f.directory)).some((name) => name.startsWith('.love-install.')));
    },
  );
