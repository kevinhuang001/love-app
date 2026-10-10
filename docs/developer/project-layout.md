# 目录组织：文件应该放在哪里

根目录只保留项目入口、依赖清单、许可说明和必须从根目录读取的工具配置。业务代码、测试、部署模板和辅助工具各自归类。新增文件先找到所属目录，不再往根目录或通用 scripts 目录堆放。

## 按职责找代码

| 要修改的内容           | 位置                                 | 入口或示例                                          |
| ---------------------- | ------------------------------------ | --------------------------------------------------- |
| Web 页面与交互         | `apps/client/src/`                   | 页面、组件、API 客户端                              |
| Android 原生能力       | `apps/client/native/`                | 推送和媒体桥接；生成工程不提交                      |
| 后端业务               | `apps/server/src/`                   | HTTP、数据库、媒体、实时通知                        |
| 数据库增量迁移         | `apps/server/src/migrations/`        | SQLite 和 PostgreSQL SQL 随同一版本管理             |
| 备份格式增量转换       | `apps/server/src/migrations/backup/` | 格式定义和相邻版本转换器                            |
| 管理程序               | `manager/`                           | `entry.mjs`、`manager.mjs`、`terminal-ui.mjs`       |
| 安装与编译管理程序     | `manager/`                           | `install.sh`、`build.mjs`                           |
| 容器构建与基础部署     | `infra/docker/`                      | 两份 Dockerfile、基础 Compose、数据库与存储覆盖文件 |
| HTTPS 与证书           | `infra/certificates/`                | Caddyfile、HTTPS 覆盖文件、Certbot 脚本             |
| Android 工程生成与签名 | `tools/android/`                     | `prepare.mjs`、`signing-key.mjs`                    |
| CI 媒体工具安装        | `tools/ci/`                          | `media-tools.sh`                                    |
| 手工修复数据库         | `tools/database/`                    | 旧版 PostgreSQL 转 schema 1 的一次性 SQL            |

数据库迁移器属于运行时实现，因此留在服务端源码里，不能挪进 tools。tools/database 里的 SQL 是人工执行的历史数据库接入工具；应用启动不会扫描或自动运行它。

## 测试统一放在 tests

| 目录                  | 内容                                              | 如何运行                         |
| --------------------- | ------------------------------------------------- | -------------------------------- |
| `tests/server/`       | 服务端单元、数据库与接口测试，包含共用 support.ts | `npm test -w apps/server`        |
| `tests/client/`       | 客户端工具与状态逻辑测试                          | `npm test -w apps/client`        |
| `tests/manager/`      | 安装器、管理流程、菜单、升级和编译后二进制自检    | `npm test`；二进制 `--self-test` |
| `tests/android/`      | 签名测试与推送代码验证                            | `npm test`；Android CI           |
| `tests/certificates/` | Certbot 申请、续期和失败重试测试                  | `npm test`                       |
| `tests/integration/`  | 需要真实 Docker 的部署、恢复和代理验证            | Docker CI                        |
| `tests/e2e/`          | 浏览器用户流程                                    | `npm run test:e2e`               |

Vitest 和 Playwright 配置也在 tests 下。运行上述 npm 命令无需手动指定配置路径。Docker 集成脚本不会被普通单元测试扫描，避免本地 npm test 意外启动容器。

客户端测试的类型检查与应用源码一起执行。测试辅助代码只放在对应测试目录，不混入业务源码。管理程序的二进制自检会在编译时嵌入，因此独立运行时无需带上 tests 目录。

## 源码布局和安装后的布局

仓库中的 `infra/` 是模板来源。编译时，`manager/templates.mjs` 把模板嵌入二进制；安装后，管理程序在 love 可执行文件旁生成 `.env`、Compose 文件和证书脚本。部署目录仍是用户可以直接运行 docker compose 的完整目录，已有安装无需手动搬配置。

仓库中的证书实现集中在 infra/certificates；部署时证书脚本仍生成在 deploy 子目录。这是已发布部署文件的布局，由模板映射明确管理，不是仓库残留源码。

## 生成文件放在哪里

管理程序二进制、SHA256SUMS 和发布清单写入 `.artifacts/manager/`。浏览器测试截图、视频和 trace 写入 `.artifacts/test-results/`，HTML 报告写入 `.artifacts/playwright-report/`。

应用编译结果仍在各自工作区的 dist 目录，Android 生成工程仍在 apps/client/android。它们是相应工具的标准输出目录，都已忽略，不作为源码提交。

Docker 构建上下文始终是仓库根目录，所以 `.dockerignore` 留在根目录。Dockerfile 路径通过 `-f infra/docker/Dockerfile` 指定；不要把构建上下文改成 infra/docker，否则镜像构建无法读取应用源码。
