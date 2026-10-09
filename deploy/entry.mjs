import { dirname, resolve } from 'node:path';
import { Manager } from './manager.mjs';
import { templates } from './templates.mjs';
import pkg from '../package.json';
import { managerSelfTest } from '../scripts/manager-self-test.mjs';
const source = typeof LOVE_SOURCE_SHA === 'string' ? LOVE_SOURCE_SHA : 'development';
const info = { version: pkg.version, source, platform: process.platform, arch: process.arch };
if (process.argv.includes('--version')) console.log(JSON.stringify(info));
else if (process.argv.includes('--self-test')) await managerSelfTest();
else {
  try {
    if (process.argv.length > 2) throw new Error('直接运行 ./love，在菜单中选择操作。');
    if (!process.stdin.isTTY || !process.stdout.isTTY)
      throw new Error('请在交互终端直接运行 ./love。');
    if (process.platform !== 'linux')
      throw new Error('请在部署 Docker 的 Linux 主机运行管理程序。');
    // Compiled executables locate deployment files beside the executable, not in $bunfs.
    const executable = resolve(process.execPath),
      directory = dirname(executable);
    const manager = new Manager({
      directory,
      executable,
      version: info.version,
      source,
      templates,
    });
    const result = await manager.main();
    if (result === 'reload') {
      process.execve(executable, [executable], process.env);
    }
  } catch (error) {
    if (['PROMPT_CANCELLED', 'SETUP_CANCELLED'].includes(error.message)) console.log('已取消。');
    else {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
