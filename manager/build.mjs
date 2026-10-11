import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { templates } from './templates.mjs';
import pkg from '../package.json' with { type: 'json' };
const source = process.env.LOVE_SOURCE_SHA || process.env.GITHUB_SHA || '0'.repeat(40);
if (!/^[a-f0-9]{40}$/.test(source)) throw new Error('Manager source SHA is required');
await mkdir('.artifacts/manager', { recursive: true });
for (const name of [
  'love-linux-x64',
  'love-linux-arm64',
  'love-linux-x64.xz',
  'love-linux-arm64.xz',
])
  await rm('.artifacts/manager/' + name, { force: true });
const name = 'love-manager.mjs';
await build({
  entryPoints: ['manager/entry.mjs'],
  outfile: '.artifacts/manager/' + name,
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  minify: true,
  external: ['pg-native'],
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire as loveCreateRequire } from "node:module"; const require = loveCreateRequire(import.meta.url);',
  },
  define: { 'import.meta.main': 'false', LOVE_SOURCE_SHA: JSON.stringify(source) },
  plugins: [
    {
      name: 'embedded-deployment-templates',
      setup(build) {
        build.onLoad({ filter: /manager[\\/]templates\.mjs$/ }, () => ({
          contents: 'export const templates=' + JSON.stringify(templates),
          loader: 'js',
        }));
      },
    },
  ],
});
const data = await readFile('.artifacts/manager/' + name);
const assets = [
  { name, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length },
];
await writeFile('.artifacts/manager/SHA256SUMS', assets[0].sha256 + '  ' + name + '\n');
await writeFile(
  '.artifacts/manager/manager-release.json',
  JSON.stringify({ version: pkg.version, source, runtime: 'node24', assets, templates }, null, 2) +
    '\n',
);
