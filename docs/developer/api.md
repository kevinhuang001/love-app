# 接口参考

本文面向编写客户端、脚本或外部 AI 集成的开发者。日常操作见[使用指南](../user/guide.md)。接口实现以 [app.ts](../../apps/server/src/app.ts) 和各功能模块为准。

## 请求与权限

服务器地址填 origin，例如 `https://love.example.com`；HTTP 接口统一位于 `/api`。JSON 请求使用 `Content-Type: application/json`，文件上传使用 multipart。

用户登录后，在请求头中传 `Authorization: Bearer <token>`。管理员使用独立 token，用户 token 不能调用管理接口。签名媒体和相册下载链接按链接自身的签名校验。

用户会话有效期为 30 天，管理员会话为 8 小时。未配对用户可查看或修改个人资料、上传个人头像、创建或加入配对、退出登录；聊天、相册、日程、AI 和普通媒体上传要求已配对，否则返回 409。资源归属由服务器从会话确定，客户端传入其他人的 ID 不会扩大权限。

错误通常返回 `{ "error": "说明" }`。参数校验失败返回 400，并可能带 `details`。常见状态：401 会话无效，403 权限不足，409 当前状态不允许，413 容量不足，422 媒体无法解码，429 请求过于频繁。客户端应显示错误说明，不能只根据 HTTP 状态推测具体原因。

## 认证

| 方法 | 路径                       | 参数与结果                                                                                              |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| GET  | `/api/health`              | `status`、`version`、`schemaVersion`、`notifications: "local"`、`database`                              |
| GET  | `/api/auth/config`         | 注册模式、`invitationRequired`、`registrationAvailable`、`mailAvailable`、`captchaRequired`             |
| GET  | `/api/auth/captcha`        | 查询参数 `purpose=login\|register\|reset\|admin`；返回验证码 ID、图片及有效期                           |
| POST | `/api/auth/login`          | `username`（也可填邮箱）、`password`、`captchaId`、`captcha`；返回 `token`、`user`、`partner`、`couple` |
| POST | `/api/auth/email-code`     | `email`、`purpose=register\|reset`、`captchaId`、`captcha`；返回 `verificationId`                       |
| POST | `/api/auth/register`       | `username`、`password`、`name`、`email`、`verificationId`、`code`                                       |
| POST | `/api/auth/reset-password` | `email`、`verificationId`、`code`、新 `password`；撤销该用户已有会话                                    |
| POST | `/api/auth/logout`         | 撤销当前会话及其通知连接                                                                                |

需要注册邀请码时，注册用途的邮件验证码请求和最终注册请求都要带 `invitationCode`。找回密码不需要。邮件验证码和图片验证码是两套字段，不能互换。

## 个人资料与配对

| 方法        | 路径                         | 请求内容                                                        |
| ----------- | ---------------------------- | --------------------------------------------------------------- |
| GET / PATCH | `/api/me`                    | GET 返回当前资料与配对；PATCH 接受 `name`、可选 `avatarMediaId` |
| POST        | `/api/me/avatar`             | 图片 multipart，字段 `file`；直接保存个人头像                   |
| POST        | `/api/pairing/invite`        | 创建有效期 10 分钟的配对码                                      |
| POST        | `/api/pairing/join`          | `code`                                                          |
| DELETE      | `/api/pairing`               | 解除当前配对                                                    |
| PATCH       | `/api/couple`                | `startDate`、`startTime`                                        |
| PATCH       | `/api/couple/media-settings` | `retainOriginal` 布尔值；只影响之后上传的媒体                   |

`/api/me` 的 `couple` 包含 `storageBytes`、`quotaBytes` 和 `retainOriginal`。个人头像上传不要求配对，不占两人空间额度。普通媒体上传走下面的 `/api/media`。

## 聊天与媒体

| 方法   | 路径                      | 请求与结果                                                                       |
| ------ | ------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/api/messages`           | 可选 `before` 消息 ID；返回最近 50 条的升序 `items`、`hasMore`                   |
| POST   | `/api/messages`           | `clientId`（UUID）、`content`、有序 `mediaIds` 数组                              |
| POST   | `/api/messages/read`      | `throughId`，表示已读到的消息 ID                                                 |
| POST   | `/api/media`              | multipart `file`；返回媒体 ID、签名预览及 `capturedDate`                         |
| GET    | `/api/media/:id/:variant` | 签名访问 `thumbnail` 或 `preview`；支持 Range                                    |
| DELETE | `/api/media/:id`          | 取消自己的待发布媒体，或删除自己的未被引用媒体；被聊天、相册或头像引用时返回 409 |

发送附件时，先逐个上传，再按选择顺序把 ID 放入消息的 `mediaIds`。服务器拒绝重复 ID、其他人的待发布草稿或其他配对空间的媒体。列表、发送响应和实时消息提供 `attachments` 数组。

重试同一条消息时保留原 `clientId` 和已上传的媒体 ID。服务器按发送者与 `clientId` 去重，避免重复消息和 AI 任务。上传先进入待发布区，聊天或相册提交时正式关联媒体并核算额度；上传成功不代表后续发布一定成功。

`capturedDate` 为 `YYYY-MM-DD` 或 null。照片读取拍摄元数据，视频读取创建元数据；缺失或无效时返回 null，不用上传日期猜测。客户端必须让使用者补填相册日期。

## 相册与日程

| 方法           | 路径                        | 请求与结果                                                            |
| -------------- | --------------------------- | --------------------------------------------------------------------- |
| GET            | `/api/moments`              | 分页查询，见下文                                                      |
| POST           | `/api/moments`              | `title`、必填 `date`、`mediaId`、可选 UUID `clientId`                 |
| PATCH / DELETE | `/api/moments/:id`          | 当前配对双方可改 `title`、`date` 或删除                               |
| GET / POST     | `/api/anniversaries`        | 查看或创建 `title`、`date`、`time`                                    |
| PATCH / DELETE | `/api/anniversaries/:id`    | 当前配对成员可编辑或删除                                              |
| GET / POST     | `/api/todos`                | 查看或创建 `title`、`date`、`time`、`calendar`、`leapMonth`、`repeat` |
| PATCH / DELETE | `/api/todos/:id`            | 编辑或删除                                                            |
| POST           | `/api/todos/:id/completion` | `completed` 布尔值                                                    |
| POST           | `/api/album/exports`        | 空对象；返回 `filename` 和签名下载 `url`                              |
| GET            | `/api/album/download/:id`   | 签名下载 ZIP；须在 20 分钟内开始，下载时重新检查会话与配对            |

相册查询支持 `type=all|image|video`、`owner=all|mine|partner`、`search`、发生日期范围 `from` / `to`、`sort=date_desc|date_asc|uploaded_desc`、`limit`（1–100，默认 60）。返回 `{items,total,nextCursor}`。后续请求带 `cursor=nextCursor`，并保留原筛选和排序条件。`createdAt` 是上传时间，修改发生日期不改变它。

日程日期为 `YYYY-MM-DD`，时间为 `HH:mm:ss`，默认 `00:00:00`，按 UTC+8 解释。纪念日和关系开始时间不能晚于当前时间。待办 `calendar` 为 `solar` 或 `lunar`，农历模式的 date 表示农历年月日；`leapMonth` 为布尔值，`repeat` 为 `none` 或 `yearly`。具体日期规则见 [schedules.ts](../../apps/server/src/schedules.ts) 与 [calendar 包](../../packages/calendar/index.js)。

相册 ZIP 不包含账号、聊天、AI 或部署配置，也不能作为服务器恢复备份。文件格式见[备份与相册文件格式](backup-format.md)。

## AI 集成

| 方法       | 路径                  | 内容                                        |
| ---------- | --------------------- | ------------------------------------------- |
| GET / POST | `/api/ai/settings`    | 地址、模型、启用状态与密钥                  |
| PATCH      | `/api/ai/profile`     | `name`、可选 `avatarMediaId`；null 清空头像 |
| GET        | `/api/ai/tools`       | 当前工具 JSON Schema 和媒体上传说明         |
| POST       | `/api/ai/tools/:name` | 使用当前用户权限执行指定工具                |

设置请求包含 `baseUrl`、`model`、`enabled`、可选 `apiKey`。同地址省略密钥会保留已有值；换地址会清空旧密钥。GET 只返回 `hasKey`，不返回密钥。配置与助手身份由配对双方共享。

工具包括纪念日、待办的查询和修改，个人资料、助手身份修改，近期媒体查询、发布相册及关系日期设置。参数以 `/api/ai/tools` 返回的 Schema 为准，不在客户端另存一份容易过期的定义。个人资料工具只能修改发起用户，其他工具仍限制在当前两人空间。

例如，外部集成上传图片后将返回的 ID 传给发布工具：

```bash
curl https://love.example.com/api/media \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@photo.jpg'

curl https://love.example.com/api/ai/tools/publish_moment \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"mediaId":"MEDIA_UUID","title":"一起看日落","date":"2026-10-05"}'
```

内置助手在聊天中匹配独立的 `@当前助手名称`，名称后需空格或标点，区分大小写。服务器异步调用模型，再写回同一聊天空间。提及助手时，本次附件中的压缩图片或视频封面会发送给模型；未提及时不会发送。详见[架构](architecture.md)。内置助手在服务器执行工具，不向模型提供用户会话 token；外部集成应自行保护 token。

## Socket.IO 与通知流

Socket.IO 连接服务器 origin，认证为 `auth: {token, active: true}`。服务器按会话决定房间，客户端不能自行加入任意情侣房间。事件包括 `message:new`、`message:read`、`typing`、`profile:changed`、`moments:changed`、`anniversaries:changed`、`todos:changed`。

消息仍由 HTTP 提交。`typing` 用于输入状态。前台每 10 秒发送 `presence:set`，内容为 `{active: boolean}`；切换到后台立即发送 false。服务器用最近 30 秒内的前台报告判断在线，每 5 秒复核。`presence:get` 主动查询，`presence:changed` 返回 `{coupleId,users:[{id,online}]}`。通知连接不算在线。

`GET /api/notifications/stream` 使用 Bearer 认证，返回 SSE。可选 `after` 为上次消息 ID；未提供则从当前最新位置开始。`ready` 包含 cursor 和 coupleId，`message` 包含 messageId，`cursor` 推进无需提醒的事件位置，`stop` 表示停止接收。每 15 秒发送心跳，每位用户最多 5 条连接。账号、会话或配对失效后关闭。流不携带聊天正文或附件，Android 原生服务用它生成本地通知。

## 管理接口

下列接口除 status 和 login 外，均要求管理员 token。实现见 [control.ts](../../apps/server/src/control.ts)。

| 方法                | 路径                                     | 内容                                                                               |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| GET                 | `/api/admin/status`                      | 公开返回 `adminConfigured`                                                         |
| POST                | `/api/admin/login`                       | `username`、`password`、`captchaId`、`captcha`                                     |
| GET / POST          | `/api/admin/me` / `/api/admin/logout`    | 当前管理员 / 退出                                                                  |
| GET                 | `/api/admin/overview`                    | 用户、容量、请求、错误和队列汇总                                                   |
| GET / POST          | `/api/admin/users`                       | 分页查询；创建时传 `username`、`name`、`email`、`password`、`confirmedEmail: true` |
| PATCH               | `/api/admin/users/:id`                   | `disabled`、`password`、`revokeSessions`                                           |
| GET                 | `/api/admin/couples`                     | 配对空间、双方、容量与额度                                                         |
| PATCH               | `/api/admin/couples/:id/quota`           | `quotaMiB`；null 使用当前默认额度，0 禁止新增上传                                  |
| GET / PATCH         | `/api/admin/settings`                    | 注册、邀请、额度、日志保留和 SMTP 设置                                             |
| POST                | `/api/admin/smtp/test`                   | `email`                                                                            |
| GET / POST / DELETE | `/api/admin/allowlist`                   | 查看；添加 `email`、`note`；删除 body 传 `email`                                   |
| GET                 | `/api/admin/logs/:kind`                  | kind 为 `access`、`server`、`audit`                                                |
| GET / POST          | `/api/admin/registration-invites`        | 最近 1000 个邀请码状态；生成见下文                                                 |
| PATCH               | `/api/admin/registration-invites/revoke` | `ids` 数组，停用指定邀请码                                                         |

用户和空间分页每页 30 条，日志每页 50 条，响应为 `items`、`total`、`page`、`pageSize`。日志查询支持 `page`、`search`、ISO datetime 的 `from` / `to`；访问日志可带 `status=2|3|4|5`，服务日志可带 `level`。

设置 PATCH 需要完整对象：`registration`、`invitationRequired`、`domains`、`defaultQuotaMiB`、`retentionDays`、`smtp`。SMTP 字段为 `host`、`port`、`security`（tls / starttls / plain）、`user`、`password`、`from`、`senderName`；`clearPassword: true` 清空密码。响应不返回保存的密码。

生成注册邀请码传 `{count,maxUses,expiresDays,label}`，201 返回 `codes`，包含 ID、明文 code、有效期和最大使用次数。明文只在创建响应出现，列表不返回明文或哈希。注册邀请码与用户之间的配对码用途不同。

## 个人密码、共享编辑与实况

POST /api/me/password 接收 currentPassword 和 password（8–128 字符），核验旧密码，撤销其他会话，保留当前会话。无需配对。

已发送的聊天记录不提供修改或删除接口。

POST /api/media 接收 file，可选 liveVideo 配对 MOV。Android 内嵌实况自动提取。返回 kind=live、静态 previewUrl 和 motionUrl。`type=image` 相册筛选包含 live。

AI 仅提取 text 正文，不向用户返回 reasoning 字段；正文中的 think、analysis、reasoning 标签内容在保存和读取时过滤。
