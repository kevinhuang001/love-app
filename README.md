# Love · 我们的日常

首次部署运行 `./love up`，终端向导会配置 SQLite 或 PostgreSQL、HTTPS、管理员、容量和可选 SMTP。只需 Docker，无需宿主机 Node.js。再次运行复用配置；详细步骤见 [数据库与部署向导](docs/database.md)。


以聊天为首页的情侣手机应用，同一份 Web 代码运行于浏览器和 Android APK。React + TypeScript + shadcn/ui + Tailwind CSS，Capacitor 8，Node 24 + SQLite + Socket.IO。

- **聊天**：实时文字、图片和视频，已读、输入提示、重连补取、持久化待发送消息和幂等重试。
- **回忆**：批量上传照片／视频，描述搜索、类型／上传者／日期筛选、日期与上传排序；网格、紧凑网格和月度时间轴，全屏连续浏览、照片放大与视频播放。
- **纪念日**：已经发生的重要日子，包含当天，累计天数递增。
- **To Do**：未来安排、一次性／每年循环、公历情人节和农历七夕；完成循环事项自动更新到下一次。
- **我们**：配对、昵称、头像、主题、安卓通知、AI 配置和退出／切换服务器。
- **AI 身份**：独立名称和图片头像，在聊天中 `@名称` 调用，回复显示名字与头像。
- **AI 工具**：配置兼容 OpenAI 的服务 URL、模型与 API Key；通过工具管理纪念日与 To Do、修改用户或 AI 自己的名称／头像、将上传附件保存到相册。
- **相册日期**：选择文件后自动上传并读取原图 EXIF 拍摄日期（优先原始拍摄时间，其次数字化时间）；只有未识别的文件要求手填日期。批量上传逐个文件保存日期，可单独修改。视频读取内嵌创建时间，上传时间与文件修改时间不作为拍摄日期。
- **媒体**：原文件保留，图片生成 WebP 缩略图和预览，视频转码为 H.264/AAC MP4 并生成封面。
- **安卓本地通知**：原生服务直连自建后端，后台接收、自动重连与本地通知，无需第三方推送账号。
- **配对权限与容量**：未配对仅可修改个人资料及配对；两人共用管理员分配的存储额度，默认 1 GiB。

- **管理后台**：独立登录、账号与配对、媒体容量及配额、访问／后台／操作日志、SMTP、邮箱注册／白名单、图形与邮件验证码。

## 开发

```bash
npm ci
cp .env.example .env
npm run dev
```

需要 Node **24**、系统 **FFmpeg / ffprobe** 和 `fonts-dejavu-core`。在 `.env` 填首次管理员 `ADMIN_USERNAME` 与至少 12 字符的 `ADMIN_PASSWORD`。浏览器打开 `http://localhost:5173`，登录页服务器填 `http://localhost:3000`。先通过“管理后台”创建账号，或配置 SMTP 后启用验证邮箱注册，再使用“我们”里的邀请码配对。

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run android:prepare
```

首次运行浏览器测试先执行 `npx playwright install --with-deps chromium`。

## Android APK

每次 push／PR 的 GitHub Actions 会先运行 API 集成测试、前端单元测试和手机端 E2E，再生成可安装的 **love-android-apk** artifact。下载解压后安装 `app-debug.apk`。调试包用于自用和验证；发布签名步骤见 [Android 文档](docs/android.md)。

配对后在“我们 → 聊天通知”开启本地通知并允许后台运行。APK 直连自己的 HTTPS 后端，无需推送密钥。服务有常驻状态通知；以应用进程存活为前提，系统休眠仍可能造成延迟。

## Docker 部署

中国大陆部署可用 `LOVE_DOCKERFILE=Dockerfile.cn ./love up`，使用 npmmirror 的 npm 源、中科大的 pip 和 apt 源，保留首次配置向导。已有部署在 `.env` 设置 `LOVE_DOCKERFILE=Dockerfile.cn` 后运行 `./love up`。详见 [国内镜像构建](docs/docker-cn.md)。

```bash
cp .env.docker.example .env
# 编辑 .env，填写稳定的 MEDIA_SIGNING_SECRET、LOVE_DOMAIN、ADMIN_USERNAME、ADMIN_PASSWORD
# 生成密钥：openssl rand -hex 32
# 若使用下面的 HTTPS 反代，将 TRUST_PROXY=1，并允许 https://你的域名
# 将域名解析到服务器，并开放 80/443

docker compose -p love-v4 --profile https up -d --build
```

若部署过旧版，先停止旧服务。`love-v4` 使用新的数据卷，不删除旧卷。

Caddy 自动申请 HTTPS 证书并转发 WebSocket，数据库／原始上传／证书持久化到 named volumes。浏览器打开 `https://你的域名`，APK 的服务器 URL 填相同地址。仅本机调试可运行 `docker compose -p love-v4 up -d --build`，访问 `http://localhost:3000`。

首次打开登录页进入“管理后台”；默认关闭自行注册。配置 SMTP 后可启用邮箱注册或白名单，白名单用户自己创建账号并完成邮件验证。

CI 会实际构建并启动 Docker 镜像，检查 Web 字体、PNG 验证码、管理员权限、账号、配额、日志、聊天、农历待办及重启持久化。此配置不会自动连接或部署到你的服务器。

## 部署与接口

- [部署与备份](docs/deployment.md)
- [管理后台与邮箱注册](docs/admin.md)
- [Android 与推送配置](docs/android.md)
- [API、Socket.IO 与 AI 工具](docs/api.md)
- [架构、目录和测试](docs/architecture.md)

后端支持 SQLite 与 PostgreSQL，当前仅支持最新 API 与数据库结构（schema 4），不包含旧版本别名、迁移或导入逻辑。部署使用新的数据目录；登录页底部展开“服务器设置”配置 URL。

## License

MIT。shadcn/ui 的组件源文件保留于 `apps/client/src/components/ui`，来源与许可见 [第三方说明](THIRD_PARTY_NOTICES.md)。

安卓本地通知配置见 [Android / 消息通知](docs/android.md)。管理入口不在前台显示，管理员自行访问 `/#admin`。
