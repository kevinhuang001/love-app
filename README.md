# Love · 我们的日常

只需下载独立 `love` 管理程序即可部署，无需源码、本地构建或安装 Bun / Node.js。应用继续使用 Docker Engine 与 Compose 2.24.4+ 部署；管理界面、配置和数据库操作直接在宿主机运行，不创建临时工具容器。

在 Linux 部署主机的独立目录执行（已有部署请在原 `love` 所在目录执行）：

```sh
curl -fsSL https://raw.githubusercontent.com/kevinhuang001/love-app/main/install.sh | bash
```

安装入口自动识别 AMD64 / ARM64，固定正式发布版本并校验 SHA-256，仅安装 `love` 二进制。交互终端中安装完成后直接打开菜单；以后运行 `sudo ./love`。已有 `.env`、备份与数据卷保留，下载或校验失败不会替换原程序。

管理逻辑全部用 JavaScript 编写，以 Bun 编译为单文件二进制，现代终端仍使用 Clack。首次运行将内嵌 `compose*.yml`、`Caddyfile` 与代理配置创建到 `love` 所在目录；`.env`、`backups/` 也在同级目录，从其他目录运行仍使用这一位置。程序只检查官方 GHCR 镜像与 GitHub Release 中的管理工具，有更新才下载。成功启动后清理本项目旧镜像，不提供版本回滚；下载失败不停止原应用，启动失败提示排查日志；操作前备份可跳过。数据库、监听地址、HTTPS 和管理员凭据写入 `.env`；邀请码、注册、SMTP 和配额在后台配置。

以聊天为首页的情侣手机应用，同一份 Web 代码运行于浏览器和 Android APK。React + TypeScript + shadcn/ui + Tailwind CSS，Capacitor 8，Node 24 + SQLite / PostgreSQL + Socket.IO。

- **聊天**：实时文字、图片和视频，已读、输入提示、重连补取、持久化待发送消息和幂等重试。
- **回忆**：批量上传照片／视频，描述搜索、类型／上传者／日期筛选、日期与上传排序；网格、紧凑网格和月度时间轴，全屏连续浏览、照片放大与视频播放；JPEG 照片 ZIP、含视频与元数据的完整相册 ZIP 导出及导入。
- **纪念日**：已经发生的重要日子，按已过去的完整天数和时分秒递增。
- **To Do**：未来安排、一次性／每年循环、公历情人节和农历七夕；完成循环事项自动更新到下一次。
- **我们**：配对、昵称、头像、主题、安卓通知、AI 配置和退出／切换服务器。
- **AI 身份**：独立名称和图片头像，在聊天中 `@名称` 调用，回复显示名字与头像。
- **AI 工具**：配置兼容 OpenAI 的服务 URL、模型与 API Key；通过工具管理纪念日与 To Do、修改用户或 AI 自己的名称／头像、将上传附件保存到相册。
- **相册日期**：选择文件后自动上传并读取原图 EXIF 拍摄日期（优先原始拍摄时间，其次数字化时间）；只有未识别的文件要求手填日期。批量上传逐个文件保存日期，可单独修改。视频读取内嵌创建时间，上传时间与文件修改时间不作为拍摄日期。
- **媒体**：两人空间可选择只保存压缩媒体，图片生成 WebP 缩略图和预览，视频转码为 H.264/AAC MP4 并生成封面；不限制输入文件大小、像素、视频时长，仅按两人空间总额度计量。
- **安卓本地通知**：原生服务直连自建后端，后台接收、自动重连与本地通知，无需第三方推送账号。
- **配对权限与容量**：未配对仅可修改个人资料及配对；两人共用管理员分配的存储额度，默认 1 GiB。

- **管理后台**：独立登录、账号与配对、媒体容量及配额、访问／后台／操作日志、SMTP、邮箱注册／白名单、图形与邮件验证码。

## 开发

```bash
npm ci
cp .env.example .env
npm run dev
```

需要 Node **24**、系统 **FFmpeg / ffprobe** 和 `fonts-dejavu-core`。在 `.env` 填管理员 `ADMIN_USERNAME` 与至少 12 字符的 `ADMIN_PASSWORD`。浏览器打开 `http://localhost:5173`，登录页服务器填 `http://localhost:3000`。管理员自行访问 `http://localhost:5173/#admin` 创建账号，或配置 SMTP 后启用验证邮箱注册，再使用“我们”里的邀请码配对。

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run android:prepare
```

首次运行浏览器测试先执行 `npx playwright install --with-deps chromium`。

## Android APK

从 [Releases](https://github.com/kevinhuang001/love-app/releases/latest) 下载 APK 安装。配置一次固定签名 Secret 后，主分支的 API、前端、手机端 E2E、PostgreSQL 和 Docker 测试全部通过时，CI 自动发布正式签名 APK；直接覆盖安装保留登录数据。未配置固定密钥时仅提供 **love-android-apk** 调试 artifact，不自动发布随机签名 APK。步骤见 [Android 文档](docs/android.md)。卸载或清除数据会删除本地登录信息。

配对后在“我们 → 聊天通知”开启本地通知并允许后台运行。APK 直连自己的 HTTP/HTTPS 后端，无需推送密钥。服务有常驻状态通知；以应用进程存活为前提，系统休眠仍可能造成延迟。

## Docker 部署

按本文开头下载 `love` 二进制后直接运行，不需要部署压缩包。管理菜单不提供镜像来源选项或后台业务配置；应用仅使用 `ghcr.io/kevinhuang001/love-app` 的多架构镜像。没有更新时不会拉取镜像层、暂停应用或创建备份，只清理遗留旧 Love 镜像。详见 [管理菜单](docs/container-images.md) 与 [配置边界](docs/configuration.md)。

数据库切换通过“数据库管理”中的“备份数据与配置”和“恢复备份”完成：先备份，再配置或新建目标部署，恢复时自动识别来源并导入当前数据库。支持 SQLite ↔ PostgreSQL 双向及同类型恢复，内置与外部 PostgreSQL 均可；保留当前 `.env`、数据库地址、端口和管理员凭据。“数据库管理”统一提供一致性检查、备份、恢复和清理。“清理未使用媒体”同时支持 SQLite 与 PostgreSQL：暂停应用后预览未被回忆、聊天或头像使用的媒体记录、文件及数据库暂存数据，确认后释放容量；所有未进入聊天/回忆的上传均可清理，正在使用的个人及 AI 头像保留。操作前备份可跳过，既有备份不会修改。PostgreSQL 删除后的空间由数据库复用，物理数据库文件不会立即缩小。

向导支持 HTTP（包括 `0.0.0.0` 公网监听）、HTTPS 自定义端口、Certbot 自动申请与续期、Caddy 或外部代理。HTTPS 后端只在容器网络内开放。Dockerfile 和国内镜像 Dockerfile.cn 供开发者及 CI 使用，用户部署不再本地构建。

管理员独立访问 `/#admin`，用户页面没有后台入口；默认关闭自行注册。配置 SMTP 后可启用邮箱注册或白名单，并可要求注册邀请码；后台支持批量生成、下载、次数限制、有效期与停用，白名单用户自己创建账号并完成邮件验证。

CI 会实际构建并启动 Docker 镜像，检查 Web 字体、PNG 验证码、管理员权限、账号、配额、日志、聊天、农历待办及重启持久化。此配置不会自动连接或部署到你的服务器。

PostgreSQL 模式统一保存所有业务数据、图片、视频和头像，支持分块读取与视频拖动。SQLite 仍使用磁盘媒体。

## 部署与接口

- [配置管理边界](docs/configuration.md)
- [相册导出与导入](docs/album-export.md)
- [部署与备份](docs/deployment.md)
- [管理后台与邮箱注册](docs/admin.md)
- [Android 与推送配置](docs/android.md)
- [API、Socket.IO 与 AI 工具](docs/api.md)
- [架构、目录和测试](docs/architecture.md)

后端支持 SQLite 与 PostgreSQL。数据库迁移从版本 1 重新开始，001 保存当前完整表结构。启动时在事务和数据库锁保护下按顺序执行未应用的增量，并在 `schema_migrations` 中记录编号、名称、SHA-256 校验和及时间；迁移失败不启动应用。已发布增量不可修改。此前 schema 4～9、无迁移历史的数据库与旧备份不再支持，也不自动标记为版本 1。详见 [迁移规范](docs/migrations.md)。登录页底部展开“服务器设置”配置 URL。

## License

MIT。shadcn/ui 的组件源文件保留于 `apps/client/src/components/ui`，来源与许可见 [第三方说明](THIRD_PARTY_NOTICES.md)。

安卓本地通知配置见 [Android / 消息通知](docs/android.md)。管理入口不在前台显示，管理员自行访问 `/#admin`。

媒体上传先暂存，不计正式额度。发布回忆或聊天消息时，媒体、容量与业务记录在同一事务中提交，失败全部回滚；强制退出留下的未发布上传可在数据库管理中清理。
