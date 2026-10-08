# SQLite 与 PostgreSQL

后端提供两种数据库驱动，共用相同 API、权限与存储限额规则。默认使用 SQLite；设置 `DATABASE_URL=postgresql://...` 会选择 PostgreSQL，也可显式设置 `DATABASE_PROVIDER=sqlite` 或 `postgres`。`DATABASE_PROVIDER=postgres` 且没有 URL 时使用标准 `PGHOST`、`PGPORT`、`PGDATABASE`、`PGUSER`、`PGPASSWORD` 环境变量。

## 首次 Docker 部署

```sh
./love
```

只需 Docker Engine 和 Compose 插件，无需在宿主机安装 Node.js。在菜单选择首次配置，下载已构建镜像，用 Docker 交互终端运行配置向导，再按提示启动并等待服务健康。

菜单只从官方 GHCR 拉取镜像；详细管理用法见 [预构建镜像部署](container-images.md)。

向导包含：

- 数据库：SQLite（默认）、Compose 内置 PostgreSQL 18、外部 PostgreSQL。
- 访问：可选 HTTP 或 HTTPS；HTTPS 支持 Certbot 自动申请/续期、Caddy 自动证书，或已有反向代理。HTTP 监听 IP 可选 `127.0.0.1`（默认，仅本机）、`0.0.0.0`（全部 IPv4 网卡，用于局域网/公网）或指定宿主机 IPv4/IPv6；端口默认 3000。
- 管理员：用户名默认 `admin`，密码可输入或留空自动生成。
- 注册、邀请码、SMTP、容量与日志期限：在后台配置，向导不写入这些业务设置。

密码与 URL 输入隐藏。媒体签名/加密密钥自动生成；配置写入权限 0600 的 `.env`，不显示密码。自动生成的管理员密码在 `.env` 的 `ADMIN_PASSWORD` 中。保存前显示无密码摘要，取消不会改动已有文件。

再次执行 `./love` 打开管理菜单，选择配置、启停、更新、日志、备份、恢复或卸载。空密码保留原值，媒体密钥保持不变；重建容器复用命名卷。详见 [管理菜单](container-images.md)。

公网 HTTP 直连：运行 `./love`，HTTPS 选“否”，HTTP 监听地址选 `0.0.0.0`，再运行 `./love`。开放所选端口后，用 `http://服务器实际IP:端口` 访问 Web 或配置 APK。`0.0.0.0` 是监听地址，不能填进手机服务器 URL；指定 IP 必须是宿主机已有网卡的地址，云服务器通过 NAT 提供公网 IP 时通常选 `0.0.0.0`。HTTP 未加密，公网建议使用 HTTPS。向导保持 Android 所需的跨域来源，并在直接 HTTP 暴露时设置 `TRUST_PROXY=0`。

SMTP、注册方式、邀请码、默认与独立配对额度保存在数据库，仅通过后台修改。管理员凭据以 .env 为准，每次启动同步。管理入口仍为 `/#admin`，前台不显示入口。

## 直接配置 Compose

SQLite：

手动 `.env` 可设置 `LOVE_BIND_IP=0.0.0.0`、`LOVE_PORT=3000`、`LOVE_HTTPS=0`、`TRUST_PROXY=0`，无需修改 Compose。使用 `./love` 会按 `LOVE_HTTPS` 和 `LOVE_TLS_PROVIDER` 自动选择代理及 Certbot 配置；直接 Compose 请自行组合 profile 和文件，见 [部署文档](deployment.md)。

```sh
docker compose -p love-v4 --profile https up -d --no-build --wait
```

内置 PostgreSQL：在 `.env` 设置 `POSTGRES_PASSWORD`，可选设置 `POSTGRES_USER=love`、`POSTGRES_DB=love`，然后：

```sh
docker compose -p love-v4 -f compose.yml -f compose.postgres.yml --profile https up -d --no-build --wait
```

覆盖文件使用独立 `postgres-data` 卷，挂载 PostgreSQL 18 的 `/var/lib/postgresql`，不会向宿主机发布数据库端口。应用等待数据库健康后启动。图片和视频继续保存在 `love-data` 卷中；PostgreSQL 保存账号、配对、聊天、日期、配置、容量和日志等结构化数据。

连接外部数据库：只使用 `compose.yml`，设置：

```dotenv
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://love:URL编码后的密码@database.example.com:5432/love?sslmode=verify-full
```

可以显式设为 `DATABASE_PROVIDER=sqlite` 并清空 URL，恢复使用 `DATABASE_PATH` 指定的 SQLite 文件。切换数据库不搬迁数据，两种后端拥有各自的账号和内容；现有 schema 4 / 5 / 6 / 7 / 8 数据在启动时原子升级到 schema 9，将日期时间默认补为 00:00:00；schema 4 的 AI 配置归入配对空间；SQLite 与 PostgreSQL 均支持该升级。媒体密钥与上传文件需要一同备份。

## PostgreSQL 超时与重试

以下是部署参数，放在 `.env`；`./love` → 部署配置 → 高级部署选项可修改，重新创建应用容器后生效。

| 参数                       | 默认值   | 含义                                                        |
| -------------------------- | -------- | ----------------------------------------------------------- |
| `PG_CONNECTION_TIMEOUT_MS` | `60000`  | 每次获取数据库连接最多等待 60 秒                            |
| `PG_QUERY_TIMEOUT_MS`      | `120000` | 服务端每条 SQL 最多 120 秒；客户端额外留 10 秒接收取消结果  |
| `PG_RETRY_ATTEMPTS`        | `3`      | 连接、独立读取、媒体数据库事务各阶段最多尝试 3 次，包含首次 |
| `PG_RETRY_DELAY_MS`        | `1000`   | 重试间隔从 1 秒开始指数递增，单次最多 60 秒                 |

连接和独立读取发生暂时断线、超时或数据库启动中等错误时自动重试。认证错误、重复数据和 SQL 错误不重试。一般写操作只重试 PostgreSQL 明确拒绝或回滚的语句；不重复执行网络断线后结果未知的写入。一般事务仅在执行业务回调之前重试连接及锁获取。

媒体上传、头像及完整相册导入的数据库回调只包含数据库操作，使用预先分配的媒体 ID；已确认未提交的暂时故障会重试整个媒体事务。`COMMIT` 响应丢失时先重新连接、获取同一个事务锁并核对媒体/容量记录或导入摘要；确认成功直接返回原结果，确认未保存才重试。如果数据库一直不可用，返回 503 并保留已落盘文件，避免误删可能已提交的数据。

## 媒体落盘与计量

图片完整解码、视频完整转码之后，检查每个保留文件为非空普通文件，调用文件 `fsync`，再同步媒体目录。随后在同一事务内重新核对账号、会话、配对、保存策略与最新配额，一起提交媒体记录和实际落盘字节数。处理中及已确认回滚的上传不占配对额度；失败会清理临时文件和生成文件，并发上传不能超额。只保留压缩图/视频时只计算实际保留的文件。SQLite 使用 WAL 与 FULL 同步；PostgreSQL 的媒体与容量记录也在同一个事务提交。

文件系统与数据库不是同一个事务资源：进程/主机意外终止可能留下尚未登记的文件，但这些文件不进入用户额度；提交结果未知且数据库无法恢复连接时也不会冒险删除。底层存储仍需正常支持 `fsync`，备份需要同时包含数据库和媒体。

## PostgreSQL 备份

```sh
docker compose -p love-v4 -f compose.yml -f compose.postgres.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > love-postgres.sql
```

恢复时使用同一数据库用户及数据库名，将 SQL 输入 `psql`，并恢复对应上传文件与媒体密钥。不要把数据库备份或 `.env` 放到公开仓库。

## 验证

CI 分别对 SQLite 与真实 PostgreSQL 运行相同后端测试，覆盖认证、一次性验证码、配对隔离、头像/视频、并发容量限制、AI 工具与本地通知事件流。Docker CI 分别测试两种部署，并重建 PostgreSQL 与应用容器验证持久化。终端向导测试覆盖默认值、绑定 IP 校验/复用、取消及 Compose 对特殊密码的解析，Docker 测试检查实际容器的 `0.0.0.0` 端口绑定。
