# 部署与数据

推荐首次部署运行 `./love up`，通过现代终端向导配置必需选项并自动启动。SQLite 为默认值，也可选择内置或外部 PostgreSQL。见 [数据库与部署向导](database.md)。以下直接 Compose 步骤适用于手动管理 `.env` 的部署。


## Docker

需要可访问的 HTTPS 域名。先 `cp .env.docker.example .env`，再设置 `.env`：

```dotenv
MEDIA_SIGNING_SECRET=替换为至少32字符的稳定随机密钥
ALLOWED_ORIGINS=https://love.example.com,https://localhost,capacitor://localhost
TRUST_PROXY=1
LOVE_DOMAIN=love.example.com
ADMIN_USERNAME=你的管理员用户名
ADMIN_PASSWORD=至少12字符的随机密码
```

`MEDIA_SIGNING_SECRET` 同时用于媒体链接签名、验证码摘要、SMTP 密码和 AI Key 加密，备份时必须保存，轮换后 SMTP 密码和 AI Key 需要重新填写。管理员启动变量仅创建首个账号，创建后移除两个变量；管理员独立访问 `/#admin` 配置 SMTP 和注册政策，用户页面不显示入口。`TRUST_PROXY=1` 仅适用于恰好一层可信反向代理，不要直接暴露该配置的服务。

```bash
docker compose -p love-v4 --profile https up -d --build
```

数据保存于 Docker `love-data` volume。`https` profile 启动仓库内置 Caddy，开放 80/443，自动申请证书并转发到内部 `love:3000`（支持 Socket.IO WebSocket）。先将 `LOVE_DOMAIN` 的 DNS 指向服务器，并开放端口。APK 使用相同 HTTPS 根地址。HTTP 端口绑定由 `LOVE_BIND_IP` 控制，默认 `127.0.0.1`；可设为 `0.0.0.0` 或宿主机指定 IP。仅运行 `docker compose -p love-v4 up -d --build` 时不启动 Caddy，适合本机调试或使用已有 Nginx/Caddy。不要两个反向代理同时占用 80/443。

直接 HTTP 访问可在 `.env` 配置：

```dotenv
LOVE_BIND_IP=0.0.0.0
LOVE_PORT=3000
LOVE_HTTPS=0
TRUST_PROXY=0
```

运行 `./love up`（或不加 HTTPS profile 的 Compose），开放所选端口；浏览器和 APK 使用 `http://服务器实际IP:3000`。`0.0.0.0` 只用于监听，不能当手机的服务器地址。已有部署可执行 `./love setup` 修改监听 IP，再 `./love up` 重新创建服务；数据卷保留。HTTP 未加密，公网建议配置 HTTPS。

日志和健康状态：`docker compose logs -f love proxy`、`docker compose ps`。数据持久化：`love-data` 保存数据库和媒体，`caddy-data` 保存证书。不要使用 `down -v` 进行普通更新；升级用 `docker compose -p love-v4 --profile https up -d --build`。Docker 中使用内网 AI 时，请将其加入同一网络并设置 `AI_ALLOWED_HOSTS`。

Caddy 示例：

```caddy
love.example.com {
  request_body { max_size 105MB }
  reverse_proxy 127.0.0.1:3000
}
```

Nginx 需 `client_max_body_size 105m`、`proxy_read_timeout 300s` 以及 WebSocket Upgrade headers。不要将 `data/media` 映射为公开静态目录。API 通过一个小时有效的签名链接提供预览，支持视频 Range 请求。签名链接相当于短期访问凭据，不应公开转发。

## 非 Docker

安装 Node 24、FFmpeg 和 `fonts-dejavu-core`，然后 `npm ci && npm run build`。设置 `NODE_ENV=production`、`MEDIA_SIGNING_SECRET` 、`ALLOWED_ORIGINS` 和首次管理员配置，执行 `npm start`。后端同时提供 Web 静态文件，默认端口 3000。数据库默认在仓库 `data/love.sqlite`，原始媒体及其压缩版本在 `data/media`。

独立托管 Web 时构建前设置 `VITE_API_URL=https://love.example.com`。登录页仍能修改服务器 URL。静态主机需要把所有前端路径重写到 index.html，并配置后端允许该 Web 域名的 CORS。使用独立 Web 域时还需在你的静态托管服务设置相应 CSP `connect-src` / `img-src` / `media-src`。

## 备份和升级

停止服务后备份整个 `data/`（SQLite 与原文件一起）和服务端环境变量，再启动。不要在运行中只复制 `.sqlite` 主文件，WAL 模式还包含尚未 checkpoint 的数据。建议使用 SQLite online backup 或短暂停机进行一致性备份。

数据库结构版本为 4。使用新的数据目录部署，双方注册并配对；不提供旧数据导入或自动迁移。服务不会清空旧数据库，结构版本不匹配时直接拒绝启动。

解除配对只断开当前空间，旧消息／回忆记录仍保留数据库中。重新配对创建独立空间，不能通过新关系看到旧空间的数据。删除回忆移除其相册记录，保留原始上传文件，避免误删同时用于聊天或头像的媒体。当前版本不自动清理原文件；需定期监控磁盘容量。

## AI 服务

“我们”里填兼容 OpenAI Chat Completions 的根地址（一般为 `https://provider.example/v1`）、模型 ID 和 Key，开启助手。可以为助手单独设置名称与头像，只使用配置的 `@名称`。服务必须支持 function calling。

URL 默认只能使用 HTTPS，DNS 每次连接检查并拒绝本机、内网和链路本地地址，且不跟随重定向。自托管 Ollama 等内网服务须管理员显式设置 `AI_ALLOWED_HOSTS=ollama.internal` 后，用户才可配置 `http://ollama.internal:11434/v1`。不要将任意不可信域名放入白名单。

AI Key 使用 AES-256-GCM 加密，仅服务端解密调用；GET 设置接口不会返回 Key。切换 AI URL 会清空旧 URL 的密钥，防止把旧凭据发送给新服务。当前指令、昵称和本次附件 ID 发给选定 AI 服务，工具返回的纪念日／媒体列表也会发给该服务；不会自动发送全部聊天历史或媒体二进制。

这是自托管两人应用，SQLite / Socket.IO 为单进程架构。水平扩展前需改用 PostgreSQL、Socket.IO Redis adapter 和共享媒体存储。

## 日期语义

纪念日只允许今天或过去的公历日期，包含当天，从第 1 天开始累计。To Do 使用独立表和独立导航，支持具体日期、不重复或每年重复、公历或农历。日期以北京时间的日历天计算。农历支持 1900–2100 年，选填闰月；普通七夕选择农历七月初七且不选闰月。每年重复时，小月没有三十按该月最后一天，闰月只在该闰月存在的年份重复。公历 2/29 在非闰年按 2/28。循环事项完成后自动跳到下一次，支持撤销；一次性事项逾期会显示“已逾期”，完成后标记已完成。

AI 名称和头像属于每个用户自己的助手配置，修改不影响真人资料。头像必须使用当前空间内自己上传的图片。新的 AI 回复保存当时的名称和头像快照，另一半也能看到，之后改名不会改写旧聊天记录。`update_ai_profile` 修改助手本身，`update_profile` 修改发起者个人资料。
