# 部署与数据

推荐首次部署运行 `./love up`，通过现代终端向导配置必需选项并自动启动。SQLite 为默认值，也可选择内置或外部 PostgreSQL。见 [数据库与部署向导](database.md)。以下直接 Compose 步骤适用于手动管理 `.env` 的部署。

## Docker

推荐 `./love setup` 配置 HTTP 或 HTTPS，再运行 `./love up`。以下为手动配置 Caddy 自动 HTTPS 的示例，需要可访问的域名。先 `cp .env.docker.example .env`，再设置 `.env`：

```dotenv
MEDIA_SIGNING_SECRET=替换为至少32字符的稳定随机密钥
ALLOWED_ORIGINS=https://love.example.com,https://localhost,capacitor://localhost
TRUST_PROXY=1
LOVE_DOMAIN=love.example.com
LOVE_HTTPS=1
LOVE_TLS_PROVIDER=caddy
LOVE_TLS_PORT=8013
LOVE_TLS_BIND_IP=0.0.0.0
ADMIN_USERNAME=你的管理员用户名
ADMIN_PASSWORD=至少12字符的随机密码
```

`MEDIA_SIGNING_SECRET` 同时用于媒体链接签名、验证码摘要、SMTP 密码和 AI Key 加密，备份时必须保存，轮换后 SMTP 密码和 AI Key 需要重新填写。管理员启动变量仅创建首个账号，创建后移除两个变量；管理员独立访问 `/#admin` 配置 SMTP 和注册政策，用户页面不显示入口。`TRUST_PROXY=1` 仅适用于恰好一层可信反向代理，不要直接暴露该配置的服务。

```bash
docker compose -p love-v4 -f compose.yml -f compose.https.yml --profile https up -d --build
```

数据保存于 Docker `love-data` volume。内置 HTTPS 使用 `compose.https.yml`，需要 Docker Compose 2.24.4 或更新版本。代理将宿主机 `LOVE_TLS_PORT` 转发到容器内部 TLS 端口 443；例如以上配置访问 `https://love.example.com:8013`，APK 填同样的完整地址。`LOVE_TLS_BIND_IP` 控制 HTTPS 监听地址，默认 `0.0.0.0`。后端 `love:3000` 仅在容器网络内访问，不发布 HTTP 端口，因此不会与所选 HTTPS 端口冲突。默认 HTTPS 端口仍为 443。

先将 `LOVE_DOMAIN` 的 DNS 指向服务器，开放 TCP 80 和选定的 HTTPS 端口。80 用于自动证书验证及 HTTP 跳转，HTTPS 端口不能设为 80。已有反向代理选择 external，由自己的代理发布 HTTPS；其后端 HTTP 绑定由 `LOVE_BIND_IP` / `LOVE_PORT` 控制。只运行基础 Compose 时不启动内置代理。

直接 HTTP 访问可在 `.env` 配置：

```dotenv
LOVE_BIND_IP=0.0.0.0
LOVE_PORT=3000
LOVE_HTTPS=0
LOVE_TLS_PROVIDER=none
TRUST_PROXY=0
```

运行 `./love up`（或不加 HTTPS profile 的 Compose），开放所选端口；浏览器和 APK 使用 `http://服务器实际IP:3000`。`0.0.0.0` 只用于监听，不能当手机的服务器地址。已有部署可执行 `./love setup` 修改监听 IP，再 `./love up` 重新创建服务；数据卷保留。HTTP 未加密，公网建议配置 HTTPS。

HTTP 响应不会发送 `upgrade-insecure-requests`、COOP、Origin-Agent-Cluster 或 HSTS；HTTPS 响应保留这些保护。通过可信代理提供 HTTPS 时设置 `TRUST_PROXY=1`，代理必须传递正确的 `X-Forwarded-Proto`，且应用端口只能由代理访问。直接公开 HTTP 端口必须使用 `TRUST_PROXY=0`。如果旧版本出现 HTTP 页面却请求 `https://域名:HTTP端口/assets/...`，更新后端镜像并重新创建服务，再强制刷新页面；仅更新 APK 无法修复 Web 响应头。

日志和健康状态：`docker compose logs -f love proxy`、`docker compose ps`。数据持久化：`love-data` 保存数据库和媒体，`caddy-data` 保存证书。不要使用 `down -v` 进行普通更新；升级用 `./love up`。Docker 中使用内网 AI 时，请将其加入同一网络并设置 `AI_ALLOWED_HOSTS`。

Caddy 示例：

```caddy
love.example.com {
  request_body { max_size 105MB }
  reverse_proxy 127.0.0.1:3000
}
```

Nginx 需 `client_max_body_size 105m`、`proxy_read_timeout 300s` 以及 WebSocket Upgrade headers。不要将 `data/media` 映射为公开静态目录。API 通过一个小时有效的签名链接提供预览，支持视频 Range 请求。签名链接相当于短期访问凭据，不应公开转发。

## 初始化时选择证书方式

`./love setup` 先询问是否使用 HTTPS。选择“否”不需要域名或证书，支持 `0.0.0.0` 的公网 HTTP；设置 `LOVE_HTTPS=0`、`LOVE_TLS_PROVIDER=none`、`TRUST_PROXY=0`。

选择 HTTPS 后填写真实域名、证书方式、HTTPS 监听 IP 和访问端口。输入 8013 时，摘要和允许来源都使用 `https://你的域名:8013`；443 时省略端口。再选择：

| 方式            | 自动申请和续期                               | 运行服务                        |
| --------------- | -------------------------------------------- | ------------------------------- |
| Certbot（默认） | 是，每 12 小时检查；新证书在 30 秒内自动加载 | Love、Caddy 代理、Certbot       |
| Caddy           | 是，由 Caddy 管理                            | Love、Caddy                     |
| 已有反向代理    | 自行管理                                     | 仅 Love，使用自己的 Nginx/Caddy |

Certbot 还需联系邮箱。域名的 A/AAAA 必须正确指向本服务器，公网开放 TCP 80 和选定的 HTTPS 端口；若设置了 AAAA，IPv6 也必须可访问。80 用于 HTTP-01 验证，申请和续期期间都要保持开放。不要与其他服务争用这两个端口。

```dotenv
LOVE_HTTPS=1
LOVE_TLS_PROVIDER=certbot
LOVE_DOMAIN=你的真实域名
CERTBOT_EMAIL=你的邮箱
LOVE_TLS_BIND_IP=0.0.0.0
LOVE_TLS_PORT=8013
TRUST_PROXY=1
```

保存后执行 `./love up`，自动加入 `compose.https.yml` 和 `compose.certbot.yml`，无需安装宿主机 Certbot 或配置 cron。首次申请前代理只提供验证路径，其他请求返回 503，不会把账号密码通过 HTTP 暴露；申请成功后启用 HTTPS，HTTP 跳转到 HTTPS。Certbot 失败会写入日志，15 分钟后重试，启动器等待代理就绪而不会把“尚未取得证书”报告为 HTTPS 成功。检查 `./love logs`；排除 DNS/端口问题后，可在原目录运行以下命令立即重新尝试：

```sh
docker compose -p love-v4 -f compose.yml -f compose.https.yml -f compose.certbot.yml --profile https restart certbot
```

如果使用内置 PostgreSQL，命令增加 `-f compose.postgres.yml`；若修改了项目名，替换 `love-v4`。证书和 ACME 账户保存于 `certbot-certs` 数据卷，正常更新不能删除该卷。续期不停止应用、不使用 Docker socket；代理只读证书卷，并在证书内容变化后验证配置、平滑加载。

续期验证（需要真实域名和公网验证路径，使用测试 CA，不会替换正式证书）：

```sh
docker compose -p love-v4 -f compose.yml -f compose.https.yml -f compose.certbot.yml --profile https run --rm --entrypoint certbot certbot renew --dry-run
```

选择“已有反向代理”不会启动内置证书服务；按上面的 Caddy/Nginx 示例转发，代理传递 `X-Forwarded-Proto: https`。后端端口默认仅本机访问。选择 HTTP 时直接访问 `http://域名或IP:端口`，不要求 HTTPS 或 Certbot。

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
