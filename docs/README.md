# Love 文档

第一次了解 Love，请先看 [项目首页](../README.md)。这里按你要做的事分开：使用和维护自己的服务器看使用文档，修改代码或接入接口看开发文档。

## 使用者与服务器管理员

| 文档                                | 解决什么问题                                            |
| ----------------------------------- | ------------------------------------------------------- |
| [安装指南](user/install.md)         | 从准备服务器到双方第一次登录；选择数据库、HTTP 或 HTTPS |
| [使用指南](user/guide.md)           | 配对、聊天、回忆相册、日程、AI 助手                     |
| [Android 使用](user/android.md)     | 连接自己的服务器、更新 APK、设置后台消息通知            |
| [管理后台](user/admin.md)           | 创建账号、开放注册、设置邮件、管理额度和日志            |
| [日常维护](user/manage.md)          | 修改部署配置、升级、备份、恢复、换数据库与卸载          |
| [常见问题](user/troubleshooting.md) | 按现象检查连接、启动、邮件、上传和存储问题              |

## 开发者

| 文档                                             | 内容                                                   |
| ------------------------------------------------ | ------------------------------------------------------ |
| [本地开发](developer/getting-started.md)         | 环境、启动、测试和仓库目录                             |
| [架构](developer/architecture.md)                | 前后端职责、权限、消息、媒体、AI 与通知的处理流程      |
| [配置参考](developer/configuration.md)           | 环境变量、默认值和生效方式                             |
| [接口参考](developer/api.md)                     | HTTP API、Socket.IO、通知流与 AI 工具                  |
| [数据库与媒体存储](developer/database.md)        | 数据库接口、表的职责、SQLite 与 PostgreSQL 存储差异    |
| [数据库迁移](developer/migrations.md)            | 新增增量、迁移历史、事务、兼容范围与测试要求           |
| [备份与相册文件格式](developer/backup-format.md) | 服务器备份和相册 ZIP 的结构、校验、恢复流程            |
| [手工部署与镜像构建](developer/deployment.md)    | Compose 文件组合、反向代理、非 Docker 运行、国内构建源 |
| [Android 构建与签名](developer/android.md)       | 本地构建、固定签名和原生通知测试                       |
| [CI 与发布](developer/ci.md)                     | GitHub Actions 检查项、构建产物和发布条件              |

使用文档说明操作步骤和结果；开发文档说明实现与约定。每项内容只在对应文档详细展开，其他页面通过链接引用。
