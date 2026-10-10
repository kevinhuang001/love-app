# SQLite 表结构

本文列出数据库迁移版本 **1** 的实际表结构，用于写查询、修改代码和排查数据。字段说明是业务含义；数据库约束与应用校验分别列出。后续版本在此基础上追加增量。

建表来源：[迁移 001](../../apps/server/src/migrations/001-initial.ts)，迁移历史表来自 [migrations.ts](../../apps/server/src/migrations.ts)。运行机制见[数据库文档](database.md)。

## 类型、NULL 与存储

SQLite 数据库是 `love.sqlite`，媒体字节在独立 `media/` 目录；表内保存文件名。运行中采用 WAL，可能有 `love.sqlite-wal` 和 `love.sqlite-shm`，不要只复制主文件作为在线备份。

业务 UUID、日期、时间、JSON 和加密值均以 TEXT 保存；状态标记用 INTEGER 的 0 / 1，时长用 REAL。SQLite 为动态类型，字段声明与应用输入校验都需要维护。

下表的 NULL 列反映实际数据库约束。普通 SQLite 表的 TEXT / 复合 PRIMARY KEY 若未显式写 NOT NULL，仍可能接受 NULL；应用不会把这些 ID 当作可空字段。INTEGER PRIMARY KEY 则关联 rowid，插入 NULL 会自动分配编号。不要误以为 SQLite 的所有主键都隐含 NOT NULL。

共 29 张应用表，包括 `schema_migrations`。SQLite 还创建内部 `sqlite_sequence`，记录四张自增表的编号高水位；它不属于业务表，但备份恢复保留其中的序号。

## 表目录

| 表                                              | 用途                                     |
| ----------------------------------------------- | ---------------------------------------- |
| [couples](#couples)                             | 两人空间与关系开始时间                   |
| [users](#users)                                 | 普通用户资料、密码与当前配对             |
| [sessions](#sessions)                           | 用户登录会话                             |
| [invites](#invites)                             | 两人配对邀请码                           |
| [media](#media)                                 | 已发布媒体的元数据和文件名               |
| [media_sizes](#media_sizes)                     | 媒体容量记录                             |
| [media_uploads](#media_uploads)                 | 尚未发布的暂存上传                       |
| [messages](#messages)                           | 聊天消息与 AI 回复                       |
| [message_media](#message_media)                 | 一条消息的有序附件                       |
| [moments](#moments)                             | 回忆相册条目                             |
| [anniversaries](#anniversaries)                 | 纪念日                                   |
| [todos](#todos)                                 | 待办与重复日程                           |
| [couple_ai_settings](#couple_ai_settings)       | 每个两人空间的 AI 配置                   |
| [couple_media_settings](#couple_media_settings) | 原文件保留策略                           |
| [ai_jobs](#ai_jobs)                             | 聊天触发的异步 AI 任务                   |
| [ai_actions](#ai_actions)                       | AI 工具调用结果与去重                    |
| [administrators](#administrators)               | 后台管理员账号                           |
| [admin_sessions](#admin_sessions)               | 管理员登录会话                           |
| [server_config](#server_config)                 | 服务器业务设置和内部配置                 |
| [captchas](#captchas)                           | 图片验证码                               |
| [email_codes](#email_codes)                     | 邮件验证码                               |
| [email_allowlist](#email_allowlist)             | 注册邮箱白名单                           |
| [registration_invites](#registration_invites)   | 注册邀请码                               |
| [album_imports](#album_imports)                 | 已停用的历史历史相册导入去重（已停用）表 |
| [couple_limits](#couple_limits)                 | 两人空间额度                             |
| [access_logs](#access_logs)                     | HTTP 访问日志                            |
| [server_logs](#server_logs)                     | 服务事件日志                             |
| [audit_logs](#audit_logs)                       | 管理员操作日志                           |
| [schema_migrations](#schema_migrations)         | 已执行的数据库迁移历史                   |

## couples

两人空间与关系开始时间。

| 字段        | 类型   | 允许 NULL | 默认值       | 含义                                     |
| ----------- | ------ | --------- | ------------ | ---------------------------------------- |
| `id`        | `TEXT` | 是        | 无           | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `startDate` | `TEXT` | 是        | 无           | 关系开始日期；未设置时为 NULL            |
| `startTime` | `TEXT` | 否        | `'00:00:00'` | 关系开始时间，UTC+8                      |

约束与索引：

- 主键：`id`。

## users

普通用户资料、密码与当前配对。

| 字段            | 类型      | 允许 NULL | 默认值                                 | 含义                                     |
| --------------- | --------- | --------- | -------------------------------------- | ---------------------------------------- |
| `id`            | `TEXT`    | 是        | 无                                     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `username`      | `TEXT`    | 否        | 无                                     | 唯一登录用户名                           |
| `name`          | `TEXT`    | 否        | 无                                     | 显示名称                                 |
| `password`      | `TEXT`    | 否        | 无                                     | 带盐 scrypt 密码摘要                     |
| `coupleId`      | `TEXT`    | 是        | 无                                     | 所属两人空间 ID                          |
| `avatarMediaId` | `TEXT`    | 是        | 无                                     | 个人头像媒体 ID，可为空                  |
| `email`         | `TEXT`    | 否        | 无                                     | 唯一邮箱                                 |
| `verifiedAt`    | `TEXT`    | 是        | 无                                     | 邮箱确认时间；未确认时为 NULL            |
| `disabled`      | `INTEGER` | 否        | `0`                                    | 0 正常，1 停用                           |
| `createdAt`     | `TEXT`    | 否        | `strftime('%Y-%m-%dT%H:%M:%fZ','now')` | 创建时间，ISO UTC 字符串                 |
| `lastLoginAt`   | `TEXT`    | 是        | 无                                     | 最近登录时间，可为空                     |

约束与索引：

- 主键：`id`。
- 外键：`avatarMediaId` → `media.id`。
- 外键：`coupleId` → `couples.id`。
- 唯一约束：`email`。
- 唯一约束：`username`。

## sessions

用户登录会话。

| 字段      | 类型      | 允许 NULL | 默认值 | 含义                      |
| --------- | --------- | --------- | ------ | ------------------------- |
| `hash`    | `TEXT`    | 是        | 无     | 原始会话 token 的 SHA-256 |
| `userId`  | `TEXT`    | 否        | 无     | 关联用户 ID               |
| `expires` | `INTEGER` | 否        | 无     | 会话到期时间，Unix 毫秒   |

约束与索引：

- 主键：`hash`。
- 外键：`userId` → `users.id`。

## invites

两人配对邀请码。

| 字段      | 类型      | 允许 NULL | 默认值 | 含义                      |
| --------- | --------- | --------- | ------ | ------------------------- |
| `hash`    | `TEXT`    | 是        | 无     | 配对码摘要                |
| `userId`  | `TEXT`    | 是        | 无     | 关联用户 ID               |
| `expires` | `INTEGER` | 否        | 无     | 有效期结束时间，Unix 毫秒 |

约束与索引：

- 主键：`hash`。
- 外键：`userId` → `users.id`。

## media

已发布媒体的元数据和文件名。

| 字段        | 类型      | 允许 NULL | 默认值 | 含义                                     |
| ----------- | --------- | --------- | ------ | ---------------------------------------- |
| `id`        | `TEXT`    | 是        | 无     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `coupleId`  | `TEXT`    | 是        | 无     | 两人空间 ID；个人头像可为空              |
| `ownerId`   | `TEXT`    | 是        | 无     | 上传或发布用户 ID                        |
| `kind`      | `TEXT`    | 否        | 无     | image 或 video，由应用校验               |
| `original`  | `TEXT`    | 否        | 无     | 原文件名；不保留原文件时为空字符串       |
| `preview`   | `TEXT`    | 否        | 无     | 压缩预览文件名                           |
| `thumbnail` | `TEXT`    | 否        | 无     | 缩略图或视频封面文件名                   |
| `width`     | `INTEGER` | 是        | 无     | 像素宽度，可为空                         |
| `height`    | `INTEGER` | 是        | 无     | 像素高度，可为空                         |
| `duration`  | `REAL`    | 是        | 无     | 视频时长，秒，可为空                     |
| `createdAt` | `TEXT`    | 否        | 无     | 创建时间，ISO UTC 字符串                 |

约束与索引：

- 主键：`id`。
- 外键：`ownerId` → `users.id`。
- 外键：`coupleId` → `couples.id`。

## media_sizes

媒体容量记录。

| 字段             | 类型      | 允许 NULL | 默认值 | 含义                       |
| ---------------- | --------- | --------- | ------ | -------------------------- |
| `mediaId`        | `TEXT`    | 是        | 无     | 关联媒体 ID                |
| `originalBytes`  | `INTEGER` | 否        | 无     | 原文件字节数；未保留时为 0 |
| `previewBytes`   | `INTEGER` | 否        | 无     | 压缩预览字节数             |
| `thumbnailBytes` | `INTEGER` | 否        | 无     | 缩略图字节数               |
| `totalBytes`     | `INTEGER` | 否        | 无     | 计入额度的媒体总字节数     |

约束与索引：

- 主键：`mediaId`。
- 外键：`mediaId` → `media.id`。

## media_uploads

尚未发布的暂存上传。

| 字段        | 类型   | 允许 NULL | 默认值 | 含义                                     |
| ----------- | ------ | --------- | ------ | ---------------------------------------- |
| `id`        | `TEXT` | 是        | 无     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `coupleId`  | `TEXT` | 否        | 无     | 所属两人空间 ID                          |
| `ownerId`   | `TEXT` | 否        | 无     | 上传或发布用户 ID                        |
| `metadata`  | `TEXT` | 否        | 无     | 待发布媒体 JSON，包含预览等文件名        |
| `createdAt` | `TEXT` | 否        | 无     | 暂存上传时间                             |

约束与索引：

- 主键：`id`。
- coupleId、ownerId 为 NOT NULL，但该暂存表未声明外键；发布时重新校验身份和归属。

## messages

聊天消息与 AI 回复。

| 字段                     | 类型      | 允许 NULL | 默认值     | 含义                                |
| ------------------------ | --------- | --------- | ---------- | ----------------------------------- |
| `id`                     | `INTEGER` | 否        | `自动分配` | 自动增长的消息编号                  |
| `coupleId`               | `TEXT`    | 否        | 无         | 所属两人空间 ID                     |
| `senderId`               | `TEXT`    | 否        | 无         | 发起用户 ID；AI 回复也关联发起用户  |
| `clientId`               | `TEXT`    | 否        | 无         | 客户端 UUID，用于同一用户的提交去重 |
| `content`                | `TEXT`    | 否        | 无         | 聊天正文                            |
| `createdAt`              | `TEXT`    | 否        | 无         | 创建时间，ISO UTC 字符串            |
| `readAt`                 | `TEXT`    | 是        | 无         | 对方已读时间，可为空                |
| `role`                   | `TEXT`    | 否        | `'user'`   | user 或 assistant，由应用写入       |
| `assistantName`          | `TEXT`    | 是        | 无         | 发送时的助手名称，可为空            |
| `assistantAvatarMediaId` | `TEXT`    | 是        | 无         | 发送时的助手头像，可为空            |

约束与索引：

- 主键：`id`。
- 外键：`assistantAvatarMediaId` → `media.id`。
- 外键：`senderId` → `users.id`。
- 外键：`coupleId` → `couples.id`。
- `messages_couple`：`coupleId`, `id`。
- 唯一约束：`senderId`, `clientId`。

## message_media

一条消息的有序附件。

| 字段        | 类型      | 允许 NULL | 默认值 | 含义                |
| ----------- | --------- | --------- | ------ | ------------------- |
| `messageId` | `INTEGER` | 否        | 无     | 关联消息 ID         |
| `mediaId`   | `TEXT`    | 否        | 无     | 关联媒体 ID         |
| `position`  | `INTEGER` | 否        | 无     | 从 0 开始的排列编号 |

约束与索引：

- 主键：`messageId`, `mediaId`。
- 外键：`mediaId` → `media.id`。
- 外键：`messageId` → `messages.id`，ON DELETE CASCADE。
- 唯一约束：`messageId`, `position`。
- CHECK：`position>=0`。

## moments

回忆相册条目。

| 字段        | 类型   | 允许 NULL | 默认值                                 | 含义                                     |
| ----------- | ------ | --------- | -------------------------------------- | ---------------------------------------- |
| `id`        | `TEXT` | 是        | 无                                     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `coupleId`  | `TEXT` | 否        | 无                                     | 所属两人空间 ID                          |
| `ownerId`   | `TEXT` | 是        | 无                                     | 上传或发布用户 ID                        |
| `title`     | `TEXT` | 否        | 无                                     | 标题或描述                               |
| `mediaId`   | `TEXT` | 否        | 无                                     | 关联媒体 ID                              |
| `date`      | `TEXT` | 否        | 无                                     | 回忆发生日期，不等于上传日期             |
| `createdAt` | `TEXT` | 否        | `strftime('%Y-%m-%dT%H:%M:%fZ','now')` | 上传时间；编辑发生日期不改变它           |

约束与索引：

- 主键：`id`。
- 外键：`mediaId` → `media.id`。
- 外键：`ownerId` → `users.id`。
- 外键：`coupleId` → `couples.id`。
- `moments_couple_uploaded`：`coupleId`, `createdAt`, `id`。
- `moments_couple_date`：`coupleId`, `date`, `id`。

## anniversaries

纪念日。

| 字段       | 类型   | 允许 NULL | 默认值       | 含义                                     |
| ---------- | ------ | --------- | ------------ | ---------------------------------------- |
| `id`       | `TEXT` | 是        | 无           | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `coupleId` | `TEXT` | 否        | 无           | 所属两人空间 ID                          |
| `title`    | `TEXT` | 否        | 无           | 标题或描述                               |
| `date`     | `TEXT` | 否        | 无           | 已发生的纪念日，应用拒绝未来时间         |
| `time`     | `TEXT` | 否        | `'00:00:00'` | HH:mm:ss 时间，按 UTC+8 解释             |

约束与索引：

- 主键：`id`。
- 外键：`coupleId` → `couples.id`。

## todos

待办与重复日程。

| 字段            | 类型      | 允许 NULL | 默认值       | 含义                                     |
| --------------- | --------- | --------- | ------------ | ---------------------------------------- |
| `id`            | `TEXT`    | 是        | 无           | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `coupleId`      | `TEXT`    | 否        | 无           | 所属两人空间 ID                          |
| `title`         | `TEXT`    | 否        | 无           | 标题或描述                               |
| `date`          | `TEXT`    | 否        | 无           | 与 calendar 对应的年月日                 |
| `time`          | `TEXT`    | 否        | `'00:00:00'` | HH:mm:ss 时间，按 UTC+8 解释             |
| `calendar`      | `TEXT`    | 否        | `'solar'`    | solar 公历或 lunar 农历                  |
| `leapMonth`     | `INTEGER` | 否        | `0`          | 0 普通月，1 农历闰月                     |
| `repeat`        | `TEXT`    | 否        | `'none'`     | none 或 yearly                           |
| `completed`     | `INTEGER` | 否        | `0`          | 0 未完成，1 完成                         |
| `completedDate` | `TEXT`    | 是        | 无           | 已完成的那次发生日期，可为空             |

约束与索引：

- 主键：`id`。
- 外键：`coupleId` → `couples.id`。
- `todos_couple`：`coupleId`。

## couple_ai_settings

每个两人空间的 AI 配置。

| 字段            | 类型      | 允许 NULL | 默认值   | 含义                       |
| --------------- | --------- | --------- | -------- | -------------------------- |
| `coupleId`      | `TEXT`    | 是        | 无       | 所属两人空间 ID            |
| `baseUrl`       | `TEXT`    | 否        | 无       | 兼容 OpenAI 的服务地址     |
| `model`         | `TEXT`    | 否        | 无       | 模型名称                   |
| `secret`        | `TEXT`    | 否        | 无       | 加密的 API Key，明文不入库 |
| `enabled`       | `INTEGER` | 否        | 无       | 0 禁用，1 启用             |
| `name`          | `TEXT`    | 否        | `'小爱'` | 显示名称                   |
| `avatarMediaId` | `TEXT`    | 是        | 无       | 助手头像媒体 ID，可为空    |

约束与索引：

- 主键：`coupleId`。
- 外键：`avatarMediaId` → `media.id`。
- 外键：`coupleId` → `couples.id`。

## couple_media_settings

原文件保留策略。

| 字段             | 类型      | 允许 NULL | 默认值 | 含义                           |
| ---------------- | --------- | --------- | ------ | ------------------------------ |
| `coupleId`       | `TEXT`    | 是        | 无     | 所属两人空间 ID                |
| `retainOriginal` | `INTEGER` | 否        | `1`    | 1 保留原文件，0 只保留压缩版本 |

约束与索引：

- 主键：`coupleId`。
- 外键：`coupleId` → `couples.id`。
- CHECK：`retainOriginal IN (0,1`。

## ai_jobs

聊天触发的异步 AI 任务。

| 字段         | 类型      | 允许 NULL | 默认值      | 含义                                                               |
| ------------ | --------- | --------- | ----------- | ------------------------------------------------------------------ |
| `messageId`  | `INTEGER` | 是        | 无          | 关联消息 ID                                                        |
| `userId`     | `TEXT`    | 是        | 无          | 关联用户 ID                                                        |
| `status`     | `TEXT`    | 否        | `'pending'` | pending 待处理、done 已结束、cancelled 已取消；失败说明在 error 中 |
| `error`      | `TEXT`    | 是        | 无          | 失败说明，可为空                                                   |
| `transcript` | `TEXT`    | 是        | 无          | 模型会话和工具调用的序列化记录，可为空                             |

约束与索引：

- 主键：`messageId`。
- 外键：`userId` → `users.id`。
- 外键：`messageId` → `messages.id`。

## ai_actions

AI 工具调用结果与去重。

| 字段        | 类型      | 允许 NULL | 默认值 | 含义                 |
| ----------- | --------- | --------- | ------ | -------------------- |
| `messageId` | `INTEGER` | 是        | 无     | 关联消息 ID          |
| `callId`    | `TEXT`    | 是        | 无     | 模型工具调用 ID      |
| `result`    | `TEXT`    | 否        | 无     | 持久化的工具执行结果 |

约束与索引：

- 主键：`messageId`, `callId`。
- messageId 未声明外键；工具调用结果的生命周期由应用管理。

## administrators

后台管理员账号。

| 字段        | 类型   | 允许 NULL | 默认值 | 含义                                     |
| ----------- | ------ | --------- | ------ | ---------------------------------------- |
| `id`        | `TEXT` | 是        | 无     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `username`  | `TEXT` | 否        | 无     | 唯一登录用户名                           |
| `password`  | `TEXT` | 否        | 无     | 带盐 scrypt 密码摘要                     |
| `createdAt` | `TEXT` | 否        | 无     | 创建时间，ISO UTC 字符串                 |

约束与索引：

- 主键：`id`。
- 唯一约束：`username`。

## admin_sessions

管理员登录会话。

| 字段      | 类型      | 允许 NULL | 默认值 | 含义                                |
| --------- | --------- | --------- | ------ | ----------------------------------- |
| `hash`    | `TEXT`    | 是        | 无     | 不可逆摘要，不存明文 token 或验证码 |
| `adminId` | `TEXT`    | 否        | 无     | 管理员 ID                           |
| `expires` | `INTEGER` | 否        | 无     | 有效期结束时间，Unix 毫秒           |

约束与索引：

- 主键：`hash`。
- 外键：`adminId` → `administrators.id`。

## server_config

服务器业务设置和内部配置。

| 字段    | 类型   | 允许 NULL | 默认值 | 含义                                |
| ------- | ------ | --------- | ------ | ----------------------------------- |
| `key`   | `TEXT` | 是        | 无     | 配置项名，例如 control、mediaSecret |
| `value` | `TEXT` | 否        | 无     | 配置值或 JSON；敏感值可能已加密     |

约束与索引：

- 主键：`key`。

## captchas

图片验证码。

| 字段      | 类型      | 允许 NULL | 默认值 | 含义                                     |
| --------- | --------- | --------- | ------ | ---------------------------------------- |
| `id`      | `TEXT`    | 是        | 无     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `hash`    | `TEXT`    | 否        | 无     | 不可逆摘要，不存明文 token 或验证码      |
| `purpose` | `TEXT`    | 否        | 无     | login、register、reset 或 admin          |
| `ipHash`  | `TEXT`    | 否        | 无     | 请求来源 IP 的摘要                       |
| `expires` | `INTEGER` | 否        | 无     | 有效期结束时间，Unix 毫秒                |

约束与索引：

- 主键：`id`。

## email_codes

邮件验证码。

| 字段       | 类型      | 允许 NULL | 默认值 | 含义                                     |
| ---------- | --------- | --------- | ------ | ---------------------------------------- |
| `id`       | `TEXT`    | 是        | 无     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `email`    | `TEXT`    | 否        | 无     | 验证对象邮箱                             |
| `purpose`  | `TEXT`    | 否        | 无     | register 或 reset                        |
| `hash`     | `TEXT`    | 否        | 无     | 不可逆摘要，不存明文 token 或验证码      |
| `attempts` | `INTEGER` | 否        | `0`    | 已尝试校验次数                           |
| `expires`  | `INTEGER` | 否        | 无     | 有效期结束时间，Unix 毫秒                |
| `sentAt`   | `INTEGER` | 否        | 无     | 发送时间，Unix 毫秒                      |
| `status`   | `TEXT`    | 否        | 无     | 发送状态                                 |

约束与索引：

- 主键：`id`。
- `email_codes_email`：`email`, `purpose`, `sentAt`。

## email_allowlist

注册邮箱白名单。

| 字段        | 类型   | 允许 NULL | 默认值 | 含义                     |
| ----------- | ------ | --------- | ------ | ------------------------ |
| `email`     | `TEXT` | 是        | 无     | 允许注册的邮箱           |
| `note`      | `TEXT` | 否        | 无     | 备注                     |
| `createdAt` | `TEXT` | 否        | 无     | 创建时间，ISO UTC 字符串 |

约束与索引：

- 主键：`email`。

## registration_invites

注册邀请码。

| 字段        | 类型      | 允许 NULL | 默认值 | 含义                                     |
| ----------- | --------- | --------- | ------ | ---------------------------------------- |
| `id`        | `TEXT`    | 是        | 无     | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `hash`      | `TEXT`    | 否        | 无     | 注册邀请码摘要                           |
| `label`     | `TEXT`    | 否        | 无     | 批次备注                                 |
| `uses`      | `INTEGER` | 否        | `0`    | 已使用次数                               |
| `maxUses`   | `INTEGER` | 否        | 无     | 最大使用次数，应用要求 1～10000          |
| `expires`   | `INTEGER` | 否        | 无     | Unix 毫秒；0 表示不设到期时间            |
| `revoked`   | `INTEGER` | 否        | `0`    | 0 可用，1 已停用                         |
| `createdAt` | `TEXT`    | 否        | 无     | 创建时间，ISO UTC 字符串                 |

约束与索引：

- 主键：`id`。
- 唯一约束：`hash`。

## album_imports

已停用的历史历史相册导入去重（已停用）表。

| 字段       | 类型   | 允许 NULL | 默认值 | 含义                                |
| ---------- | ------ | --------- | ------ | ----------------------------------- |
| `coupleId` | `TEXT` | 否        | 无     | 所属两人空间 ID                     |
| `digest`   | `TEXT` | 否        | 无     | 完整 ZIP 的 SHA-256，同一空间内去重 |

约束与索引：

- 主键：`coupleId`, `digest`。
- 外键：`coupleId` → `couples.id`。

## couple_limits

两人空间额度。

| 字段       | 类型      | 允许 NULL | 默认值 | 含义                               |
| ---------- | --------- | --------- | ------ | ---------------------------------- |
| `coupleId` | `TEXT`    | 是        | 无     | 所属两人空间 ID                    |
| `quotaMiB` | `INTEGER` | 否        | 无     | 空间额度，单位 MiB；0 禁止新增上传 |

约束与索引：

- 主键：`coupleId`。
- 外键：`coupleId` → `couples.id`。

## access_logs

HTTP 访问日志。

| 字段         | 类型      | 允许 NULL | 默认值     | 含义                                     |
| ------------ | --------- | --------- | ---------- | ---------------------------------------- |
| `id`         | `INTEGER` | 否        | `自动分配` | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `requestId`  | `TEXT`    | 否        | 无         | 单次请求标识                             |
| `createdAt`  | `TEXT`    | 否        | 无         | 创建时间，ISO UTC 字符串                 |
| `method`     | `TEXT`    | 否        | 无         | HTTP 方法                                |
| `path`       | `TEXT`    | 否        | 无         | 请求路径                                 |
| `status`     | `INTEGER` | 否        | 无         | HTTP 响应状态码                          |
| `durationMs` | `REAL`    | 否        | 无         | 请求耗时，毫秒                           |
| `ip`         | `TEXT`    | 否        | 无         | 客户端地址                               |
| `actorId`    | `TEXT`    | 是        | 无         | 用户或管理员 ID，可为空                  |
| `userAgent`  | `TEXT`    | 否        | 无         | User-Agent                               |

约束与索引：

- 主键：`id`。
- `access_logs_created`：`createdAt`, `id`。

## server_logs

服务事件日志。

| 字段        | 类型      | 允许 NULL | 默认值     | 含义                                     |
| ----------- | --------- | --------- | ---------- | ---------------------------------------- |
| `id`        | `INTEGER` | 否        | `自动分配` | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `createdAt` | `TEXT`    | 否        | 无         | 创建时间，ISO UTC 字符串                 |
| `level`     | `TEXT`    | 否        | 无         | 日志级别                                 |
| `event`     | `TEXT`    | 否        | 无         | 事件名称                                 |
| `details`   | `TEXT`    | 否        | 无         | 序列化的事件详情                         |

约束与索引：

- 主键：`id`。

## audit_logs

管理员操作日志。

| 字段        | 类型      | 允许 NULL | 默认值     | 含义                                     |
| ----------- | --------- | --------- | ---------- | ---------------------------------------- |
| `id`        | `INTEGER` | 否        | `自动分配` | 记录 ID；TEXT ID 通常为 UUID，由应用生成 |
| `createdAt` | `TEXT`    | 否        | 无         | 创建时间，ISO UTC 字符串                 |
| `adminId`   | `TEXT`    | 否        | 无         | 管理员 ID                                |
| `action`    | `TEXT`    | 否        | 无         | 管理员操作名                             |
| `target`    | `TEXT`    | 否        | 无         | 目标记录或资源标识                       |
| `details`   | `TEXT`    | 否        | 无         | 序列化的事件详情                         |

约束与索引：

- 主键：`id`。

## schema_migrations

已执行的数据库迁移历史。

| 字段         | 类型      | 允许 NULL           | 默认值 | 含义                            |
| ------------ | --------- | ------------------- | ------ | ------------------------------- |
| `version`    | `INTEGER` | 否（与 rowid 关联） | 无     | 从 1 开始连续的迁移编号         |
| `name`       | `TEXT`    | 否                  | 无     | 迁移名称                        |
| `checksum`   | `TEXT`    | 否                  | 无     | 迁移 SQL 与编号、名称的 SHA-256 |
| `applied_at` | `TEXT`    | 否                  | 无     | 成功应用时的 ISO UTC 时间       |

约束与索引：

- 主键：`version`。

## 数据校验的边界

上面列的是 SQL 已声明的约束。UUID 格式、枚举值、日期有效性、密码长度、会话到期、配对归属和两人额度主要由应用校验，并非每项都有 SQL CHECK。直接写数据库会绕过这些检查。

新增或改变字段必须通过[数据库迁移](migrations.md)，不要改写已发布的迁移 001。备份中的表和序号如何保存，见[备份格式](backup-format.md)。
