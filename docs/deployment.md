# 部署与数据

## Docker

需要可访问的 HTTPS 域名。设置 `.env`：

```dotenv
MEDIA_SIGNING_SECRET=替换为至少32字符的稳定随机密钥
ALLOWED_ORIGINS=https://love.example.com,https://localhost,capacitor://localhost
TRUST_PROXY=1
```

`MEDIA_SIGNING_SECRET` 同时用于媒体链接签名与 AI Key 加密，备份时必须保存，轮换后现有 AI Key 需要重新填写。`TRUST_PROXY=1` 仅适用于恰好一层可信反向代理，不要直接暴露该配置的服务。

```bash
docker compose up -d --build
```

数据保存于 Docker `love-data` volume。服务只绑定宿主 `127.0.0.1:3000`；用 Caddy／Nginx 反代到该端口。TLS 终止在反向代理；必须转发 Socket.IO 的 WebSocket Upgrade。

Caddy 示例：

```caddy
love.example.com {
  request_body { max_size 105MB }
  reverse_proxy 127.0.0.1:3000
}
```

Nginx 需 `client_max_body_size 105m`、`proxy_read_timeout 300s` 以及 WebSocket Upgrade headers。不要将 `data/media` 映射为公开静态目录。API 通过一个小时有效的签名链接提供预览，支持视频 Range 请求。签名链接相当于短期访问凭据，不应公开转发。

## 非 Docker

安装 Node 24、FFmpeg，然后 `npm ci && npm run build`。设置 `NODE_ENV=production`、`MEDIA_SIGNING_SECRET` 和 `ALLOWED_ORIGINS`，执行 `npm start`。后端同时提供 Web 静态文件，默认端口 3000。数据库默认在仓库 `data/love.sqlite`，原始媒体及其压缩版本在 `data/media`。

独立托管 Web 时构建前设置 `VITE_API_URL=https://love.example.com`。登录页仍能修改服务器 URL。静态主机需要把所有前端路径重写到 index.html，并配置后端允许该 Web 域名的 CORS。使用独立 Web 域时还需在你的静态托管服务设置相应 CSP `connect-src` / `img-src` / `media-src`。

## 备份和升级

停止服务后备份整个 `data/`（SQLite 与原文件一起）和服务端环境变量，再启动。不要在运行中只复制 `.sqlite` 主文件，WAL 模式还包含尚未 checkpoint 的数据。建议使用 SQLite online backup 或短暂停机进行一致性备份。

本次是新的 2.0 产品和数据库，不会对旧 Sequelize 数据库执行 alter／drop。旧项目有多个被提交的 SQLite 副本，不能据此判断哪份是实际生产数据，因此不自动选取或覆盖。使用新数据目录部署，双方注册并重新配对。若保留旧账号／回忆，先在离线副本中导出 Users、Moments、Anniversaries，再按新 schema 导入并验证关系映射；旧密码需要显式迁移策略，不能直接把旧 bcrypt hash 当作新 scrypt hash 使用。

解除配对只断开当前空间，旧消息／回忆记录仍保留数据库中。重新配对创建独立空间，不能通过新关系看到旧空间的数据。删除回忆移除其相册记录，保留原始上传文件，避免误删同时用于聊天或头像的媒体。当前版本不自动清理原文件；需定期监控磁盘容量。

## AI 服务

“我们”里填兼容 OpenAI Chat Completions 的根地址（一般为 `https://provider.example/v1`）、模型 ID 和 Key，开启 `@ai`。服务必须支持 function calling。

URL 默认只能使用 HTTPS，DNS 每次连接检查并拒绝本机、内网和链路本地地址，且不跟随重定向。自托管 Ollama 等内网服务须管理员显式设置 `AI_ALLOWED_HOSTS=ollama.internal` 后，用户才可配置 `http://ollama.internal:11434/v1`。不要将任意不可信域名放入白名单。

AI Key 使用 AES-256-GCM 加密，仅服务端解密调用；GET 设置接口不会返回 Key。切换 AI URL 会清空旧 URL 的密钥，防止把旧凭据发送给新服务。当前指令、昵称和本次附件 ID 发给选定 AI 服务，工具返回的纪念日／媒体列表也会发给该服务；不会自动发送全部聊天历史或媒体二进制。

这是自托管两人应用，SQLite / Socket.IO 为单进程架构。水平扩展前需改用 PostgreSQL、Socket.IO Redis adapter 和共享媒体存储。
