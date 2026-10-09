import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { templates } from '../deploy/templates.mjs';
import pkg from '../package.json';
const source = process.env.LOVE_SOURCE_SHA || process.env.GITHUB_SHA || '0'.repeat(40);
if (!/^[a-f0-9]{40}$/.test(source)) throw new Error('Manager source SHA is required');
await mkdir('manager-dist', { recursive: true });
const targets = process.argv.includes('--native')
  ? [process.arch === 'arm64' ? 'arm64' : 'x64']
  : ['x64', 'arm64'];
const assets = [];
for (const arch of targets) {
  const name = 'love-linux-' + arch;
  const build = await Bun.build({
    entrypoints: ['deploy/entry.mjs'],
    compile: {
      target: 'bun-linux-' + arch + (arch === 'x64' ? '-baseline' : ''),
      outfile: 'manager-dist/' + name,
      autoloadDotenv: false,
      autoloadBunfig: false,
    },
    minify: true,
    external: ['pg-native'],
    define: { LOVE_SOURCE_SHA: JSON.stringify(source) },
  });
  if (!build.success) throw new AggregateError(build.logs, 'Manager compilation failed');
  const data = await readFile('manager-dist/' + name);
  assets.push({
    name,
    sha256: createHash('sha256').update(data).digest('hex'),
    bytes: data.length,
  });
}
await writeFile(
  'manager-dist/SHA256SUMS',
  assets.map((x) => x.sha256 + '  ' + x.name).join('\n') + '\n',
);
await writeFile(
  'manager-dist/manager-release.json',
  JSON.stringify({ version: pkg.version, source, assets, templates }, null, 2) + '\n',
);
