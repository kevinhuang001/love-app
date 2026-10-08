# SQLite 与 PostgreSQL

后端提供两种数据库驱动，共用相同 API、权限与存储限额规则。默认使用 SQLite；设置 `DATABASE_URL=postgresql://...` 会选择 PostgreSQL，也可显式设置 `DATABASE_PROVIDER=sqlite` 或 `postgres`。`DATABASE_PROVIDER=postgres` 且没有 URL 时使用标准 `PGHOST`、`PGPORT`、`PGDATABASE`、`PGUSER`、`PGPASSWORD` 环境变量。

## 首次 Docker 部署

```sh
./love up
```

只需 Docker Engine 和 Compose 插件，无需在宿主机安装 Node.js。没有 `.env` 时，启动器先构建镜像，用 Docker 的交互终端运行配置向导，再启动并等待服务健康。

也可使用 `LOVE_IMAGE=ghcr.io/kevinhuang001/love-app:latest ./love up` 直接拉取镜像；从 Release 导入镜像后的免构建用法见 [预构建镜像部署](container-images.md)。

向导包含：

- 数据库：SQLite（默认）、Compose 内置 PostgreSQL 18、外部 PostgreSQL。
- 访问：域名与自动 HTTPS，或仅本机 HTTP；HTTP 端口默认 3000。
- 管理员：用户名默认 `admin`，密码可输入或留空自动生成。
- 容量：新配对默认 1024 MiB，0 禁止新增上传。
- SMTP：可选配置主机、端口、加密、账号、授权码、发件邮箱及初始注册方式。默认仅管理员建号，后续可在后台配置邮件注册。

密码与 URL 输入隐藏。媒体签名/加密密钥自动生成；配置写入权限 0600 的 `.env`，不显示密码。自动生成的管理员密码在 `.env` 的 `ADMIN_PASSWORD` 中。保存前显示无密码摘要，取消不会改动已有文件。

再次执行 `./love up` 复用配置。`./love setup` 重新运行向导，空密码保留原值，媒体密钥保持不变。重建容器复用命名卷；`./love down` 停止服务并保留卷。`./love logs` 查看日志，`./love ps` 查看状态。已有手写 `.env` 的部署也可继续使用直接 Compose 命令。

初始 SMTP、注册方式与默认容量仅在数据库尚无管理配置时写入，之后以后台保存的配置为准。管理入口仍为 `/#admin`，前台不显示入口。

## 直接配置 Compose

SQLite：

```sh
docker compose -p love-v4 --profile https up -d --build --wait
```

内置 PostgreSQL：在 `.env` 设置 `POSTGRES_PASSWORD`，可选设置 `POSTGRES_USER=love`、`POSTGRES_DB=love`，然后：

```sh
docker compose -p love-v4 -f compose.yml -f compose.postgres.yml --profile https up -d --build --wait
```

覆盖文件使用独立 `postgres-data` 卷，挂载 PostgreSQL 18 的 `/var/lib/postgresql`，不会向宿主机发布数据库端口。应用等待数据库健康后启动。图片和视频继续保存在 `love-data` 卷中；PostgreSQL 保存账号、配对、聊天、日期、配置、容量和日志等结构化数据。

连接外部数据库：只使用 `compose.yml`，设置：

```dotenv
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://love:URL编码后的密码@database.example.com:5432/love?sslmode=verify-full
```

可以显式设为 `DATABASE_PROVIDER=sqlite` 并清空 URL，恢复使用 `DATABASE_PATH` 指定的 SQLite 文件。切换数据库不搬迁数据，两种后端拥有各自的账号和内容；现有 SQLite schema 4 文件可继续使用。媒体密钥与上传文件需要一同备份。

## PostgreSQL 备份

```sh
docker compose -p love-v4 -f compose.yml -f compose.postgres.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > love-postgres.sql
```

恢复时使用同一数据库用户及数据库名，将 SQL 输入 `psql`，并恢复对应上传文件与媒体密钥。不要把数据库备份或 `.env` 放到公开仓库。

## 验证

CI 分别对 SQLite 与真实 PostgreSQL 运行相同后端测试，覆盖认证、一次性验证码、配对隔离、头像/视频、并发容量限制、AI 工具与本地通知事件流。Docker CI 分别测试两种部署，并重建 PostgreSQL 与应用容器验证持久化。终端向导测试覆盖默认值、配置复用、取消及 Compose 对特殊密码的解析。
