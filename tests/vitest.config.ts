import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: { include: ['tests/client/*.test.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('../apps/client/src', import.meta.url)) } },
});
