# 数据库与媒体存储

后端通过 `apps/server/src/db.ts` 的异步 `DB` 接口访问 SQLite 和 PostgreSQL。打开数据库时先完成迁移，随后才返回给业务层。

详细字段分别见 [SQLite 表结构](database-sqlite.md) 和 [PostgreSQL 表结构](database-postgresql.md)。事务与失败处理见[实现细节](implementation/transactions.md)。

## 接口约定

`prepare(sql)` 提供 `get`、`all`、`run`；`exec` 执行 SQL；`transaction` 包装异步回调。业务查询使用 `?` 参数，不拼接用户值。

PostgreSQL 适配层把占位符和部分 SQL 语法转换为驱动格式，并引用驼峰列名。需要 PostgreSQL 特有查询时仍使用明确的参数和标识符处理。安全整数检查防止 BIGINT 被静默转换成不精确的 JavaScript Number。

SQLite 使用 WAL、外键检查和进程内事务队列，写事务为 `BEGIN IMMEDIATE`。PostgreSQL 使用连接池，事务中的查询通过 AsyncLocalStorage 固定到同一个 client；写事务获取 advisory lock。只读备份可使用 repeatable-read 快照。

## 表的职责

| 范围            | 主要表                                                                                                                    | 存储内容                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 账号与配对      | `users`、`couples`、`sessions`、`invites`                                                                                 | 用户、两人空间、会话摘要、配对邀请   |
| 聊天            | `messages`、`message_media`                                                                                               | 消息及有顺序的附件关联               |
| 回忆与日程      | `moments`、`anniversaries`、`todos`、`album_imports`                                                                      | 回忆、纪念日、待办、相册导入去重     |
| 媒体与额度      | `media`、`media_sizes`、`media_uploads`、`couple_limits`                                                                  | 元数据、真实容量、暂存上传、空间额度 |
| 两人设置与 AI   | `couple_media_settings`、`couple_ai_settings`、`ai_jobs`、`ai_actions`                                                    | 保留策略、AI 配置、任务和工具结果    |
| 后台与认证      | `administrators`、`admin_sessions`、`server_config`、`captchas`、`email_codes`、`email_allowlist`、`registration_invites` | 管理员、业务规则、验证和注册控制     |
| 日志            | `access_logs`、`server_logs`、`audit_logs`                                                                                | 请求、服务事件、管理操作             |
| 迁移记录        | `schema_migrations`                                                                                                       | 已执行增量的编号、名称、校验和和时间 |
| PostgreSQL 专用 | `media_files`、`media_chunks`                                                                                             | 正式媒体及暂存媒体的二进制分块       |

完整字段、索引和约束以 [迁移 001](../../apps/server/src/migrations/001-initial.ts) 为起点，之后按增量累积。恢复操作还会在 PostgreSQL 创建内部 `database_restores` 记录，用于核对不确定的提交结果。

## 媒体存储

SQLite 的 `media` 记录文件名，媒体字节放在 `UPLOADS_PATH`。备份需要数据库和引用的媒体文件，不能只复制 SQLite 主文件。

PostgreSQL 中，`media_files` 保存名字、归属、字节数、SHA-256、完成状态和更新时间。`media_chunks` 按文件名与块编号保存 BYTEA，每块最多 1 MiB。原图、原视频、预览、缩略图及个人头像都走该存储接口。上传和转码仍需要临时磁盘。

上传先写暂存数据；发布时绑定媒体并在同一事务中提交容量和业务关联。未绑定数据不计正式配额，启动时清理 24 小时未更新的未绑定 PostgreSQL 暂存分块。管理清理需要先核对当前引用，不能按文件年龄直接删正式媒体。

`MediaRepository` 提供信息、流式读取和摘要，支持按区间读取视频。SQLite 与 PostgreSQL 的 API 返回保持一致。

## 连接故障与重试

`postgres.ts` 只在确认安全的阶段自动重试。认证错误、SQL 错误和唯一约束冲突不当作临时网络故障。

普通事务在进入业务回调前重试连接和锁获取；进入回调后，失败应回滚整个事务。媒体操作若明确未提交，可以重试数据库回调。COMMIT 响应丢失时不能直接再执行一次：先重新连接、获取同一锁并查询事务结果标记，确认已经提交就返回原结果。

无法确认时保留可能仍被数据库引用的文件和分块，并返回 503。不能为了“清理失败上传”而删除提交状态未知的数据。

## 数据库切换

两种驱动不共享存储。修改连接设置不会自动搬迁。统一备份以 SQLite 快照和媒体文件表达数据，恢复时再转换为目标存储，见 [备份格式](backup-format.md)。

不提供旧 schema 4～9 或旧磁盘媒体的运行时兼容。新数据库迁移体系见 [迁移规范](migrations.md)。
