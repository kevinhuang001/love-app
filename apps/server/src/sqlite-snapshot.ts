import { mkdtemp, copyFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Call only while source writers are stopped. Copy a possible WAL as well; SQLite can
// create the scratch SHM it needs without touching a read-only source volume.
export async function withSQLiteSnapshot<T>(
  source: string,
  action: (snapshot: string) => Promise<T>,
) {
  const directory = await mkdtemp(join(tmpdir(), 'love-sqlite-snapshot-'));
  try {
    const snapshot = join(directory, 'source.sqlite');
    await copyFile(source, snapshot);
    await copyFile(source + '-wal', snapshot + '-wal').catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    return await action(snapshot);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
