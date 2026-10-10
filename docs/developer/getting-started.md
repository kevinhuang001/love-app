# 本地开发

本文用于修改源码和运行测试。只想部署正式版本，请看 [安装指南](../user/install.md)。

## 环境

需要 Node.js **24**、npm、FFmpeg／ffprobe 和系统字体。Debian／Ubuntu 的媒体工具和验证码字体可安装：

```sh
sudo apt-get install ffmpeg fonts-dejavu-core
```

Android 构建另需 Java 21 和 Android SDK 36。编译独立管理程序另需 Bun；运行已经编译好的管理程序不需要 Bun 或 Node.js。

## 启动前后端

在仓库根目录执行：

```sh
npm ci
cp .env.example .env
```

编辑 `.env`，至少填写管理员凭据。下面仅是本地开发示例：

```dotenv
ADMIN_USERNAME=admin
ADMIN_PASSWORD=local-development-password
```

再运行：

```sh
npm run dev
```

浏览器打开 `http://localhost:5173`。登录页的服务器地址填 `http://localhost:3000`；后台地址为 `http://localhost:5173/#admin`。先用管理员账号创建两个用户，再测试登录和配对。

默认 SQLite 和媒体目录位于仓库的 `data/` 下。首次打开数据库会自动迁移，详细规则见 [数据库迁移](migrations.md)。其他环境变量见 [配置参考](configuration.md)。

## 常用检查

| 命令                      | 检查内容                          |
| ------------------------- | --------------------------------- |
| `npm run typecheck`       | 工作区 TypeScript 类型            |
| `npm test`                | 管理脚本、后端和前端测试          |
| `npm run build`           | 后端及 Web 生产构建               |
| `npm run test:e2e`        | Playwright 浏览器流程             |
| `npm run android:prepare` | 构建前端并生成／同步 Android 工程 |

首次运行浏览器测试，先安装 Chromium：

```sh
npx playwright install --with-deps chromium
```

测试真实 PostgreSQL 时，准备独立的测试数据库，然后运行：

```sh
TEST_DATABASE_URL='postgresql://user:password@localhost:5432/love_test' npm test -w apps/server
```

测试会创建和删除隔离 schema。使用专用测试账号和数据库，不指向生产数据。

## 编译管理程序

```sh
bun manager/build.mjs
```

输出在 `.artifacts/manager/`，包含 Linux AMD64／ARM64 二进制、校验文件和发布清单。只编译本机架构可加 `--native`。Linux AMD64 上可以运行：

```sh
.artifacts/manager/love-linux-x64 --self-test
```

## 仓库目录

| 目录                  | 职责                                                        |
| --------------------- | ----------------------------------------------------------- |
| `apps/client/`        | Web 应用、Android 原生代码和界面资源                        |
| `apps/server/`        | 服务端业务代码；数据库 SQL 与备份转换器在 `src/migrations/` |
| `packages/`           | 前后端共用模块                                              |
| `manager/`            | 独立管理程序、安装入口、配置向导和编译入口                  |
| `infra/docker/`       | 镜像构建、数据库和存储 Compose 模板、部署环境示例           |
| `infra/certificates/` | Caddy、HTTPS 与 Certbot 配置和续期脚本                      |
| `tests/`              | 所有测试、测试辅助代码和测试运行配置                        |
| `tools/`              | Android 构建工具、CI 环境工具和手工数据库迁移 SQL           |
| `docs/user/`          | 安装、使用和排错说明                                        |
| `docs/developer/`     | 开发规范、数据结构和实现原理                                |
| `.github/workflows/`  | CI、镜像和正式版本发布                                      |
| `.artifacts/`         | 本地管理程序编译结果与浏览器测试报告，不提交到 Git          |

详细的文件归属和新增文件规则见 [目录组织](project-layout.md)。

接口变更看 [接口参考](api.md)，数据库变更看 [迁移规范](migrations.md)，发布看 [CI 与发布](ci.md)。
