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
  { value: 'update', label: '更新软件及管理工具', hint: '检查 GHCR，有更新才下载，备份可跳过' },
  { value: 'database', label: '数据库管理', hint: '一致性检查、备份、恢复与未使用媒体清理' },
  { value: 'uninstall', label: '卸载应用', hint: '默认保留数据和备份' },
  { value: 'rollback', label: '回滚上次更新', hint: '恢复镜像，保留当前数据' },
  { value: 'refresh', label: '刷新页面', hint: '清理之前的显示，重新读取部署状态' },
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
      summary = `${setting('COMPOSE_PROJECT_NAME') || 'love-v4'} · ${setting('LOVE_DATABASE') || 'sqlite'} · ${setting('LOVE_HTTPS') === '1' ? 'HTTPS' : 'HTTP'}\n镜像：${env.LOVE_UI_IMAGE || setting('LOVE_IMAGE') || 'ghcr.io/kevinhuang001/love-app:latest'}`;
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
        maxItems: menuOptions.length,
      }),
    );
    if (result === 'exit') ui.outro('已退出部署管理');
    return result;
  }
  if (kind === 'database-menu') {
    ui.intro('LOVE · 数据库管理');
    return ask(
      select({
        message: '选择数据库操作',
        initialValue: 'check',
        options: [
          { value: 'check', label: '一致性检查', hint: '表关系、媒体完整性与容量，支持深入校验' },
          { value: 'backup', label: '备份数据与配置' },
          { value: 'restore', label: '恢复备份', hint: '自动转换至当前数据库，保留部署配置' },
          {
            value: 'cleanup',
            label: '清理未使用媒体',
            hint: '未进入聊天/回忆的上传全部清理，保护正在使用的头像',
          },
          { value: 'back', label: '返回主菜单' },
        ],
      }),
    );
  }
  if (kind === 'check-mode')
    return ask(
      select({
        message: '选择一致性检查范围',
        initialValue: 'quick',
        options: [
          { value: 'quick', label: '常规检查', hint: '数据库关系、文件存在性、分块与容量' },
          {
            value: 'deep',
            label: '深入检查',
            hint: '逐个读取媒体、计算 SHA-256；大数据量耗时较长',
          },
          { value: 'cancel', label: '取消检查' },
        ],
      }),
    );
  if (kind === 'continue')
    return ask(
      ui.select({
        message: '查看完操作结果后，按回车返回',
        options: [{ value: 'continue', label: message || '返回主菜单' }],
        showInstructions: false,
      }),
    );
  if (kind === 'backup-policy')
    return ask(
      select({
        message: '本次操作前是否备份当前数据？',
        initialValue: 'skip',
        options: [
          { value: 'skip', label: '直接继续，跳过备份' },
          { value: 'backup', label: '先备份，再继续', hint: '完整数据库与媒体，耗时取决于数据量' },
          { value: 'cancel', label: '取消本次操作' },
        ],
      }),
    );
  if (kind === 'recovery-policy')
    return ask(
      select({
        message: '部分加密凭据无法恢复，请选择处理方式',
        initialValue: 'cancel',
        options: [
          {
            value: 'recover',
            label: '恢复所有可恢复内容',
            hint: '仅清空上面列出的无法解密凭据，恢复后重新填写',
          },
          { value: 'cancel', label: '取消恢复，保留当前数据' },
        ],
      }),
    );
  if (kind === 'confirm')
    return (await ask(
      ui.confirm({ message, initialValue: false, active: '确认', inactive: '取消' }),
    ))
      ? 'yes'
      : 'no';
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
