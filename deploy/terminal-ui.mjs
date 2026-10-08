// Prompt rendering stays in a short-lived container; Docker operations stay on the host.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(
  existsSync('/app/package.json')
    ? '/app/package.json'
    : new URL('../package.json', import.meta.url),
);
const clack = await import(pathToFileURL(require.resolve('@clack/prompts')).href);
export const menuOptions = [
  { value: 'configure', label: '部署配置', hint: '初次配置或修改 IP、端口、数据库、HTTPS' },
  { value: 'start', label: '启动应用', hint: '下载已构建镜像并应用部署配置' },
  { value: 'stop', label: '停止应用' },
  { value: 'restart', label: '重启应用' },
  { value: 'status', label: '状态与版本' },
  { value: 'logs', label: '查看日志', hint: '显示最近 200 条' },
  { value: 'update', label: '更新软件及管理工具', hint: '先备份，再下载和更新' },
  { value: 'backup', label: '备份数据与配置' },
  { value: 'restore', label: '恢复备份', hint: '恢复前保存当前状态' },
  { value: 'manage', label: '服务器管理', hint: '账号、邀请码、注册、SMTP 与容量' },
  { value: 'source', label: '镜像来源', hint: '公开 Release、GHCR 或自定义仓库' },
  { value: 'uninstall', label: '卸载应用', hint: '默认保留数据和备份' },
  { value: 'rollback', label: '回滚上次更新', hint: '恢复镜像，保留当前数据' },
  { value: 'exit', label: '退出' },
];
export async function prompt({
  kind,
  directory,
  message = '',
  placeholder = '',
  ui = clack,
  env = process.env,
}) {
  const ask = async (operation) => {
    const result = await operation;
    if (ui.isCancel(result)) throw new Error('PROMPT_CANCELLED');
    return result;
  };
  const select = (options) =>
    ui.select({
      ...options,
      message: options.message + '（↑/↓ 选择 · 回车确认）',
      showInstructions: false,
    });
  if (kind === 'menu') {
    let summary = '尚未配置 · 选择“部署配置”开始';
    try {
      const content = await readFile(resolve(directory, '.env'), 'utf8');
      const setting = (key) =>
        content.match(new RegExp(`^${key}=['"]?([a-zA-Z0-9_./:@-]*)['"]?$`, 'm'))?.[1];
      summary = `${setting('COMPOSE_PROJECT_NAME') || 'love-v4'} · ${setting('LOVE_DATABASE') || 'sqlite'} · ${setting('LOVE_HTTPS') === '1' ? 'HTTPS' : 'HTTP'}\n镜像：${env.LOVE_UI_IMAGE || setting('LOVE_IMAGE') || '公开 Release'}`;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    ui.intro('LOVE · 部署管理');
    ui.note(summary, '当前部署');
    const result = await ask(
      select({
        message: '选择操作',
        options: menuOptions,
        initialValue: existsSync(resolve(directory, '.env')) ? 'status' : 'configure',
        maxItems: 14,
      }),
    );
    if (result === 'exit') ui.outro('已退出部署管理');
    return result;
  }
  if (kind === 'source')
    return ask(
      select({
        message: '选择镜像来源',
        initialValue: 'release',
        options: [
          {
            value: 'release',
            label: 'GitHub Release',
            hint: '默认 · 公开下载，自动识别架构并校验 SHA-256',
          },
          { value: 'ghcr', label: 'GHCR', hint: '拉取 GitHub 容器仓库镜像' },
          { value: 'custom', label: '自定义镜像仓库' },
          { value: 'cancel', label: '返回' },
        ],
      }),
    );
  if (kind === 'confirm')
    return (await ask(
      ui.confirm({ message, initialValue: false, active: '确认', inactive: '取消' }),
    ))
      ? 'yes'
      : 'no';
  if (kind === 'image')
    return ask(
      ui.text({
        message: '镜像完整地址',
        placeholder: 'registry.example.com/love-app:latest',
        validate: (value) =>
          /^[a-zA-Z0-9][a-zA-Z0-9_./:@-]*$/.test(value || '') ? undefined : '填写有效的镜像地址',
      }),
    );
  if (kind === 'text')
    return ask(
      ui.text({
        message,
        placeholder,
        validate: (value) => (/[\r\n\0]/.test(value || '') ? '不能包含控制字符' : undefined),
      }),
    );
  if (kind === 'uninstall')
    return ask(
      select({
        message: `卸载部署 ${message}`,
        initialValue: 'containers',
        options: [
          { value: 'containers', label: '移除容器，保留数据', hint: '默认 · 配置和备份也保留' },
          { value: 'volumes', label: '移除容器和数据卷', hint: '不可恢复 · 需要输入专属确认文字' },
          { value: 'cancel', label: '返回' },
        ],
      }),
    );
  if (kind === 'backup') {
    const entries = await readdir(resolve(directory, 'backups'), { withFileTypes: true }).catch(
      (error) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      },
    );
    const names = entries
      .filter((e) => e.isDirectory() && /^[a-zA-Z0-9_-]+$/.test(e.name))
      .map((e) => e.name)
      .sort()
      .reverse();
    if (!names.length) {
      ui.log.info('还没有可用备份，请先选择“备份数据与配置”。');
      return '';
    }
    return ask(
      select({
        message: '选择要恢复的备份',
        options: [
          ...names.map((name) => ({ value: name, label: name })),
          { value: '', label: '返回' },
        ],
        maxItems: 8,
      }),
    );
  }
  throw new Error('未知终端提示');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [kind, output, message, placeholder] = process.argv.slice(2);
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('请在交互终端直接运行 ./love。');
    process.exitCode = 1;
  } else {
    try {
      const result = await prompt({ kind, directory: dirname(output), message, placeholder });
      await writeFile(output, String(result), { mode: 0o600 });
    } catch (error) {
      if (error.message === 'PROMPT_CANCELLED') {
        clack.cancel('已取消，配置和数据未更改');
        process.exitCode = 130;
      } else {
        clack.log.error(error.message);
        process.exitCode = 1;
      }
    }
  }
}
