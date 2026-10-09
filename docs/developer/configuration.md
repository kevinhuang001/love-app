# 配置参考

服务器部署参数由 `love` 写入 `.env`，容器启动时读取。注册、邮件、邀请码、额度和日志保留规则由网页后台写入数据库。个人偏好及两人设置由客户端保存或通过 API 更新。

## 后端运行参数

| 参数                   | 默认或要求                                                  | 用途                                         |
| ---------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| `PORT`                 | 3000                                                        | 后端 HTTP 端口；标准容器固定使用 3000        |
| `NODE_ENV`             | 容器为 production                                           | 生产模式要求媒体密钥和管理员凭据             |
| `DATABASE_PROVIDER`    | 未填时按 URL 判断                                           | `sqlite` 或 `postgres`                       |
| `DATABASE_URL`         | 空                                                          | PostgreSQL 连接串；填写后默认选择 PostgreSQL |
| `DATABASE_PATH`        | 本地 `../../data/love.sqlite`；容器 `/app/data/love.sqlite` | SQLite 路径，本地相对 server 工作目录        |
| `UPLOADS_PATH`         | 本地 `../../data/media`；容器 `/app/data/media`             | SQLite 媒体及处理临时文件目录                |
| `ADMIN_USERNAME`       | 3～24 位小写字母、数字、下划线                              | 启动时同步的管理员账号                       |
| `ADMIN_PASSWORD`       | 12～128 字符                                                | 启动时同步的管理员密码                       |
| `MEDIA_SIGNING_SECRET` | 生产环境至少 32 字符                                        | 媒体签名、验证码摘要和加密凭据；必须稳定保管 |

管理员凭据变更后，旧后台会话撤销。未变更时保留原会话。自助注册等业务设置不通过启动环境变量覆盖。

PostgreSQL 示例，特殊字符按 URL 规则编码：

```dotenv
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://love:URL编码后的密码@db.example.com:5432/love?sslmode=verify-full
```

显式设置 `postgres` 而未填 URL 时，驱动读取标准 `PGHOST`、`PGPORT`、`PGDATABASE`、`PGUSER`、`PGPASSWORD`。内置 PostgreSQL 的 Compose 覆盖文件使用这些参数连接容器。

## PostgreSQL 连接参数

| 参数                       | 默认值 | 有效范围与含义                      |
| -------------------------- | ------ | ----------------------------------- |
| `PG_CONNECTION_TIMEOUT_MS` | 60000  | 1000～3600000；获取连接超时，毫秒   |
| `PG_QUERY_TIMEOUT_MS`      | 120000 | 1000～3600000；服务端语句超时，毫秒 |
| `PG_RETRY_ATTEMPTS`        | 3      | 1～10；包含首次的尝试次数           |
| `PG_RETRY_DELAY_MS`        | 1000   | 0～60000；初始重试间隔，毫秒        |

客户端查询超时比服务端多 10 秒，以接收服务端取消结果。重试区分读取、明确回滚和提交结果未知；增加次数不等于可以安全重复所有写入。实现见 [数据库文档](database.md#连接故障与重试)。

## 管理程序与 Compose 参数

| 参数                                                  | 含义                                                 |
| ----------------------------------------------------- | ---------------------------------------------------- |
| `LOVE_IMAGE`                                          | 官方应用镜像；默认 latest，管理更新后记录固定 digest |
| `COMPOSE_PROJECT_NAME`                                | 项目名，默认 `love-v4`；更改可能使用另一组数据卷     |
| `LOVE_DATABASE`                                       | `sqlite`、`postgres`（内置）、`external`             |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | 初始化内置 PostgreSQL 的数据库、用户、密码           |
| `LOVE_DATA_VOLUME`                                    | 应用卷，默认 `love-data`；也可使用 `postgres-work`   |
| `LOVE_BIND_IP` / `LOVE_PORT`                          | 宿主机 HTTP 监听 IP 和端口，默认 127.0.0.1:3000      |
| `LOVE_HTTPS`                                          | 1 启用 HTTPS，0 使用 HTTP                            |
| `LOVE_DOMAIN`                                         | HTTPS 域名，不带协议或路径                           |
| `LOVE_TLS_PROVIDER`                                   | `certbot`、`caddy`、`external`；HTTP 为 `none`       |
| `LOVE_TLS_BIND_IP` / `LOVE_TLS_PORT`                  | 内置 HTTPS 的监听 IP 和端口，通常 0.0.0.0:443        |
| `CERTBOT_EMAIL`                                       | Certbot 联系邮箱                                     |

`LOVE_PORT` 是宿主机映射端口，不等于容器中的 `PORT`。内置 HTTPS 组合会移除后端的宿主机 HTTP 映射，让代理通过容器网络访问 `love:3000`。

更改已有 PostgreSQL 容器的初始化环境变量，不会自动修改数据库里已经创建的角色密码。需让数据库实际密码与连接配置一致；不要删卷来“应用密码”。

## AI 与访问控制

| 参数               | 用途                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGINS`  | 允许的客户端来源，逗号分隔；需包含实际 Web 地址及 Android 的 `https://localhost`、`capacitor://localhost` |
| `TRUST_PROXY`      | 1 表示信任一层代理；应用端口必须只让可信代理访问，直接公开 HTTP 使用 0                                    |
| `AI_ALLOWED_HOSTS` | 明确允许的内网 AI 主机名，逗号分隔                                                                        |
| `VITE_API_URL`     | 可选的前端构建参数；独立托管 Web 时设置默认 API 地址                                                      |

AI 默认只允许 HTTPS，并检查 DNS 地址，拒绝本机、内网和链路本地目标。连接自托管 Ollama 等内网服务时，可以设置：

```dotenv
AI_ALLOWED_HOSTS=ollama.internal
```

客户端随后可配置 `http://ollama.internal:11434/v1`。主机必须能从后端容器解析和访问；不要把任意不可信主机加入列表。

## 生效方式

`love` 的部署向导负责校验、保存 `.env` 并应用配置。手工修改 `.env` 后需重新创建容器，普通 `docker compose restart` 不会重新读取新的容器环境变量。

后台业务设置保存后立即生效。“我们”中的 AI、媒体保留策略和在一起时间属于当前配对。个人主题、服务器地址和通知选择按用户或设备保存。
