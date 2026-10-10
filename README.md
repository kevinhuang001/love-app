# Love · 我们的日常

Love 是一个可以自己部署的两人生活应用。一起聊天、保存照片和视频、记录纪念日、安排待办，内容保存在你自己的服务器上。可以用浏览器访问，也可以安装 Android 应用。

## 能做什么

- **聊天**：发送文字、图片和视频，查看已读状态。
- **回忆**：共同整理照片和视频，按日期浏览、搜索，导出相册。
- **纪念日**：记录在一起、第一次旅行等重要日子。
- **To Do**：安排未来的事，支持每年重复和农历日期。
- **我们**：管理昵称、头像、配对、主题和两人空间。
- **AI 助手**：接入自己的 AI 服务，在聊天里请它添加日程、保存附件等。这个功能可选。

每个人使用自己的账号，配对后共享两人空间。服务器管理员可以管理账号、注册方式和存储额度。

## 自己部署

准备一台 Linux 服务器，安装 Docker Engine 和 Docker Compose **2.24.4 或更新版本**。支持 AMD64 和 ARM64。只需下载管理程序，不需要安装 Node.js、Bun 或编译源码。

在服务器终端进入部署目录，执行：

```sh
mkdir -p ~/love
cd ~/love
curl -fsSL https://raw.githubusercontent.com/kevinhuang001/love-app/main/manager/install.sh | bash
```

安装后会打开管理菜单。选择 **部署配置**，按提示选择数据库、访问方式和管理员账号，再启动应用。数据库管理需要读取服务器上的数据卷；使用普通账户遇到权限问题时，在同一目录运行 `sudo ./love`。

初次部署不知道怎么选，可以先用 **SQLite**。已有反向代理时选择对应选项；没有反向代理也可以使用内置 HTTPS，或先在局域网用 HTTP 体验。

安装器下载的是最近一次正式发布的版本，可能比仓库 main 分支晚。完整步骤见 [安装指南](docs/user/install.md)。

## 开始使用

1. 管理员打开 `你的访问地址/#admin`，用部署时设置的管理员账号登录，给双方各创建一个用户账号。
2. 双方用自己的账号登录。一方在“我们”里生成配对邀请码，另一方输入邀请码。
3. 配对完成后，就可以聊天、上传回忆和添加日程。

Android 用户从 [Releases](https://github.com/kevinhuang001/love-app/releases/latest) 下载 APK。在登录页的“服务器设置”中填写你的访问地址，例如 `https://love.example.com`。

## 你要找的文档

| 你想做什么                      | 从这里开始                               |
| ------------------------------- | ---------------------------------------- |
| 安装到自己的服务器              | [安装指南](docs/user/install.md)         |
| 更新、备份、恢复或迁移服务器    | [日常维护](docs/user/manage.md)          |
| 管理账号、注册和存储额度        | [管理后台](docs/user/admin.md)           |
| 配对、相册、日程和 AI 使用      | [使用指南](docs/user/guide.md)           |
| 安装 Android 应用或设置消息通知 | [Android 使用](docs/user/android.md)     |
| 遇到连接、登录、上传或启动问题  | [常见问题](docs/user/troubleshooting.md) |
| 修改代码、调用接口或自行构建    | [开发文档](docs/README.md#开发者)        |

## 许可证

项目采用 [MIT 许可证](LICENSE)。第三方组件和字体的许可见 [第三方说明](THIRD_PARTY_NOTICES.md)。

源码目录和开发入口见[目录组织](docs/developer/project-layout.md)。
