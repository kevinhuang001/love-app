import { mkdtemp, rm, readFile, stat, lstat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { parseEnv } from 'node:util';
import { openDatabase } from './db.js';
import { MediaRepository } from './media-repository.js';
import {
  exportDatabase,
  extractBackup,
  validatePackage,
  digestFile,
  rekeyBackup,
  auditBackupCredentials,
  restoreSQLite,
} from './database-backup.js';
import { restoreToPostgres } from './database-restore.js';

const arguments_ = process.argv.slice(2),
  operation = arguments_[0];
const argument = (name: string) => {
  const i = arguments_.indexOf(name);
  if (i < 0 || !arguments_[i + 1]) throw new Error(`缺少参数 ${name}`);
  return arguments_[i + 1];
};
const provider =
  process.env.DATABASE_PROVIDER === 'postgres' ||
  /^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL || '')
    ? 'postgres'
    : 'sqlite';
const sourcePath = process.env.DATABASE_PATH || '/app/data/love.sqlite';
const mediaDirectory = process.env.UPLOADS_PATH || '/app/data/media';
const privateLog = (message: string) => console.error(message);
function parseDeploymentEnv(text: string) {
  const config: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const quoted = line.match(/^([A-Za-z_][A-Za-z0-9_]*)='((?:\\'|[^'])*)'\s*$/);
    if (quoted) config[quoted[1]] = quoted[2].replaceAll("\\'", "'");
    else Object.assign(config, parseEnv(line));
  }
  return config;
}
async function verifyDirectory(directory: string) {
  const listed = new Set<string>();
  const lines = (await readFile(join(directory, 'SHA256SUMS'), 'utf8')).trim().split('\n');
  for (const line of lines) {
    const match = line.match(
      /^([a-f0-9]{64}) [ *](deployment\.env|data\.tar\.gz|database\.dump|postgres-migration\.json)$/,
    );
    if (!match || listed.has(match[2])) throw new Error('备份校验清单无效');
    listed.add(match[2]);
    if (
      !(await lstat(join(directory, match[2]))).isFile() ||
      (await digestFile(join(directory, match[2]))) !== match[1]
    )
      throw new Error(`备份校验失败：${match[2]}`);
  }
  if (!listed.has('deployment.env') || !listed.has('data.tar.gz'))
    throw new Error('备份校验清单不完整');
  if (
    await stat(join(directory, 'database.dump')).then(
      () => true,
      (e) => {
        if (e.code === 'ENOENT') return false;
        throw e;
      },
    )
  ) {
    if (!listed.has('database.dump')) throw new Error('数据库备份未纳入校验');
    const { open } = await import('node:fs/promises');
    const handle = await open(join(directory, 'database.dump'), 'r');
    try {
      const header = Buffer.alloc(5);
      await handle.read(header, 0, 5, 0);
      if (header.toString() !== 'PGDMP') throw new Error('不支持的 PostgreSQL 备份格式');
    } finally {
      await handle.close();
    }
    return 'legacy-postgres';
  }
  return 'portable';
}
let db;
const scratch = await mkdtemp(join(tmpdir(), 'love-backup-'));
try {
  if (operation === 'backup') {
    const output = join(scratch, 'data');
    if (provider === 'postgres')
      db = await openDatabase({ path: process.env.DATABASE_URL || '', provider });
    else if (
      !(await stat(sourcePath).then(
        () => true,
        (e) => {
          if (e.code === 'ENOENT') return false;
          throw e;
        },
      ))
    ) {
      // A newly configured deployment can be backed up before its first application start.
      const empty = await openDatabase(join(scratch, 'empty.sqlite'));
      await empty.close();
    }
    const report = await exportDatabase({
      db,
      sqlitePath: await stat(sourcePath).then(
        () => sourcePath,
        (e) => {
          if (e.code === 'ENOENT') return join(scratch, 'empty.sqlite');
          throw e;
        },
      ),
      mediaDirectory,
      directory: output,
    });
    const credentials = auditBackupCredentials(
      join(output, 'love.sqlite'),
      process.env.MEDIA_SIGNING_SECRET || '',
    );
    if (credentials.ai || credentials.smtp)
      throw new Error(
        `备份校验失败：${credentials.ai} 个 AI 密钥、${credentials.smtp} 个 SMTP 密码无法使用备份密钥解密。未生成完整备份；请修复或重新配置这些凭据后再备份。`,
      );
    privateLog(`已校验 ${report.tables.users} 个用户、${report.mediaFiles} 个媒体文件。`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        'tar',
        ['-C', output, '-czf', '-', 'manifest.json', 'love.sqlite', 'media'],
        { stdio: ['ignore', 'inherit', 'inherit'] },
      );
      child.once('error', reject);
      child.once('exit', (code) => (code === 0 ? resolve() : reject(new Error('备份打包失败'))));
    });
  } else if (operation === 'legacy-export') {
    const directory = argument('--directory');
    await verifyDirectory(directory);
    const legacy = join(scratch, 'legacy');
    await extractBackup(join(directory, 'data.tar.gz'), legacy).catch(async (error) => {
      // PostgreSQL volumes need not contain a SQLite file. The extractor still checked every path.
      if (error.message !== '备份不包含 SQLite 数据快照') throw error;
    });
    db = await openDatabase({ path: process.env.DATABASE_URL || '', provider: 'postgres' });
    await mkdir(join(legacy, 'media'), { recursive: true });
    await new MediaRepository(db, join(legacy, 'media')).migrate();
    const output = join(scratch, 'data');
    await exportDatabase({ db, mediaDirectory: join(legacy, 'media'), directory: output });
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        'tar',
        ['-C', output, '-czf', '-', 'manifest.json', 'love.sqlite', 'media'],
        { stdio: ['ignore', 'inherit', 'inherit'] },
      );
      child.once('error', reject);
      child.once('exit', (code) => (code === 0 ? resolve() : reject(new Error('备份打包失败'))));
    });
  } else if (operation === 'inspect' || operation === 'restore') {
    const directory = argument('--directory');
    const format = await verifyDirectory(directory);
    if (format === 'legacy-postgres') {
      if (operation === 'restore') throw new Error('请先将旧 PostgreSQL 备份转换为统一数据包');
      console.log(format);
    } else {
      const packageDirectory = join(scratch, 'data');
      await extractBackup(join(directory, 'data.tar.gz'), packageDirectory);
      const source = await validatePackage(packageDirectory);
      const config = parseDeploymentEnv(await readFile(join(directory, 'deployment.env'), 'utf8'));
      if (operation === 'inspect') {
        console.log(source.provider);
        const tables = source.report.tables;
        privateLog(
          `可恢复：${tables.users} 个用户、${tables.couples} 对配对、${tables.messages} 条消息、${tables.media} 条媒体记录（${source.report.mediaFiles} 个文件）、${tables.anniversaries} 个纪念日、${tables.todos} 个 To Do。`,
        );
        privateLog(
          '头像、AI 名称与设置、邀请码、容量限额及其他业务设置随数据恢复；部署配置保持当前值。待验证邮件和验证码可能需要重新申请。',
        );
        const credentials = auditBackupCredentials(
          join(packageDirectory, 'love.sqlite'),
          config.MEDIA_SIGNING_SECRET,
        );
        if (credentials.ai || credentials.smtp) {
          privateLog(
            `无法恢复：${credentials.ai} 个 AI 密钥、${credentials.smtp} 个 SMTP 密码（备份未包含正确解密密钥）。其他数据与可解密的凭据均可恢复。`,
          );
          process.exitCode = 2;
        } else privateLog('加密凭据验证通过，可完整恢复。');
      } else {
        const reset = rekeyBackup(
          join(packageDirectory, 'love.sqlite'),
          config.MEDIA_SIGNING_SECRET,
          process.env.MEDIA_SIGNING_SECRET || '',
          { resetUnreadable: arguments_.includes('--reset-unreadable-credentials') },
        );
        // The original manifest was verified above; the private snapshot may now contain rekeyed credentials.
        await rm(join(packageDirectory, 'manifest.json'), { force: true });
        privateLog(`自动恢复：${source.provider} → ${provider}；保留当前部署配置。`);
        let report;
        if (provider === 'postgres') {
          db = await openDatabase({ path: process.env.DATABASE_URL || '', provider });
          report = await restoreToPostgres({
            sourcePath: join(packageDirectory, 'love.sqlite'),
            mediaDirectory: join(packageDirectory, 'media'),
            target: db,
            progress: privateLog,
          });
        } else report = await restoreSQLite(packageDirectory, sourcePath);
        privateLog(
          `恢复校验通过：${report.tables.users} 个用户、${report.tables.couples} 对配对、${report.mediaFiles} 个媒体文件。`,
        );
        if (reset.ai || reset.smtp)
          privateLog(
            `按确认重置了 ${reset.ai} 个无法解密的 AI 密钥、${reset.smtp} 个 SMTP 密码，请在设置中重新填写；其他内容已恢复。`,
          );
      }
    }
  } else throw new Error('未知的备份操作');
} catch (error) {
  const message =
    error instanceof Error && !/postgres(?:ql)?:\/\//i.test(error.message)
      ? error.message
      : '数据库连接或备份恢复失败';
  console.error(message);
  process.exitCode = 1;
} finally {
  await db?.close();
  await rm(scratch, { recursive: true, force: true });
}
