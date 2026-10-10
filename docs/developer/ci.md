# CI 与发布

本文面向提交代码、维护 Actions 和发布版本的开发者。用户更新服务器或 APK，请看[日常维护](../user/manage.md)和 [Android 使用](../user/android.md)。

## 提交后会检查什么

[Test and build](../../.github/workflows/ci.yml) 在 push、pull request 和手动运行时触发，没有排除文档变更。

| Job                      | 检查内容                                                           |
| ------------------------ | ------------------------------------------------------------------ |
| `test`                   | 类型、单元与集成测试、构建、Playwright 浏览器回归                  |
| `postgres`               | PostgreSQL 18 上的服务端测试                                       |
| `manager`                | 编译两种管理程序；AMD64 空目录独立运行、自测和真实 PostgreSQL 测试 |
| `manager-arm`            | ARM64 空目录运行管理程序，检查不依赖项目文件或额外运行时           |
| `docker (Dockerfile)`    | 标准镜像构建和 Docker 部署验证                                     |
| `docker (Dockerfile.cn)` | 国内构建源镜像构建和同类部署验证                                   |
| `android`                | APK 构建、签名和原生内容检查                                       |

Docker 检查覆盖持久化、管理程序备份恢复、数据库连接和 HTTPS 部署等路径。CI 的证书和服务环境用于回归，不证明实际域名的 DNS、证书申请或真实手机送达可用。

改动前在本地运行相应检查，命令见[本地开发](getting-started.md)。数据库、备份或管理程序改动应关注真实 PostgreSQL、两种架构和 Docker 检查，不能只凭 SQLite 单元测试合并。查看当前提交的所有 job，避免误把旧提交的绿色结果当作本次通过。

## 构建产物

在 Actions 对应运行的 Artifacts 下载：

| Artifact           | 内容                                             |
| ------------------ | ------------------------------------------------ |
| `love-manager`     | Linux AMD64 / ARM64 独立程序、XZ 下载包、校验和及版本元数据 |
| `love-android-apk` | `love.apk` 和不含私钥的 `signing.json`           |

调试构建产物不等于正式 Release。用户安装入口是仓库 Releases；APK 是否可覆盖旧版取决于签名和 versionCode，见 [Android 构建与签名](android.md)。

## 容器发布

[Build and publish container images](../../.github/workflows/containers.yml) 在相关部署文件的 PR 中验证镜像构建，不向 GHCR 发布。纯文档 PR 不触发这项额外工作流，但仍运行 Test and build 内的两项 Docker job。

main 上 Test and build 成功后，发布流程检查来源提交、当前 main 和必需 job，分别构建并测试 AMD64、ARM64 镜像，再发布多架构镜像到 `ghcr.io/kevinhuang001/love-app`。手动运行时提供符合条件的 Test and build run ID。工作流具体条件以 YAML 为准，不能用任意旧的绿色运行发布新代码。

## 发布正式版本

[Publish release](../../.github/workflows/release.yml) 在 main 的 Test and build 完成后运行，也可手动提供 `run_id` 与新 `tag`。发布前会检查：

- Test and build 成功，七个必需 job 全部成功。
- 测试提交属于 main，且与当前发布源码一致；只允许发布工作流自身的差异。
- APK 使用正式签名，管理程序元数据与待发布版本一致。
- tag 合法且尚未发布；自动流程遇到已有版本会跳过，不覆盖旧 Release。

准备新版本时，同步根目录、client、server 的 package.json、package-lock.json 中的版本以及 [version.ts](../../apps/server/src/version.ts) 的应用版本。还要更新 release 工作流的自动 tag 默认值；当前为 `v2.10.2`。数据库版本另行维护，不能因为应用版本变化就增加 schema version，见[数据库迁移](migrations.md)。

配置固定 Android 签名后，main CI 成功才具备发布条件。已有正式 Release 不会因文档更新被替换。Release 产物和镜像是独立流程；检查各自结果，不能以其中一个成功推断另一个已经发布。
