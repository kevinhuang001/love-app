// Internal management helper. Users select migration in ./love; no host Node.js needed.
import * as prompts from '@clack/prompts';
import { readFile, writeFile } from 'node:fs/promises';
import { parseDeploymentEnv, quoteEnv, validateConfig } from './setup.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function prepareMigration({ source, output, ui = prompts }) {
  const config = parseDeploymentEnv(await readFile(source, 'utf8'));
  if (config.LOVE_DATABASE !== 'sqlite') throw new Error('只支持从当前 SQLite 部署迁移');
  const ask = async (operation) => {
    const value = await operation;
    if (ui.isCancel(value)) throw new Error('MIGRATION_CANCELLED');
    return value;
  };
  const text = (message, value) =>
    ask(
      ui.text({
        message,
        defaultValue: value,
        placeholder: value,
        validate: (input) =>
          /^[a-z][a-z0-9_]{0,30}$/.test(input || value)
            ? undefined
            : '使用小写字母、数字和下划线，以字母开头',
      }),
    );
  ui.intro('SQLite → PostgreSQL');
  ui.note(
    '迁移全部账号、配对、聊天、日期、设置和媒体。保留原 SQLite 和媒体卷；目标库必须没有用户数据。已有目标管理员和初始设置会替换为源数据库内容。迁移期间暂停应用。',
    '迁移说明',
  );
  config.LOVE_DATABASE = await ask(
    ui.select({
      message: '选择目标 PostgreSQL',
      initialValue: 'postgres',
      options: [
        { value: 'postgres', label: 'Compose 内置 PostgreSQL' },
        { value: 'external', label: '外部 PostgreSQL' },
      ],
    }),
  );
  config.DATABASE_PROVIDER = 'postgres';
  config.DATABASE_URL = '';
  config.LOVE_DATA_VOLUME =
    config.LOVE_DATA_VOLUME === 'postgres-work' ? 'love-data' : 'postgres-work';
  if (config.LOVE_DATABASE === 'postgres') {
    config.POSTGRES_DB = await text('数据库名称', config.POSTGRES_DB || 'love');
    config.POSTGRES_USER = await text('数据库用户', config.POSTGRES_USER || 'love');
    config.POSTGRES_PASSWORD =
      (await ask(
        ui.password({
          message: '数据库密码（回车保留已配置密码）',
          validate: (value) => (value || config.POSTGRES_PASSWORD ? undefined : '填写数据库密码'),
        }),
      )) || config.POSTGRES_PASSWORD;
  } else {
    config.DATABASE_URL = await ask(
      ui.password({
        message: '外部 PostgreSQL 连接 URL',
        validate: (value) => {
          try {
            const url = new URL(value);
            return ['postgres:', 'postgresql:'].includes(url.protocol) &&
              url.hostname &&
              url.pathname.length > 1
              ? undefined
              : '填写完整 PostgreSQL 连接 URL';
          } catch {
            return '填写有效 PostgreSQL 连接 URL';
          }
        },
      }),
    );
  }
  validateConfig(config);
  const confirm = await ask(
    ui.text({
      message: '自动备份后暂停服务并迁移。输入 MIGRATE 继续',
      validate: (value) => (value === 'MIGRATE' ? undefined : '输入 MIGRATE 确认，Ctrl+C 取消'),
    }),
  );
  if (confirm !== 'MIGRATE') throw new Error('MIGRATION_CANCELLED');
  await writeFile(
    output,
    '# PostgreSQL migration target; original .env is unchanged.\n' +
      Object.entries(config)
        .map(([key, value]) => `${key}=${quoteEnv(value)}`)
        .join('\n') +
      '\n',
    { mode: 0o600 },
  );
  ui.outro('目标配置已暂存。核对成功后才替换 .env；密码与媒体密钥不会显示在日志中。');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (!process.stdin.isTTY || !process.stdout.isTTY)
      throw new Error('请通过 ./love 的迁移菜单操作');
    await prepareMigration({ source: process.argv[2], output: process.argv[3] });
  } catch (error) {
    if (error.message === 'MIGRATION_CANCELLED') prompts.cancel('已取消，原配置和数据未改动');
    else console.error('迁移配置未保存，请检查数据库选择和配置。');
    process.exitCode = error.message === 'MIGRATION_CANCELLED' ? 130 : 1;
  }
}
