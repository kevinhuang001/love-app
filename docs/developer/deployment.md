# 手工部署与镜像构建

本文面向需要维护 Compose、接入已有反向代理或修改镜像的开发者。只想安装和运行 Love，请用[安装指南](../user/install.md)和[管理程序](../user/manage.md)。手工部署需自行管理配置、持久化目录和升级。

## 仓库模板和部署目录

仓库中的 Dockerfile 和基础 Compose 模板位于 `infra/docker/`；HTTPS、Caddy 和 Certbot 文件位于 `infra/certificates/`。这些是管理程序编译时嵌入的源文件。

管理程序安装后，会把 Compose 文件、Caddyfile 和证书脚本生成到部署目录。下文 Compose 命令针对这个生成后的目录，文件名保持不变。不要直接在 `infra/docker/` 启动服务：模板的相对挂载路径按部署目录设计。测试在仓库读取模板时会显式指定项目目录，或先生成完整部署目录。

## Compose 文件如何组合

| 文件                   | 用途                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `compose.yml`          | 应用、持久化工作目录和可选 Caddy 服务                        |
| `compose.postgres.yml` | 增加 PostgreSQL 18 容器，并让应用连接它                      |
| `compose.https.yml`    | 移除应用公开端口，配置代理公开端口；要求 Compose ≥ 2.24.4    |
| `compose.certbot.yml`  | 使用 Certbot 的 HTTP-01 申请和续期，代理等待证书后提供 HTTPS |
| `compose.storage.yml`  | 管理程序切换数据库时使用的工作卷覆盖配置                     |

推荐先运行管理程序完成配置，再查看它生成的 `.env` 和 Compose 文件。下面命令在这些文件所在目录运行，不能直接在未配置密钥的空目录执行。

SQLite、HTTP：

```bash
docker compose -f compose.yml up -d love
```

自带 PostgreSQL、HTTP：

```bash
docker compose -f compose.yml -f compose.postgres.yml up -d love
```

SQLite、Caddy HTTPS：

```bash
docker compose -f compose.yml -f compose.https.yml --profile https up -d
```

需要自带 PostgreSQL时加 `-f compose.postgres.yml`。使用 Certbot 方案再加 `-f compose.certbot.yml`；不要同时让另一套代理占用相同公开端口。域名、开放端口与证书方案必须匹配，详见[安装指南](../user/install.md)。

`compose.yml` 默认将应用端口绑定到 `127.0.0.1:3000`。直接让其他设备访问 HTTP 时，显式配置 `LOVE_BIND_IP`、`LOVE_PORT` 和 `ALLOWED_ORIGINS`。HTTPS 覆盖文件移除应用端口映射，只公开代理端口。

SQLite 数据库和媒体保存在应用数据卷；PostgreSQL 模式的业务记录与媒体二进制保存在数据库卷。应用仍需要持久化工作目录。不要把容器可写层当作备份，也不要在不了解卷用途时运行 `docker compose down -v`。

外部 PostgreSQL 使用 `compose.yml`，配置 `DATABASE_PROVIDER=postgres` 和 `DATABASE_URL`，无需启动自带数据库容器。数据库地址必须从应用容器内可达。完整变量见[配置参考](configuration.md)。

## 接入已有反向代理

应用本身提供 HTTP，TLS 可由已有的 Caddy、Nginx 或其他代理终止。代理需要支持 WebSocket、SSE、长时间视频上传与下载。只运行 love 服务，不启动仓库自带代理。

同机 Caddy 示例：

```caddyfile
love.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Nginx 可在已有 HTTPS `server` 中增加以下 location；证书和监听端口沿用你已有的配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_buffering off;
    client_max_body_size 0;
    proxy_read_timeout 24h;
    proxy_send_timeout 24h;
}
```

`client_max_body_size 0` 取消 Nginx 的请求体大小限制，上传容量仍由应用管理。代理缓冲关闭，通知事件才会及时到达客户端。若使用更严格的代理限制，应确认大视频和通知流仍能正常工作。

后端只接受这一层可信代理时设 `TRUST_PROXY=1`，并将 `ALLOWED_ORIGINS` 设置为真实访问 origin，同时保留 Android origin。远程代理连接后端时，用受限的私网地址；不要把信任代理的后端端口直接暴露到公网。

## 本地构建镜像

在仓库根目录：

```bash
docker build -t love-development -f infra/docker/Dockerfile .
```

手工 Compose 可设置 `LOVE_IMAGE=love-development` 使用它。管理程序使用官方 GHCR 镜像，不负责管理自定义镜像。

国内构建源版本：

```bash
docker build -t love-development-cn -f infra/docker/Dockerfile.cn .
```

`Dockerfile.cn` 默认使用 npmmirror 和 USTC 软件源，并保留 `NODE_IMAGE`、`NPM_REGISTRY`、`PIP_INDEX_URL` 构建参数。它改变构建来源，不改变应用功能或数据格式。CI 分别构建两份 Dockerfile；官方发布镜像由 Actions 生成 AMD64 / ARM64 清单。镜像发布条件见 [CI 与发布](ci.md)。

## 不用 Docker 运行服务端

先按[本地开发](getting-started.md)安装 Node 24、FFmpeg、ffprobe 和字体，并准备 `.env`。生产环境必须设置管理员账号、至少 32 字符的稳定媒体密钥、允许的 origin 和持久化路径。

在仓库根目录构建和启动：

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

start 脚本在 `apps/server` 内运行，读取仓库根目录 `.env`。相对数据库与上传路径按服务端工作目录解析，见[配置参考](configuration.md)。生产构建同时提供 Web 静态页面；开发模式使用 Vite 单独提供前端。

生产环境用 systemd 或你的进程管理器保持服务运行，明确设置工作目录和持久化路径。管理程序的备份恢复流程面向 Docker 部署；非 Docker 部署需自行安排数据库、媒体和密钥的一致备份，不能只复制一个正在写入的 SQLite 文件。

## 升级和排错

手工部署修改 `.env` 后需重新创建容器。升级前备份，拉取镜像后重建服务；容器 restart 不会重新读取 Compose 环境变量。启动时自动执行数据库迁移，失败不会跳过迁移继续提供服务。

检查 `docker compose logs --tail=100 love` 和 `/api/health`。使用多个 Compose 文件时，查看日志、重建和停止服务都要带同一组文件。备份方向限制、旧格式边界见[备份格式](backup-format.md)，具体恢复操作见[日常维护](../user/manage.md)。
