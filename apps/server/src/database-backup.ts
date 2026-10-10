import { DatabaseSync, backup, type SQLInputValue } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { createWriteStream, constants } from 'node:fs';
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
import { openDatabase, type DB } from './db.js';
import { SCHEMA_VERSION } from './migrations.js';
import { APPLICATION_VERSION } from './version.js';
import { transferTables, restoreToPostgres, type TransferReport } from './database-restore.js';
import { MediaRepository } from './media-repository.js';
import { withSQLiteSnapshot } from './sqlite-snapshot.js';
import { seal, unseal } from './mail.js';
import { digestFile } from './backup-archive.js';
import {
  normalizeBackupPackage,
  importBackupPackage,
  refreshBackupPackage,
  backupPaths,
  type BackupRegistry,
  backupRegistry,
} from './backup-package.js';
export { extractCurrentBackup as extractBackup } from './backup-archive.js';
export { digestFile } from './backup-archive.js';

const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
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
      const cleaned = new DatabaseSync(output);
      try {
        cleaned.exec('DELETE FROM media_uploads');
      } finally {
        cleaned.close();
      }
    });
  } else {
    const source = db!;
    const initialized = await openDatabase(output);
    await initialized.close();
    const sqlite = new DatabaseSync(output);
    try {
      sqlite.exec('PRAGMA foreign_keys=ON; BEGIN; PRAGMA defer_foreign_keys=ON;');
      await source.transaction(
        async () => {
          for (const row of sqlite
            .prepare(
              "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('media_uploads','schema_migrations') ORDER BY name",
            )
            .all()) {
            const table = String(row.name);
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
          for (const identity of sqlite
            .prepare(
              "SELECT name FROM sqlite_schema WHERE type='table' AND sql LIKE '%AUTOINCREMENT%'",
            )
            .all()) {
            const name = String(identity.name);
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
  return refreshPackageManifest(directory, provider);
}

export async function refreshPackageManifest(
  directory: string,
  provider: 'sqlite' | 'postgres',
  registry = backupRegistry,
) {
  return refreshBackupPackage(
    directory,
    {
      format: 'love-backup',
      applicationVersion: APPLICATION_VERSION,
      schemaVersion: SCHEMA_VERSION,
      provider,
      createdAt: new Date().toISOString(),
    },
    registry,
  );
}
export async function validatePackage(
  directory: string,
  {
    upgradeSchema = true,
    registry = backupRegistry,
  }: { upgradeSchema?: boolean; registry?: BackupRegistry } = {},
) {
  const source = await normalizeBackupPackage(directory, registry);
  if (upgradeSchema && source.schemaVersion < SCHEMA_VERSION) {
    const upgraded = await openDatabase(source.paths.database);
    await upgraded.close();
    source.report = await refreshPackageManifest(directory, source.provider, registry);
  }
  return source;
}
export async function prepareBackupImport(
  sourceDirectory: string,
  directory: string,
  registry = backupRegistry,
) {
  const original = await importBackupPackage(sourceDirectory, directory, registry);
  const current = await validatePackage(directory, { registry });
  return {
    ...current,
    formatVersion: original.formatVersion,
    schemaVersion: original.schemaVersion,
    applicationVersion: original.applicationVersion,
  };
}

function backupKeys(sqlite: DatabaseSync, sourceSecret: string) {
  const stored = sqlite.prepare("SELECT value FROM server_config WHERE key='mediaSecret'").get();
  return [...new Set([sourceSecret, stored?.value])].filter(
    (key): key is string => typeof key === 'string' && key.length > 0,
  );
}
function decryptCredential(ciphertext: string, candidates: string[]) {
  for (const key of candidates) {
    try {
      return { key, plaintext: unseal(ciphertext, key) };
    } catch {
      /* Try only keys carried by the backup. */
    }
  }
  return undefined;
}
export function auditBackupCredentials(path: string, sourceSecret: string) {
  const sqlite = new DatabaseSync(path, { readOnly: true });
  try {
    const candidates = backupKeys(sqlite, sourceSecret);
    let ai = 0,
      smtp = 0;
    for (const row of sqlite
      .prepare("SELECT secret FROM couple_ai_settings WHERE secret<>''")
      .iterate())
      if (!decryptCredential(String(row.secret), candidates)) ai++;
    const config = sqlite.prepare("SELECT value FROM server_config WHERE key='control'").get();
    const value = config ? JSON.parse(String(config.value)) : undefined;
    if (value?.smtp?.password && !decryptCredential(value.smtp.password, candidates)) smtp++;
    return { ai, smtp };
  } finally {
    sqlite.close();
  }
}

// Re-encrypt private credentials in the scratch copy so current .env stays byte-for-byte intact.
export function rekeyBackup(
  path: string,
  sourceSecret: string,
  targetSecret: string,
  options: { resetUnreadable?: boolean } = {},
) {
  if (!targetSecret) throw new Error('当前部署缺少媒体密钥');
  const sqlite = new DatabaseSync(path);
  try {
    const candidates = backupKeys(sqlite, sourceSecret);
    // Older deployments may have encrypted credentials with the database-generated
    // key before MEDIA_SIGNING_SECRET was configured. Accept a candidate only after
    // AES-GCM authentication; never guess a key or discard encrypted credentials.
    let changedKey = sourceSecret !== targetSecret;
    const reset = { ai: 0, smtp: 0 };
    const reseal = (ciphertext: string, label: string) => {
      const decrypted = decryptCredential(ciphertext, candidates);
      if (decrypted) {
        if (decrypted.key === targetSecret) return ciphertext;
        changedKey = true;
        return seal(decrypted.plaintext, targetSecret);
      }
      if (options.resetUnreadable) {
        reset[label === 'AI 密钥' ? 'ai' : 'smtp']++;
        changedKey = true;
        return '';
      }
      throw new Error(
        `备份中的${label}无法解密：备份配置及备份数据库内保存的旧密钥均无法验证。` +
          '备份未包含加密这些凭据时的正确密钥；当前数据未修改。',
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
    return reset;
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
  const { report, paths } = await validatePackage(directory);
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
    const db = new DatabaseSync(paths.database, { readOnly: true });
    try {
      await backup(db, join(stage, basename(databasePath)));
    } finally {
      db.close();
    }
    await mkdir(join(stage, 'media'), { mode: 0o700 });
    const source = new DatabaseSync(paths.database, { readOnly: true });
    try {
      for (const row of source.prepare('SELECT original,preview,thumbnail FROM media').iterate())
        for (const name of new Set(
          [row.original, row.preview, row.thumbnail].filter(Boolean).map(String),
        ))
          await copyFile(
            join(paths.media, name),
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
