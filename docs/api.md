# API 与 AI 工具

登录页服务器地址是 origin；所有 HTTP 接口位于 `/api`。需要鉴权的接口使用 `Authorization: Bearer <session-token>`。除公开 health、登录／注册和带签名的媒体预览外都需要登录。

| 方法           | 路径                      | 内容                                                                            |
| -------------- | ------------------------- | ------------------------------------------------------------------------------- |
| GET            | /api/health               | 版本、服务状态、pushConfigured                                                  |
| POST           | /api/auth/register        | username、password、name                                                        |
| POST           | /api/auth/login           | username、password；返回 token、user、partner、couple                           |
| POST           | /api/auth/logout          | 可选 deviceToken；撤销会话和当前设备通知                                        |
| GET / PATCH    | /api/me                   | 查看资料；修改 name、可选 avatarMediaId                                         |
| POST           | /api/pairing/invite       | 创建邀请码                                                                      |
| POST           | /api/pairing/join         | code                                                                            |
| DELETE         | /api/pairing              | 断开当前关系                                                                    |
| PATCH          | /api/couple               | startDate，YYYY-MM-DD                                                           |
| GET            | /api/messages?before=ID   | 最近 50 条升序 items、hasMore                                                   |
| POST           | /api/messages             | clientId（UUID）、content、可选 mediaId                                         |
| POST           | /api/messages/read        | throughId（已看过的最新 ID）                                                    |
| POST           | /api/media                | multipart 文件字段 file；返回媒体 ID、签名预览 URL 和 capturedDate              |
| GET            | /api/media/:id/:variant   | 签名 thumbnail / preview，支持 Range                                            |
| GET / POST     | /api/moments              | 分页查看／新增 title、date、mediaId                                             |
| PATCH / DELETE | /api/moments/:id          | 仅发布者可编辑、删除                                                            |
| GET / POST     | /api/anniversaries        | 查看／新增 title、date（今天或过去，累计天数）                                  |
| PATCH / DELETE | /api/anniversaries/:id    | 当前情侣可修改、删除                                                            |
| POST / DELETE  | /api/devices              | 当前设备 token 注册／注销                                                       |
| GET / POST     | /api/todos                | title、date、calendar、leapMonth、repeat；支持农历                              |
| PATCH / DELETE | /api/todos/:id            | 编辑或删除当前情侣的待办                                                        |
| POST           | /api/todos/:id/completion | completed；完成循环事项跳到下一次                                               |
| PATCH          | /api/ai/profile           | name、可选 avatarMediaId（null 清空）                                           |
| GET / POST     | /api/ai/settings          | baseUrl、model、enabled、可选 apiKey；GET 返回 hasKey、name、avatar，不返回 Key |
| GET            | /api/ai/tools             | OpenAI function calling 工具定义和上传接口说明                                  |
| POST           | /api/ai/tools/:name       | session 对应用户作用域内执行工具                                                |

相册 GET 返回 `{items,total,nextCursor}`，支持 `type=all|image|video`、`owner=all|mine|partner`、`search`（描述文字）、`from/to`（发生日期范围）、`sort=date_desc|date_asc|uploaded_desc`。默认每页 60，`limit` 为 1–100；继续加载时带上相同筛选排序参数和 `cursor=nextCursor`。所有条件仍限定在当前两人空间。相册条目提供独立的上传时间 `createdAt`，编辑发生日期不会改写上传时间。

`POST /api/media` 在压缩前读取原文件元数据，返回 `capturedDate: "YYYY-MM-DD" | null`。照片优先 EXIF `DateTimeOriginal`，其次 `CreateDate`；保留相机记录的当地日期，不用服务器时区转换。视频优先 QuickTime 原始带时区的创建日期，其次 `creation_time`（UTC 转为应用日期时区 Asia/Shanghai）。不使用 EXIF 文件修改时间、文件名、文件修改时间或上传时间；缺失、损坏或无效的拍摄日期返回 null，媒体仍可上传。界面选择文件后先上传和识别，未识别时逐个文件补填日期，最后为每个文件分别调用 `POST /api/moments`，其 `date` 必填。提交相册失败时保留已上传的媒体 ID 与用户填写的日期，重试不会重新上传已成功的文件。数据库结构不变，拍摄日期保存于各条 moments.date。

Socket.IO 用 `auth: { token }` 连接服务器 origin，事件：`message:new`、`message:read`、`typing`、`profile:changed`、`moments:changed`、`anniversaries:changed`、`todos:changed`。客户端可以发送 `typing`；发送消息仍通过 HTTP。服务器决定情侣 room，客户端不能自行加入任意 room。

## 命名助手用法

- `@小爱 创建纪念日：我们第一次旅行，2025-11-01`
- `@小爱 添加 To Do：七夕，农历 2026 年七月初七，每年重复，不是闰月`
- `@小爱 把我的昵称改成小爱`
- 附上图片后：`@小爱 把这张图片设为我的头像，昵称保持不变`
- 附上图片／视频后：`@小爱 把这个附件收藏到回忆，日期 2026-10-05，描述：一起看日落`

输入需包含独立 `@助手名称`，例如 `@小桃 帮我…`，名称后用空格或标点，只匹配当前配置名称（区分大小写）。名称不能含空格或 @。服务器保存请求后异步调用 provider，并以 `role=assistant` 写回同一个聊天空间。助手只能修改发起者自己的昵称／头像；纪念日及回忆都限制在当前关系空间。

工具还包括 `list_todos`、`create_todo`、`update_todo`、`delete_todo`、`complete_todo` 和 `update_ai_profile`。待办 date 在 calendar=lunar 时代表农历年月日；repeat 是 none 或 yearly；leapMonth 是布尔值。

工具：`list_anniversaries`、`create_anniversary`、`update_anniversary`、`delete_anniversary`、`update_profile`、`list_recent_media`、`publish_moment`、`set_relationship_date`。工具 JSON Schema 可通过接口获取，供外部 AI 客户端集成。外部 AI 客户端先用 POST `/api/media` 上传二进制文件，再把返回的 mediaId 传给 `publish_moment` 或 `update_profile`。聊天内附件由应用先上传，AI 接收其 ID；AI 不能凭空上传未提供的本机文件。

示例：

```bash
curl https://love.example.com/api/ai/tools \
  -H 'Authorization: Bearer YOUR_TOKEN'
curl https://love.example.com/api/media \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@photo.jpg'
curl https://love.example.com/api/ai/tools/publish_moment \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"mediaId":"MEDIA_UUID","title":"一起看日落","date":"2026-10-05"}'
```

不要把永久 session token 给不可信 AI 服务；内置助手 在后端执行工具，不向 provider 发送用户 session token。API Key、Cookie 和服务端环境变量不是工具参数，AI 无法查询这些信息。

助手身份示例：`@小桃 把你的名字改成星星，并用本次图片作为你的头像`，调用 update_ai_profile。修改真人昵称需要明确说“我的昵称”，调用 update_profile。AI 回复的 assistant 字段包含 name 和带签名预览的 avatar。
