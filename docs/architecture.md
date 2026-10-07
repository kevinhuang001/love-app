# 架构与验证

## 目录

| 路径                          | 用途                                              |
| ----------------------------- | ------------------------------------------------- |
| apps/client/src/pages         | 手机五个 Tab、验证邮箱登录和独立管理后台          |
| apps/client/src/components/ui | shadcn/ui 官方源码组件                            |
| apps/client/src/lib           | API、通知、类型、日期与上下文                     |
| apps/server/src               | HTTP API、SQLite、Socket.IO、媒体、推送和 AI 工具 |
| apps/server/test              | 真正运行 SQLite／API／Socket／FFmpeg 的集成测试   |
| tests/e2e                     | Playwright 两个账号的手机端完整流程               |
| scripts/android.mjs           | 可重复生成 Android 工程与推送配置                 |
| docs                          | 部署、接口、安卓与架构文档                        |
| .github/workflows             | CI 测试和 APK 构建                                |

## 可靠性

管理员与用户有独立会话和权限。邮件验证先完成再创建用户，SMTP 密码加密存储，PNG 图形验证码与邮件验证码单次使用且绑定用途。访问、后台与管理操作日志在 SQLite 中分页查询并定期清理。账号密码使用随机盐 scrypt；数据库仅保存 session token SHA-256 摘要，30 天过期，登出撤销 HTTP 与 Socket 会话。操作从 session 推导 userId／coupleId，不信任客户端传来的目标用户。邀请为一次性 12 位随机十六进制码，10 分钟有效。

发送消息通过 HTTP 持久化后广播 Socket.IO；`senderId + clientId` 唯一约束使重试不会重复插入。客户端按关系空间持久化 outbox，切换账号／服务器／关系不会混入另一个队列。发送失败有手动重试与删除；重连自动尝试最早的一条。重连／恢复前台重新请求持久化历史，分页一次 50 条。

媒体限制 100 MB，图片最多 5000 万像素，视频最多 5 分钟。最多同时处理 2 个上传；解码工具有执行时间限制；FFmpeg 参数以数组传递，不经过 shell。预览 WebP，视频 H.264/AAC、faststart、最长边适配 1280×720；列表仅加载缩略图，点击后才加载压缩大图／视频。原文件从不作为静态目录公开。

AI 使用仅发起者可配置的凭据。队列先保存 @配置名称请求，工具按当前关系重新鉴权；模型没有 SQL、Shell、文件系统或通用网络工具。最多 5 轮、每轮最多 8 个调用；工具结果与调用 ID 持久化用于重启恢复。同一请求不会重复写入 AI 回复。

## CI

`Test and build`：

1. Node 24 安装锁定依赖，类型检查。
2. 后端集成测试：鉴权、一次性配对、跨情侣隔离、实时消息、幂等重试、已读、分页、会话撤销、图片与视频处理、签名媒体链接、推送队列及 AI 工具隔离，以及真实 HTTP 模拟 AI 服务联通。
3. 管理与认证测试：白名单、邮件验证码过期／重放、PNG 验证码用途／IP／期限、密码恢复、独立管理权限、加密 SMTP、真实本地 SMTP 收发、真实文件容量／配额、停用账号实时断连、日志脱敏与保留期。
4. 前端单元测试：日期／闰年／服务器 URL 校验。
5. Web 与后端生产构建。
6. Pixel 7 尺寸 Playwright：注册、配对、双会话聊天、图片上传预览、纪念日新增编辑、昵称、主题、AI 配置、登录持久化、相册排序／筛选／日期识别、后台账号／配额／SMTP／白名单／日志及横向溢出检查。
7. Java 21 / Android SDK：生成工程、构建 APK，上传 artifact。

测试失败时上传 trace、截图和视频（7 天）；Web 与 APK 也作为构建产物交付。API 测试使用隔离数据库和可控 AI 服务，通知采用自建认证 SSE 流；测试覆盖事件隔离、重连及权限撤销。原生 APK 不包含第三方推送 SDK；锁屏和电池策略仍需真实设备验证。

`packages/calendar` 为前后端共享的公历／农历计算模块，确保 UI、HTTP 与 AI 工具使用同一日期语义。底部导航为聊天、回忆、纪念日、To Do、我们。CI docker job 验证生产镜像启动与重启持久化，android 依赖 test 与 docker 两个 job 成功。


## 数据库驱动

`db.ts` 提供统一异步参数化接口。SQLite 使用 WAL 与单写事务队列；PostgreSQL 使用连接池，同一事务的查询通过 AsyncLocalStorage 固定在同一 client。短写事务使用数据库 advisory lock，保持配对、一次性验证码及容量核算的原子性。共享 schema 在驱动层生成各自的 identity、整数和时间默认值，PostgreSQL 使用 schema 版本表。池关闭、日志写入与后台任务在关停时排空。

Docker 启动器 `./love` 首次通过镜像中的 Clack 终端向导生成 `.env`，选择 Compose 覆盖文件。`compose.postgres.yml` 提供带健康检查与独立持久化卷的 PostgreSQL；外部 PostgreSQL 使用 `DATABASE_URL`。
