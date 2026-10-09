import { DatabaseSync, backup, type SQLInputValue } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, constants } from 'node:fs';
import {
  mkdir,
  open,
  readFile,
  stat,
  rm,
  rename,
  copyFile,
  writeFile,
  readdir,
  chown,
} from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import tar from 'tar-stream';
import { openDatabase, type DB } from './db.js';
import { schema } from './schema.js';
import { transferTables, restoreToPostgres, type TransferReport } from './database-restore.js';
import { MediaRepository } from './media-repository.js';
import { withSQLiteSnapshot } from './sqlite-snapshot.js';
import { seal, unseal } from './mail.js';

const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const identities = ['messages', 'access_logs', 'server_logs', 'audit_logs'];
const exists = async (path: string) =>
  stat(path).then(
    () => true,
    (e) => {
      if (e.code === 'ENOENT') return false;
      throw e;
    },
  );
async function sync(path: string) {
  const f = await open(path, 'r');
  try {
    await f.sync();
  } finally {
    await f.close();
  }
}
export async function digestFile(path: string) {
  const hash = createHash('sha256');
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    for await (const part of handle.createReadStream({ autoClose: false })) hash.update(part);
  } finally {
    await handle.close();
  }
  return hash.digest('hex');
}

// Extract into a private empty directory. No links or special files are accepted, including
// ignored legacy entries: a malicious archive cannot affect the deployment or its backups.
export async function extractBackup(archive: string, directory: string) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const extract = tar.extract(),
    seen = new Set<string>();
  extract.on('entry', (header, stream, next) => {
    stream.on('error', () => {});
    void (async () => {
      const path = header.name.replace(/^\.\//, '').replace(/\/$/, '');
      if (['.', './'].includes(header.name) && header.type === 'directory') {
        stream.resume();
        next();
        return;
      }
      if (
        !path ||
        path.startsWith('/') ||
        path.includes('\\') ||
        /[\x00-\x1f]/.test(path) ||
        path.split('/').some((p) => p === '..' || !p) ||
        !['file', 'directory'].includes(header.type)
      )
        throw new Error('备份包含不安全路径、链接或特殊文件');
      if (header.type === 'directory') {
        stream.resume();
        next();
        return;
      }
      if (seen.has(path)) throw new Error('备份包含重复文件');
      seen.add(path);
      const wanted =
        ['love.sqlite', 'love.sqlite-wal', 'love.sqlite-shm', 'manifest.json'].includes(path) ||
        (path.startsWith('media/') && path.split('/').length === 2);
      if (!wanted) {
        stream.resume();
        stream.once('end', next);
        return;
      }
      const output = join(directory, path);
      await mkdir(dirname(output), { recursive: true, mode: 0o700 });
      await pipeline(stream, createWriteStream(output, { flags: 'wx', mode: 0o600 }));
      next();
    })().catch((error) => {
      stream.destroy(error);
      extract.destroy(error);
    });
  });
  await pipeline(createReadStream(archive), createGunzip(), extract);
  if (!(await exists(join(directory, 'love.sqlite'))))
    throw new Error('备份不包含 SQLite 数据快照');
}

export async function exportDatabase({
  db,
  sqlitePath,
  mediaDirectory,
  directory,
}: {
  db?: DB;
  sqlitePath?: string;
  mediaDirectory: string;
  directory: string;
}) {
  await mkdir(join(directory, 'media'), { recursive: true, mode: 0o700 });
  const output = join(directory, 'love.sqlite');
  const provider = db?.provider || 'sqlite';
  if (provider === 'sqlite') {
    if (!sqlitePath) throw new Error('缺少 SQLite 路径');
    await withSQLiteSnapshot(sqlitePath, async (snapshot) => {
      const upgraded = await openDatabase(snapshot);
      await upgraded.close();
      const source = new DatabaseSync(snapshot, { readOnly: true });
      try {
        await backup(source, output);
      } finally {
        source.close();
      }
    });
  } else {
    const source = db!;
    const sqlite = new DatabaseSync(output);
    try {
      sqlite.exec(schema + '; PRAGMA user_version=9; BEGIN; PRAGMA defer_foreign_keys=ON;');
      await source.transaction(
        async () => {
          for (const table of transferTables) {
            const columns = sqlite
              .prepare(`PRAGMA table_info(${quote(table)})`)
              .all()
              .map((r) => String(r.name));
            const insert = sqlite.prepare(
              `INSERT INTO ${quote(table)}(${columns.map(quote).join(',')}) VALUES(${columns.map(() => '?').join(',')})`,
            );
            await source.exec(
              `DECLARE backup_rows NO SCROLL CURSOR FOR SELECT ${columns.map(quote).join(',')} FROM ${quote(table)}`,
            );
            try {
              while (true) {
                const rows = await source.prepare('FETCH FORWARD 500 FROM backup_rows').all();
                if (!rows.length) break;
                for (const row of rows)
                  insert.run(...(columns.map((c) => row[c]) as SQLInputValue[]));
              }
            } finally {
              await source.exec('CLOSE backup_rows');
            }
          }
          for (const name of identities) {
            const sequence = String(
              (await source.prepare('SELECT pg_get_serial_sequence(?,?) value').get(name, 'id'))!
                .value,
            );
            // Read the real sequence high-water mark, including deleted IDs.
            const savedSequence = (await source
              .prepare(`SELECT last_value,is_called FROM ${sequence}`)
              .get())!;
            const value = Number(savedSequence.last_value) - (savedSequence.is_called ? 0 : 1);
            const maximum = Number(
              sqlite.prepare(`SELECT COALESCE(MAX(id),0) value FROM ${quote(name)}`).get()!.value,
            );
            sqlite.prepare('DELETE FROM sqlite_sequence WHERE name=?').run(name);
            sqlite
              .prepare('INSERT INTO sqlite_sequence(name,seq) VALUES(?,?)')
              .run(name, Math.max(value, maximum));
          }
          const repository = new MediaRepository(source, mediaDirectory);
          for (const media of sqlite
            .prepare('SELECT id,original,preview,thumbnail FROM media')
            .iterate()) {
            for (const name of new Set(
              [media.original, media.preview, media.thumbnail].filter(Boolean).map(String),
            )) {
              if (name !== basename(name) || name === '.' || name === '..')
                throw new Error('媒体路径无效');
              const destination = join(directory, 'media', name);
              const info = await repository.info(name);
              await pipeline(
                repository.stream(name),
                createWriteStream(destination, { flags: 'wx', mode: 0o600 }),
              );
              if (
                (await stat(destination)).size !== info.bytes ||
                (info.sha256 && (await digestFile(destination)) !== info.sha256)
              )
                throw new Error('数据库媒体备份校验失败');
            }
          }
        },
        { snapshot: true },
      );
      sqlite.exec('COMMIT');
    } finally {
      sqlite.close();
    }
  }
  // SQLite media are read only while application writers are stopped. Include only referenced files.
  if (provider === 'sqlite') {
    const source = new DatabaseSync(output, { readOnly: true });
    try {
      for (const media of source
        .prepare('SELECT original,preview,thumbnail FROM media')
        .iterate()) {
        for (const name of new Set(
          [media.original, media.preview, media.thumbnail].filter(Boolean).map(String),
        )) {
          if (name !== basename(name) || name === '.' || name === '..')
            throw new Error('媒体路径无效');
          const file = await open(
            join(mediaDirectory, name),
            constants.O_RDONLY | constants.O_NOFOLLOW,
          );
          try {
            await pipeline(
              file.createReadStream({ autoClose: false }),
              createWriteStream(join(directory, 'media', name), { flags: 'wx', mode: 0o600 }),
            );
          } finally {
            await file.close();
          }
        }
      }
    } finally {
      source.close();
    }
  }
  const report = await restoreToPostgres({
    sourcePath: output,
    mediaDirectory: join(directory, 'media'),
  });
  await writeFile(
    join(directory, 'manifest.json'),
    JSON.stringify({
      format: 'love-backup',
      version: 1,
      provider,
      createdAt: new Date().toISOString(),
      databaseSha256: await digestFile(output),
      report,
    }) + '\n',
    { mode: 0o600 },
  );
  return report;
}

export async function validatePackage(directory: string) {
  const database = join(directory, 'love.sqlite'),
    media = join(directory, 'media');
  const report = await restoreToPostgres({ sourcePath: database, mediaDirectory: media });
  if (await exists(join(directory, 'manifest.json'))) {
    const m = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
    if (
      m.format !== 'love-backup' ||
      m.version !== 1 ||
      !['sqlite', 'postgres'].includes(m.provider) ||
      m.databaseSha256 !== (await digestFile(database)) ||
      JSON.stringify(m.report) !== JSON.stringify(report)
    )
      throw new Error('备份清单或内容摘要不匹配');
    return { provider: m.provider as 'sqlite' | 'postgres', report };
  }
  return { provider: 'sqlite' as const, report };
}

// Re-encrypt private credentials in the scratch copy so current .env stays byte-for-byte intact.
export function rekeyBackup(path: string, sourceSecret: string, targetSecret: string) {
  if (!targetSecret) throw new Error('当前部署缺少媒体密钥');
  const sqlite = new DatabaseSync(path);
  try {
    const storedSecret = sqlite
      .prepare("SELECT value FROM server_config WHERE key='mediaSecret'")
      .get();
    const candidates = [...new Set([sourceSecret, storedSecret?.value, targetSecret])].filter(
      (key): key is string => typeof key === 'string' && key.length > 0,
    );
    // Older deployments may have encrypted credentials with the database-generated
    // key before MEDIA_SIGNING_SECRET was configured. Accept a candidate only after
    // AES-GCM authentication; never guess a key or discard encrypted credentials.
    let changedKey = sourceSecret !== targetSecret;
    const reseal = (ciphertext: string, label: string) => {
      for (const key of candidates) {
        let plaintext: string;
        try {
          plaintext = unseal(ciphertext, key);
        } catch {
          continue;
        }
        if (key === targetSecret) return ciphertext;
        changedKey = true;
        return seal(plaintext, targetSecret);
      }
      throw new Error(
        `备份中的${label}无法解密：备份配置、数据库内保存的旧密钥及当前密钥均无法验证。` +
          '请使用加密这些凭据时的 MEDIA_SIGNING_SECRET；当前数据未修改。',
      );
    };
    // Authenticate every credential before writing even the private snapshot.
    const settings = sqlite
      .prepare("SELECT coupleId,secret FROM couple_ai_settings WHERE secret<>''")
      .all()
      .map((row) => ({ coupleId: row.coupleId, secret: reseal(String(row.secret), 'AI 密钥') }));
    const config = sqlite.prepare("SELECT value FROM server_config WHERE key='control'").get();
    const value = config ? JSON.parse(String(config.value)) : undefined;
    if (value?.smtp?.password) value.smtp.password = reseal(value.smtp.password, 'SMTP 密码');
    sqlite.exec('BEGIN');
    for (const row of settings)
      sqlite
        .prepare('UPDATE couple_ai_settings SET secret=? WHERE coupleId=?')
        .run(row.secret, row.coupleId);
    if (value) {
      sqlite
        .prepare("UPDATE server_config SET value=? WHERE key='control'")
        .run(JSON.stringify(value));
    }
    sqlite.prepare("UPDATE server_config SET value=? WHERE key='mediaSecret'").run(targetSecret);
    // Pending verification codes are tied to the source HMAC key and are transient.
    if (changedKey) sqlite.exec('DELETE FROM captchas; DELETE FROM email_codes;');
    sqlite.exec('COMMIT; PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (error) {
    if (sqlite.isTransaction) sqlite.exec('ROLLBACK');
    throw error;
  } finally {
    sqlite.close();
  }
}

// A durable rollback journal covers DB + media + WAL. Startup refuses to open the
// database until an interrupted switch has been recovered. Old data are retained until done.
export async function recoverSQLiteRestore(databasePath: string) {
  const root = dirname(resolve(databasePath)),
    journal = join(root, '.love-restore.json');
  if (!(await exists(journal))) return;
  const state = JSON.parse(await readFile(journal, 'utf8')) as {
    stage: string;
    committed: boolean;
    files: { name: string; hadOld: boolean }[];
  };
  if (
    !/^\.love-restore-[a-f0-9-]+$/.test(state.stage) ||
    state.files.some(
      (f) =>
        ![
          basename(databasePath),
          basename(databasePath) + '-wal',
          basename(databasePath) + '-shm',
          'media',
        ].includes(f.name),
    )
  )
    throw new Error('恢复日志无效');
  const stage = join(root, state.stage);
  if (!state.committed) {
    for (const file of [...state.files].reverse()) {
      const live = join(root, file.name),
        old = join(stage, 'old', file.name);
      if (await exists(old)) {
        await rm(live, { recursive: true, force: true });
        await rename(old, live);
      } else if (!file.hadOld) await rm(live, { recursive: true, force: true });
    }
  }
  await sync(root);
  await rm(journal, { force: true });
  await sync(root);
  await rm(stage, { recursive: true, force: true });
}
export async function restoreSQLite(
  directory: string,
  databasePath: string,
): Promise<TransferReport> {
  const { report } = await validatePackage(directory);
  await recoverSQLiteRestore(databasePath);
  const root = dirname(resolve(databasePath));
  await mkdir(root, { recursive: true });
  const stageName = '.love-restore-' + randomUUID(),
    stage = join(root, stageName),
    journal = join(root, '.love-restore.json');
  await mkdir(join(stage, 'old'), { recursive: true, mode: 0o700 });
  const files = [
    basename(databasePath),
    basename(databasePath) + '-wal',
    basename(databasePath) + '-shm',
    'media',
  ];
  const state = {
    stage: stageName,
    committed: false,
    files: await Promise.all(
      files.map(async (name) => ({ name, hadOld: await exists(join(root, name)) })),
    ),
  };
  try {
    const db = new DatabaseSync(join(directory, 'love.sqlite'), { readOnly: true });
    try {
      await backup(db, join(stage, basename(databasePath)));
    } finally {
      db.close();
    }
    await mkdir(join(stage, 'media'), { mode: 0o700 });
    const source = new DatabaseSync(join(directory, 'love.sqlite'), { readOnly: true });
    try {
      for (const row of source.prepare('SELECT original,preview,thumbnail FROM media').iterate())
        for (const name of new Set(
          [row.original, row.preview, row.thumbnail].filter(Boolean).map(String),
        ))
          await copyFile(
            join(directory, 'media', name),
            join(stage, 'media', name),
            constants.COPYFILE_EXCL,
          );
    } finally {
      source.close();
    }
    await sync(join(stage, basename(databasePath)));
    const owner = await stat(root);
    const stagedFiles = [
      stage,
      join(stage, 'old'),
      join(stage, basename(databasePath)),
      join(stage, 'media'),
      ...(await readdir(join(stage, 'media'))).map((name) => join(stage, 'media', name)),
    ];
    for (const path of stagedFiles) {
      await chown(path, owner.uid, owner.gid);
      await sync(path);
    }
    await sync(join(stage, 'media'));
    await sync(stage);
    await writeFile(journal, JSON.stringify(state), { flag: 'wx', mode: 0o600 });
    await chown(journal, owner.uid, owner.gid);
    await sync(journal);
    await sync(root);
    for (const file of state.files) {
      if (file.hadOld) await rename(join(root, file.name), join(stage, 'old', file.name));
      if (await exists(join(stage, file.name)))
        await rename(join(stage, file.name), join(root, file.name));
    }
    await sync(join(stage, 'old'));
    await sync(stage);
    await sync(root);
    state.committed = true;
    const nextJournal = journal + '.next';
    await writeFile(nextJournal, JSON.stringify(state), { mode: 0o600 });
    await chown(nextJournal, owner.uid, owner.gid);
    await sync(nextJournal);
    await rename(nextJournal, journal);
    await sync(root);
    await recoverSQLiteRestore(databasePath);
    return report;
  } catch (error) {
    await recoverSQLiteRestore(databasePath);
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
}
