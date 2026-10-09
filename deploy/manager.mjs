import * as clack from '@clack/prompts';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, mkdir, mkdtemp, rm, lstat, rename, chown } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { setup, parseDeploymentEnv, quoteEnv } from '../scripts/setup.mjs';
import { prompt } from './terminal-ui.mjs';
import { formatRows, imageVersion, deploymentRows } from './presentation.mjs';
import { latestImage, isCurrentImage, obsoleteImages, imageRepository } from './registry.mjs';
import { latestManager, installManager } from './releases.mjs';
import { atomicFile } from './files.mjs';
import { packBackup } from './archive.mjs';
import { BACKUP_ARCHIVE_NAME } from '../apps/server/src/backup-archive.ts';
import { openDatabase } from '../apps/server/src/db.ts';
import {
  exportDatabase,
  digestFile,
  prepareBackupImport,
  rekeyBackup,
  auditBackupCredentials,
  restoreSQLite,
  refreshPackageManifest,
} from '../apps/server/src/database-backup.ts';
import { SCHEMA_VERSION } from '../apps/server/src/migrations.ts';
import { assertBackupVersion } from '../apps/server/src/version.ts';
import { restoreToPostgres } from '../apps/server/src/database-restore.ts';
import {
  inspectMediaCleanup,
  cleanupFingerprint,
  applyMediaCleanup,
} from '../apps/server/src/media-cleanup.ts';
import { checkDatabase } from '../apps/server/src/database-check.ts';

export function runCommand(args, { capture = false, cwd, env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, {
      cwd,
      env,
      stdio: ['inherit', capture ? 'pipe' : 'inherit', 'inherit'],
    });
    let out = '';
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (s) => {
      out += s;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(`Docker 操作失败（退出码 ${code}）`)),
    );
  });
}
export class Manager {
  constructor({
    directory,
    executable,
    version,
    source,
    templates = {},
    ui = clack,
    run = runCommand,
    request = fetch,
    log = console.log,
  }) {
    Object.assign(this, {
      directory: resolve(directory),
      executable,
      version,
      source,
      templates,
      ui,
      run,
      request,
      log,
    });
    this.config = {};
  }
  async reload() {
    try {
      this.config = parseDeploymentEnv(await readFile(join(this.directory, '.env'), 'utf8'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      this.config = {};
    }
    this.image = this.config.LOVE_IMAGE || imageRepository + ':latest';
    if (
      !new RegExp(
        '^' + imageRepository.replaceAll('.', '\\.') + '(?::[A-Za-z0-9_.-]+|@sha256:[a-f0-9]{64})$',
      ).test(this.image)
    )
      throw new Error('仅支持官方 GHCR 镜像');
    this.project = this.config.COMPOSE_PROJECT_NAME || 'love-v4';
    this.database = this.config.LOVE_DATABASE || 'sqlite';
    if (
      !/^[a-z0-9][a-z0-9_-]*$/.test(this.project) ||
      !['sqlite', 'postgres', 'external'].includes(this.database)
    )
      throw new Error('部署配置无效');
  }
  docker(args, capture = false) {
    return this.run(args, {
      capture,
      cwd: this.directory,
      env: { ...process.env, ...this.config, LOVE_IMAGE: this.image },
    });
  }
  composeArgs(args) {
    const files = ['compose.yml'];
    if (this.database === 'postgres') files.push('compose.postgres.yml');
    if (this.config.LOVE_DATA_VOLUME === 'postgres-work') files.push('compose.storage.yml');
    if (this.config.LOVE_HTTPS === '1' && this.config.LOVE_TLS_PROVIDER !== 'external') {
      if (!['caddy', 'certbot'].includes(this.config.LOVE_TLS_PROVIDER))
        throw new Error('HTTPS 配置无效');
      files.push('compose.https.yml');
      if (this.config.LOVE_TLS_PROVIDER === 'certbot') files.push('compose.certbot.yml');
    }
    return [
      'compose',
      '--project-name',
      this.project,
      '--env-file',
      join(this.directory, '.env'),
      ...files.flatMap((f) => ['-f', join(this.directory, f)]),
      ...(this.config.LOVE_HTTPS === '1' && this.config.LOVE_TLS_PROVIDER !== 'external'
        ? ['--profile', 'https']
        : []),
      ...args,
    ];
  }
  compose(args, capture = false) {
    return this.docker(this.composeArgs(args), capture);
  }
  ask(kind, message = '', placeholder = '') {
    return prompt({
      kind,
      directory: this.directory,
      message,
      placeholder,
      ui: this.ui,
      context: this.context,
    });
  }
  async confirm(message) {
    return (await this.ask('confirm', message)) === 'yes';
  }
  note(rows, title) {
    const content = formatRows(rows);
    if (this.ui.note) this.ui.note(content, title);
    else this.log(title + '\n' + content);
  }
  async deploymentContext() {
    const context = { version: this.version, latestVersion: this.latestVersion };
    if (!existsSync(join(this.directory, '.env'))) return context;
    try {
      const ids = (
        await this.docker(
          [
            'ps',
            '--all',
            '--quiet',
            '--no-trunc',
            '--filter',
            `label=com.docker.compose.project=${this.project}`,
            '--filter',
            'label=com.docker.compose.service=love',
            '--filter',
            'label=com.docker.compose.oneoff=False',
          ],
          true,
        )
      )
        .split(/\s+/)
        .filter(Boolean);
      if (!ids.length) return { ...context, appVersion: '尚未部署', status: '未启动' };
      const entries = JSON.parse(await this.docker(['container', 'inspect', ...ids], true));
      const image = await this.currentImage();
      context.appVersion = imageVersion(image);
      context.status = entries.some((c) => !c.State?.Running)
        ? '已停止'
        : entries.some((c) => c.State?.Health?.Status === 'unhealthy')
          ? '健康检查失败'
          : entries.some((c) => c.State?.Health?.Status === 'starting')
            ? '启动中'
            : '运行中';
    } catch {
      context.status = '无法读取 Docker 状态';
      context.appVersion = '尚未检查';
    }
    return context;
  }
  refresh() {
    if (process.stdout.isTTY && process.env.TERM !== 'dumb')
      process.stdout.write('\x1b[H\x1b[2J\x1b[3J');
  }
  async installTemplates(overwrite = false, templates = this.templates) {
    for (const [name, content] of Object.entries(templates)) {
      const path = join(this.directory, name);
      if (overwrite || !existsSync(path)) await atomicFile(path, content);
    }
  }
  async configure() {
    const initializing = !existsSync(join(this.directory, '.env'));
    await setup({ output: join(this.directory, '.env'), ui: this.ui, env: {} });
    await this.reload();
    await this.installTemplates(true);
    if (
      initializing &&
      this.database !== 'external' &&
      (await this.confirm('初始化时导入备份？仅支持低版本或同版本备份。'))
    ) {
      if (!(await this.restore({ initializing: true }))) return;
    }
    if (await this.confirm('立即应用配置并启动？')) await this.start();
  }
  async requireConfig() {
    if (!existsSync(join(this.directory, '.env'))) await this.configure();
    if (!existsSync(join(this.directory, '.env'))) throw new Error('请先完成部署配置');
  }
  async ensureImage() {
    try {
      await this.docker(['image', 'inspect', this.image], true);
    } catch {
      await this.docker(['pull', this.image]);
    }
  }
  async field(key, value) {
    this.config[key] = value;
    const content =
      '# Generated by ./love. Keep private.\n' +
      Object.entries(this.config)
        .map(([k, v]) => k + '=' + quoteEnv(v))
        .join('\n') +
      '\n';
    await atomicFile(join(this.directory, '.env'), content);
  }
  async start() {
    await this.requireConfig();
    await this.ensureImage();
    await this.installTemplates();
    await this.field('LOVE_IMAGE', this.image);
    if (this.config.LOVE_HTTPS !== '1' || this.config.LOVE_TLS_PROVIDER === 'external')
      await this.compose(['--profile', 'https', 'stop', 'proxy']).catch(() => {});
    await this.compose([
      'up',
      '-d',
      '--no-build',
      '--pull',
      'missing',
      '--remove-orphans',
      '--wait',
    ]);
  }
  async running() {
    const out = await this.docker(
      [
        'ps',
        '--quiet',
        '--no-trunc',
        '--filter',
        `label=com.docker.compose.project=${this.project}`,
        '--filter',
        'label=com.docker.compose.service=love',
        '--filter',
        'label=com.docker.compose.oneoff=False',
      ],
      true,
    );
    return out.split(/\s+/).filter(Boolean);
  }
  async paused(action) {
    await this.requireConfig();
    const running = await this.running();
    await this.compose(['stop', 'love']);
    try {
      return await action();
    } finally {
      if (running.length) await this.compose(['start', 'love']);
    }
  }
  async databaseLocation() {
    const resolved = JSON.parse(await this.compose(['config', '--format', 'json'], true));
    const mount = resolved.services.love.volumes.find((v) => v.target === '/app/data');
    if (!mount) throw new Error('没有找到应用数据卷');
    let root;
    if (mount.type === 'bind') root = mount.source;
    else {
      const name = resolved.volumes[mount.source]?.name || mount.source;
      const [volume] = JSON.parse(await this.docker(['volume', 'inspect', name], true));
      root = volume.Mountpoint;
    }
    if (!root || !existsSync(root))
      throw new Error('管理工具需要在 Docker 所在的 Linux 主机运行，并有数据卷读取权限');
    const owner = await lstat(root);
    if (!owner.isDirectory() || owner.isSymbolicLink()) throw new Error('数据卷路径无效');
    const directory = join(root, 'media');
    const created = !existsSync(directory);
    await mkdir(directory, { recursive: true });
    if (created) await chown(directory, owner.uid, owner.gid);
    const provider = this.database === 'sqlite' ? 'sqlite' : 'postgres';
    let path = join(root, 'love.sqlite');
    if (this.database === 'external') path = this.config.DATABASE_URL;
    if (this.database === 'postgres') {
      await this.compose(['up', '-d', '--no-build', '--wait', 'postgres']);
      const ids = (await this.compose(['ps', '--quiet', 'postgres'], true))
        .split(/\s+/)
        .filter(Boolean);
      if (ids.length !== 1) throw new Error('无法确定内置 PostgreSQL 容器');
      const [container] = JSON.parse(await this.docker(['container', 'inspect', ids[0]], true));
      const network = Object.entries(resolved.networks || {}).find(
        ([key]) => key === 'default',
      )?.[1]?.name;
      const networks = container.NetworkSettings.Networks;
      const host =
        networks[network]?.IPAddress || Object.values(networks).find((n) => n.IPAddress)?.IPAddress;
      if (!host) throw new Error('无法确定内置 PostgreSQL 的宿主机可达地址');
      const url = new URL('postgresql://localhost/' + encodeURIComponent(this.config.POSTGRES_DB));
      url.hostname = host;
      url.port = '5432';
      url.username = this.config.POSTGRES_USER;
      url.password = this.config.POSTGRES_PASSWORD;
      url.searchParams.set('sslmode', 'disable');
      path = url.href;
    }
    // Shared drivers read only timeout/retry deployment fields from the environment.
    for (const key of [
      'PG_CONNECTION_TIMEOUT_MS',
      'PG_QUERY_TIMEOUT_MS',
      'PG_RETRY_ATTEMPTS',
      'PG_RETRY_DELAY_MS',
    ])
      if (this.config[key]) process.env[key] = this.config[key];
      else delete process.env[key];
    return { root, directory, provider, path, uid: owner.uid, gid: owner.gid };
  }
  async databaseImageVersion() {
    await this.ensureImage();
    const [image] = JSON.parse(await this.docker(['image', 'inspect', this.image], true));
    const version = image.Config?.Labels?.['org.opencontainers.image.version'] || this.version;
    if (version !== this.version)
      throw new Error('应用镜像与管理程序版本不一致，请先完成更新再操作数据库');
    return version;
  }
  async withDatabase(action) {
    await this.databaseImageVersion();
    const location = await this.databaseLocation();
    const db = await openDatabase({ provider: location.provider, path: location.path });
    try {
      return await action(db, location);
    } finally {
      await db.close();
      if (location.provider === 'sqlite') await chown(location.path, location.uid, location.gid);
    }
  }
  async backup() {
    return this.paused(async () => {
      const parent = join(this.directory, 'backups');
      await mkdir(parent, { recursive: true, mode: 0o700 });
      const stage = await mkdtemp(join(parent, '.backup-'));
      try {
        const data = join(stage, 'data');
        await this.withDatabase(async (db, location) => {
          const report = await exportDatabase({
            db,
            sqlitePath: location.path,
            mediaDirectory: location.directory,
            directory: data,
          });
          const lost = auditBackupCredentials(
            join(data, 'love.sqlite'),
            this.config.MEDIA_SIGNING_SECRET || '',
          );
          if (lost.ai || lost.smtp)
            throw new Error(
              `备份中 ${lost.ai} 个 AI 密钥、${lost.smtp} 个 SMTP 密码无法解密，请先重新配置这些凭据`,
            );
          this.log(`已校验 ${report.tables.users} 个用户、${report.mediaFiles} 个媒体文件。`);
        });
        await packBackup(data, join(stage, BACKUP_ARCHIVE_NAME));
        await atomicFile(
          join(stage, 'deployment.env'),
          await readFile(join(this.directory, '.env')),
        );
        const sums = await Promise.all(
          ['deployment.env', BACKUP_ARCHIVE_NAME].map(
            async (n) => (await digestFile(join(stage, n))) + '  ' + n,
          ),
        );
        await atomicFile(join(stage, 'SHA256SUMS'), sums.join('\n') + '\n');
        await rm(data, { recursive: true, force: true });
        const name =
          new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d+Z$/, 'Z') +
          '-' +
          randomUUID().slice(0, 8);
        const destination = join(parent, name);
        await rename(stage, destination);
        this.log(`备份完成：${destination}（包含密码和密钥，请妥善保管）。`);
        return destination;
      } catch (e) {
        await rm(stage, { recursive: true, force: true });
        throw e;
      }
    });
  }
  async optionalBackup() {
    const policy = await this.ask('backup-policy');
    if (policy === 'backup') await this.backup();
    else if (policy === 'skip') this.log('已跳过操作前备份。');
    else throw new Error('PROMPT_CANCELLED');
  }
  async restore({ initializing = false } = {}) {
    await this.requireConfig();
    const name = await this.ask('backup');
    if (!name) return false;
    const source =
      name === 'manual'
        ? resolve(
            await this.ask(
              'text',
              '备份目录路径（包含 SHA256SUMS、deployment.env 和 data.tar.zst（旧备份为 data.tar.gz））',
            ),
          )
        : join(this.directory, 'backups', name);
    if (name !== 'manual' && !/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('备份目录无效');
    if (!(await lstat(source)).isDirectory() || (await lstat(source)).isSymbolicLink())
      throw new Error('备份目录无效');
    const temp = await mkdtemp(join(tmpdir(), 'love-restore-'));
    try {
      const original = await prepareBackupImport(source, temp),
        t = original.report.tables;
      const targetVersion = await this.databaseImageVersion();
      assertBackupVersion(
        original.applicationVersion,
        original.schemaVersion,
        targetVersion,
        SCHEMA_VERSION,
      );
      this.note(
        [
          ['备份版本', `应用 v${original.applicationVersion} / 数据库 ${original.schemaVersion}`],
          ['目标版本', `应用 v${targetVersion} / 数据库 ${SCHEMA_VERSION}`],
          [
            '备份格式',
            `${original.formatVersion} → ${original.targetFormatVersion}${original.formatVersion < original.targetFormatVersion ? '（自动转换）' : ''}`,
          ],
          ['账号与配对', `${t.users} 个用户 / ${t.couples} 对配对`],
          ['聊天消息', `${t.messages} 条`],
          ['媒体内容', `${t.media} 条记录 / ${original.report.mediaFiles} 个文件`],
          ['纪念日', `${t.anniversaries} 个`],
          ['To Do', `${t.todos} 个`],
          ['其他内容', '头像与业务设置随数据恢复'],
          ['部署配置', '保留当前设置'],
        ],
        '恢复预览',
      );
      const backupConfig = parseDeploymentEnv(
        await readFile(join(source, 'deployment.env'), 'utf8'),
      );
      const lost = auditBackupCredentials(
        join(temp, 'love.sqlite'),
        backupConfig.MEDIA_SIGNING_SECRET || '',
      );
      let reset = false;
      if (lost.ai || lost.smtp) {
        this.note(
          [
            ['AI 密钥', `${lost.ai} 个无法解密`],
            ['SMTP 密码', `${lost.smtp} 个无法解密`],
            ['其他数据', '可以恢复'],
          ],
          '加密凭据',
        );
        if ((await this.ask('recovery-policy')) !== 'recover') return;
        reset = true;
      }
      if (
        (await this.ask('text', '导入备份，保留当前部署配置。输入 RESTORE 确认', 'RESTORE')) !==
        'RESTORE'
      )
        return;
      if (!initializing) await this.optionalBackup();
      else {
        if (this.database === 'postgres') await this.compose(['up', '-d', '--wait', 'postgres']);
        await this.compose(['create', '--no-build', 'love']);
      }
      await this.paused(async () => {
        const location = await this.databaseLocation();
        rekeyBackup(
          join(temp, 'love.sqlite'),
          backupConfig.MEDIA_SIGNING_SECRET || '',
          this.config.MEDIA_SIGNING_SECRET || '',
          { resetUnreadable: reset },
        );
        await refreshPackageManifest(temp, original.provider);
        if (location.provider === 'postgres')
          await this.withDatabase((db) =>
            restoreToPostgres({
              sourcePath: join(temp, 'love.sqlite'),
              mediaDirectory: join(temp, 'media'),
              target: db,
              progress: this.log,
            }),
          );
        else await restoreSQLite(temp, location.path);
        this.log('恢复完成，部署配置保持当前值。');
      });
      return true;
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }
  async check() {
    const mode = await this.ask('check-mode');
    if (mode === 'cancel') return;
    await this.paused(() =>
      this.withDatabase(async (db, location) => {
        const report = await db.transaction(
          () => checkDatabase(db, location.directory, mode === 'deep', this.log),
          { snapshot: true },
        );
        if (report.issues.length) throw new Error('一致性检查发现异常，请根据上面结果处理');
      }),
    );
  }
  async cleanup() {
    if (
      !(await this.confirm(
        '暂停写入并预览未使用媒体？保护回忆、聊天和头像；所有未发布上传均纳入清理。',
      ))
    )
      return;
    await this.optionalBackup();
    await this.paused(() =>
      this.withDatabase(async (db, location) => {
        const plan = await inspectMediaCleanup(db, location.directory),
          review = cleanupFingerprint(plan);
        this.note(
          [
            ['未使用媒体', `${plan.media.length} 条`],
            ['未发布上传', `${plan.uploads.length} 条`],
            [
              '磁盘文件',
              `${plan.files.length} 个 / ${(plan.files.reduce((n, r) => n + r.bytes, 0) / 1048576).toFixed(1)} MiB`,
            ],
            ['数据库暂存', `${plan.staging.length} 个文件`],
            ['保护内容', '聊天、回忆、个人头像和 AI 头像'],
          ],
          '清理预览',
        );
        for (const row of [...plan.media, ...plan.uploads])
          this.log(
            `  ${row.id} · ${row.kind} · ${(row.bytes / 1048576).toFixed(1)} MiB · ${row.names.join(', ')}`,
          );
        if (!(await this.confirm('永久删除以上未使用媒体及临时文件？既有备份不变。'))) return;
        const result = await applyMediaCleanup(db, location.directory, plan, review);
        this.log(
          `已清理 ${result.media} 条媒体、${result.uploads} 条草稿、${result.files} 个磁盘文件、${result.staging} 个数据库暂存文件。`,
        );
        if (db.provider === 'postgres')
          this.log('PostgreSQL 删除的空间可复用，数据库文件体积不会立即缩小。');
      }),
    );
  }
  async currentImage() {
    const ids = (await this.compose(['ps', '--all', '--quiet', 'love'], true))
      .split(/\s+/)
      .filter(Boolean);
    let local;
    for (const id of ids) {
      const [container] = JSON.parse(await this.docker(['container', 'inspect', id], true));
      let image;
      try {
        [image] = JSON.parse(await this.docker(['image', 'inspect', container.Image], true));
      } catch {
        [image] = JSON.parse(await this.docker(['image', 'inspect', container.Config.Image], true));
      }
      if (local && local.Id !== image.Id) throw new Error('多个应用实例使用不同镜像，请先检查状态');
      local = image;
    }
    if (!local) [local] = JSON.parse(await this.docker(['image', 'inspect', this.image], true));
    return local;
  }
  async pruneOldImages(current) {
    // Docker allows removing a tag even while another container uses that image.
    // Preserve references as well as layers for all deployments, including stopped ones.
    const containers = (await this.docker(['ps', '--all', '--quiet', '--no-trunc'], true))
      .split(/\s+/)
      .filter(Boolean);
    const used = new Set([current.Id]);
    let entries = [];
    if (containers.length) {
      try {
        entries = JSON.parse(await this.docker(['container', 'inspect', ...containers], true));
      } catch {
        this.log('无法确认其他容器使用的镜像，本次跳过旧镜像清理。');
        return 0;
      }
      for (const container of entries) used.add(container.Image);
    }
    const own = entries.filter(
      (container) =>
        container.Config?.Labels?.['com.docker.compose.project'] === this.project &&
        container.Config?.Labels?.['com.docker.compose.service'] === 'love' &&
        container.Config?.Labels?.['com.docker.compose.oneoff'] === 'False',
    );
    if (
      !own.length ||
      own.some(
        (container) => !container.State?.Running || container.State?.Health?.Status !== 'healthy',
      )
    ) {
      this.log('应用尚未通过健康检查，本次跳过旧镜像清理；请查看日志并重新启动。');
      return 0;
    }
    const ids = [
      ...new Set(
        (await this.docker(['image', 'ls', '--all', '--quiet', '--no-trunc'], true))
          .split(/\s+/)
          .filter(Boolean),
      ),
    ];
    let removed = 0;
    for (const id of ids) {
      const [entry] = JSON.parse(await this.docker(['image', 'inspect', id], true));
      if (used.has(entry.Id) || !obsoleteImages([entry], current).length) continue;
      const references = [...(entry.RepoTags || []), ...(entry.RepoDigests || [])].filter(
        (r) => r.startsWith(imageRepository + ':') || r.startsWith(imageRepository + '@'),
      );
      for (const ref of references) await this.docker(['image', 'rm', ref]).catch(() => {});
      // No force: another deployment using the old image protects it from deletion.
      try {
        await this.docker(['image', 'rm', id]);
        removed++;
      } catch {
        /* Already removed or in use. */
      }
    }
    await rm(join(this.directory, '.love-rollback'), { force: true });
    this.log(`旧 Love 镜像清理完成（仅清理本项目，使用中的镜像会保留）。`);
    return removed;
  }
  async update() {
    await this.requireConfig();
    const progress = this.ui.spinner?.();
    progress?.start('正在检查 GitHub Release 与 GHCR…');
    let local, remote, release;
    try {
      local = await this.currentImage();
      [remote, release] = await Promise.all([
        latestImage({
          request: this.request,
          arch: local.Architecture === 'amd64' ? 'x64' : local.Architecture || process.arch,
        }),
        latestManager({ request: this.request }),
      ]);
      progress?.stop('版本检查完成');
    } catch (error) {
      progress?.stop('版本检查未完成');
      throw error;
    }
    this.latestVersion = release.version;
    const imageChanged = !isCurrentImage(local, remote),
      managerChanged = release.version !== this.version;
    this.note(
      [
        [
          '应用',
          `${imageVersion(local)} → ${remote.version ? 'v' + remote.version : '最新构建'} · ${imageChanged ? '可更新' : '已是最新'}`,
        ],
        [
          '管理程序',
          `v${this.version} → v${release.version} · ${managerChanged ? '可更新' : '已是最新'}`,
        ],
        ['更新来源', 'GHCR 镜像 / GitHub Release'],
      ],
      '版本对比',
    );
    if (remote.version && remote.version !== release.version) {
      this.log('镜像与管理工具的新版本仍在发布同步中，请稍后重新检查。当前应用未修改。');
      return;
    }
    if (!imageChanged && !managerChanged) {
      this.log('应用和管理工具均为最新版本，无需更新。');
      await this.pruneOldImages(local);
      return;
    }
    if (!(await this.confirm(`更新至 v${release.version}？健康检查通过后清理旧镜像。`))) return;
    await this.optionalBackup();
    if (imageChanged) {
      let downloaded = false;
      try {
        await this.docker(['pull', remote.image]);
        downloaded = true;
        this.image = remote.image;
        await this.installTemplates(true, release.templates);
        await this.field('LOVE_IMAGE', this.image);
        await this.start();
        if (this.config.LOVE_HTTPS === '1' && this.config.LOVE_TLS_PROVIDER !== 'external')
          await this.compose(['restart', 'proxy']);
      } catch (error) {
        throw new Error(
          (downloaded
            ? '新版本应用未成功启动；不自动回滚，请查看日志并修正配置后重新启动。'
            : '镜像下载失败，原应用未停止或重建。') +
            ' 数据和备份保留：' +
            error.message,
        );
      }
    }
    if (managerChanged) {
      const progress = this.ui.spinner?.();
      progress?.start('正在下载独立管理程序…');
      try {
        await installManager(release, this.executable, {
          request: this.request,
          onProgress: (bytes) =>
            progress?.message(
              `正在下载管理程序：${(bytes / 1048576).toFixed(1)} MiB${release.bytes ? ' / ' + (release.bytes / 1048576).toFixed(1) + ' MiB' : ''}`,
            ),
        });
        progress?.stop('管理程序已校验并更新');
      } catch (error) {
        progress?.stop('管理程序下载未完成，原程序保留');
        throw error;
      }
      this.needsReload = true;
    }
    const current = await this.currentImage();
    await this.pruneOldImages(current);
    this.log('更新完成。');
  }
  async uninstall() {
    await this.requireConfig();
    const mode = await this.ask('uninstall', this.project);
    if (mode === 'containers' && (await this.confirm('移除当前部署容器，保留数据？')))
      await this.compose(['--profile', 'https', 'down', '--remove-orphans']);
    if (
      mode === 'volumes' &&
      (await this.ask(
        'text',
        '仅删除当前部署的数据卷，备份保留。输入确认文字',
        'DELETE-' + this.project,
      )) ===
        'DELETE-' + this.project
    )
      await this.compose(['--profile', 'https', 'down', '--volumes', '--remove-orphans']);
  }
  async action(choice) {
    if (choice === 'configure') return this.configure();
    if (choice === 'start') return this.start();
    if (choice === 'update') return this.update();
    if (choice === 'database') return this.databaseMenu();
    if (choice === 'uninstall') return this.uninstall();
    await this.requireConfig();
    if (choice === 'stop') return this.compose(['--profile', 'https', 'stop']);
    if (choice === 'restart') return this.compose(['restart']);
    if (choice === 'logs') return this.compose(['logs', '--tail', '200']);
    if (choice === 'status') {
      this.context = await this.deploymentContext();
      this.note(deploymentRows(this.config, this.context), '部署状态');
      this.note(
        [
          ['部署目录', this.directory],
          ['源码版本', this.source.slice(0, 12)],
          ['镜像地址', this.image],
        ],
        '部署详情',
      );
      return;
    }
    throw new Error('未知管理操作');
  }
  async operation(action, back = '') {
    try {
      await action();
    } catch (e) {
      if (!['PROMPT_CANCELLED', 'SETUP_CANCELLED'].includes(e.message))
        this.ui.log.error(
          /postgres(?:ql)?:\/\//i.test(e.message)
            ? '数据库连接或操作失败，请检查连接配置'
            : e.message,
        );
    }
    await this.ask('continue', back);
  }
  async databaseMenu() {
    while (true) {
      this.refresh();
      const choice = await this.ask('database-menu');
      if (choice === 'back') return;
      this.refresh();
      await this.operation(
        () =>
          ({
            check: () => this.check(),
            backup: () => this.backup(),
            restore: () => this.restore(),
            cleanup: () => this.cleanup(),
          })[choice](),
        '返回数据库管理',
      );
    }
  }
  async main() {
    await this.reload();
    await this.installTemplates();
    while (true) {
      await this.reload();
      this.refresh();
      this.context = await this.deploymentContext();
      const choice = await this.ask('menu');
      if (choice === 'exit') return;
      if (choice === 'refresh') continue;
      this.refresh();
      if (choice === 'database') {
        try {
          await this.databaseMenu();
        } catch (e) {
          if (e.message !== 'PROMPT_CANCELLED') throw e;
        }
      } else {
        const labels = {
          configure: '部署配置',
          start: '启动应用',
          stop: '停止应用',
          restart: '重启应用',
          status: '部署状态',
          logs: '应用日志',
          update: '检查更新',
          uninstall: '卸载应用',
        };
        this.ui.intro('LOVE · ' + labels[choice]);
        await this.operation(() => this.action(choice));
      }
      if (this.needsReload) return 'reload';
    }
  }
}
