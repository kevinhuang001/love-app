import { open, mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export async function atomicFile(path, content, mode = 0o600) {
  await mkdir(dirname(path), { recursive: true });
  const temp = path + '.next-' + randomUUID();
  try {
    const f = await open(temp, 'wx', mode);
    try {
      await f.writeFile(content);
      await f.sync();
    } finally {
      await f.close();
    }
    await rename(temp, path);
    const dir = await open(dirname(path), 'r');
    try {
      await dir.sync();
    } finally {
      await dir.close();
    }
  } finally {
    await rm(temp, { force: true });
  }
}
