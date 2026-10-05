# Love · 我们的日常

以聊天为首页的情侣手机应用，同一份 Web 代码运行于浏览器和 Android APK。React + TypeScript + shadcn/ui + Tailwind CSS，Capacitor 8，Node 24 + SQLite + Socket.IO。

- **聊天**：实时文字、图片和视频，已读、输入提示、重连补取、持久化待发送消息和幂等重试。
- **回忆**：批量上传照片／视频，描述搜索、类型／上传者／日期筛选、日期与上传排序；网格、紧凑网格和月度时间轴，全屏连续浏览、照片放大与视频播放。
- **纪念日**：已经发生的重要日子，包含当天，累计天数递增。
- **To Do**：未来安排、一次性／每年循环、公历情人节和农历七夕；完成循环事项自动更新到下一次。
- **我们**：配对、昵称、头像、主题、安卓通知、AI 配置和退出／切换服务器。
- **AI 身份**：独立名称和图片头像，在聊天中 `@名称` 调用，回复显示名字与头像。
- **AI 工具**：配置兼容 OpenAI 的服务 URL、模型与 API Key；通过工具管理纪念日与 To Do、修改用户或 AI 自己的名称／头像、将上传附件保存到相册。
- **媒体**：原文件保留，图片生成 WebP 缩略图和预览，视频转码为 H.264/AAC MP4 并生成封面。
- **安卓推送**：原生 FCM 通知、设备注册、通知频道、后台推送与服务端持久化重试。

## 开发

```bash
npm ci
cp .env.example .env
npm run dev
```

需要 Node **24** 和系统 **FFmpeg / ffprobe**。浏览器打开 `http://localhost:5173`，登录页服务器填 `http://localhost:3000`。两人分别注册，使用“我们”里的邀请码配对。

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

启用真实后台推送需要你自己的 Firebase 项目：仓库 Secret `GOOGLE_SERVICES_JSON` 配置安卓客户端，服务器设置 Firebase Admin 凭据。无配置时仍生成可安装的 APK，应用内不会宣称后台推送已就绪。

## Docker 部署

```bash
cp .env.docker.example .env
# 编辑 .env，填写稳定的 MEDIA_SIGNING_SECRET 和 LOVE_DOMAIN
# 生成密钥：openssl rand -hex 32
# 若使用下面的 HTTPS 反代，将 TRUST_PROXY=1，并允许 https://你的域名
# 将域名解析到服务器，并开放 80/443

docker compose -p love-v3 --profile https up -d --build
```

若部署过旧版，先停止旧服务。`love-v3` 使用新的数据卷，不删除旧卷。

Caddy 自动申请 HTTPS 证书并转发 WebSocket，数据库／原始上传／证书持久化到 named volumes。浏览器打开 `https://你的域名`，APK 的服务器 URL 填相同地址。仅本机调试可运行 `docker compose -p love-v3 up -d --build`，访问 `http://localhost:3000`。

CI 会实际构建并启动 Docker 镜像，检查 Web 字体、中文 API、聊天、农历待办以及容器重启后的数据保留。此配置不会自动连接或部署到你的服务器。

## 部署与接口

- [部署与备份](docs/deployment.md)
- [Android 与推送配置](docs/android.md)
- [API、Socket.IO 与 AI 工具](docs/api.md)
- [架构、目录和测试](docs/architecture.md)

当前仅支持最新 API 与数据库结构（schema 3），不包含旧版本别名、迁移或导入逻辑。部署使用新的数据目录；登录页底部展开“服务器设置”配置 URL。

## License

MIT。shadcn/ui 的组件源文件保留于 `apps/client/src/components/ui`，来源与许可见 [第三方说明](THIRD_PARTY_NOTICES.md)。
