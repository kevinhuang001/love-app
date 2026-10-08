# 预构建镜像与 love 管理菜单

用户部署只下载镜像，无需源码、Node.js、npm 或本地 build。要求 Linux amd64 / arm64、Docker Engine、Docker Compose 2.24.4+；下载 Release 时需要 curl 和 sha256sum（或 shasum）。

## 安装

从 [Docker Release](https://github.com/kevinhuang001/love-app/releases/tag/docker-latest) 下载 `Love-docker-deploy.tar.gz`，解压到独立目录，然后：

```sh
chmod +x love
./love
```

无需任何二级指令。选择“初次配置 / 修改部署配置”，选择镜像来源：

- GitHub Release（默认）：自动识别 amd64 / arm64，下载对应镜像、检查 SHA-256，再 `docker load`。公开附件无需登录 GHCR。
- GHCR：拉取 `ghcr.io/kevinhuang001/love-app:latest`。仓库所有者需将包设为 Public 后，其他用户才能匿名拉取。
- 自定义仓库：填写自己的镜像地址，可使用固定版本或 digest。

应用镜像包含终端配置向导。选择 SQLite、内置或外部 PostgreSQL，配置监听 IP / 端口、HTTP 或 HTTPS、管理员、存储、SMTP 和注册邀请码。保存前显示摘要，密码和密钥保存在权限 0600 的 `.env` 中。首次配置后可直接启动。

Caddy、Certbot、PostgreSQL 和数据库备份工具同样拉取已有镜像；应用 Compose 没有 build 字段，love 不提供本地构建入口。国内网络无法连接所选来源时，可选择自己的镜像缓存仓库。

## 日常管理

每次运行 `./love`，在菜单中选择：

| 操作                            | 行为                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| 初次配置 / 修改部署配置         | 数据库连接、IP、端口、HTTPS、证书及初始配置；密码回车保留，媒体密钥保持稳定                    |
| 启动 / 停止 / 重启              | 自动选择 PostgreSQL、HTTPS 和 Certbot 覆盖文件；复用数据卷                                     |
| 状态与版本 / 日志               | 容器健康状态、镜像 ID 和创建时间、最近 200 行日志                                              |
| 更新软件及管理工具              | 先备份，下载并校验部署包和应用镜像，更新 love / Compose / 证书脚本，再启动；保留 .env 和数据卷 |
| 备份 / 恢复                     | 应用停止写入后备份媒体、SQLite 或 PostgreSQL、部署配置及校验清单；恢复前再备份当前状态         |
| 管理员密码 / 注册 / SMTP / 容量 | 在下载的镜像中打开现代终端向导，直接管理现有服务器设置、用户账号、配对额度和邀请码             |
| 选择来源并下载镜像              | 切换 Release、GHCR 或自定义仓库，下载后由“启动”应用                                            |
| 卸载                            | 默认移除当前部署容器并保留数据；删除数据卷需要输入当前部署专属确认文字                         |
| 回滚上次更新的镜像              | 使用更新前保存的本地镜像；不回滚配置与数据，跨数据库结构版本应使用对应备份                     |

更新和备份失败会显示错误，保留原配置。更新启动失败时可以选择镜像回滚，或按需要恢复完整备份。滚动发布正在替换附件时可能出现校验失败；程序不会加载该文件，稍后重试即可。

## 备份和恢复

备份位于部署目录的 `backups/时间戳/`：`deployment.env`、`data.tar.gz`、PostgreSQL 的 `database.dump` 和 `SHA256SUMS`。包含密码、媒体密钥及私人媒体，请保存到安全位置，不要提交到 Git。

SQLite 在应用停止后备份数据卷。PostgreSQL 通过 PostgreSQL 18 的客户端镜像进行一致性 dump；外部数据库需要可从容器网络访问且账号具备 dump / restore 权限。love 停止自己的应用写入，外部数据库若还有其他写入程序，管理员应一并暂停，以保证数据库与媒体对应。

恢复只接受当前部署的备份，校验数据库类型、项目名和 SHA-256，并要求输入 `RESTORE`；覆盖前先保存当前状态。恢复失败时保持应用停止，防止继续向不完整数据写入。部署目录和备份仍保留，可排查后重新恢复。

## 镜像发布

主分支 CI 的 Web、SQLite、真实 PostgreSQL、两种 Dockerfile、Android 全部成功后，发布流程在原生 amd64 / arm64 运行器构建、启动测试、导出、重新导入并验证镜像，随后发布 GHCR 多架构 manifest 及 Release。`image-info.json` 记录源码提交和 digest；`SHA256SUMS` 校验附件。APK 使用独立版本 Release。

Dockerfile 与 Dockerfile.cn 保留给开发者和 CI；用户部署统一使用此菜单下载镜像。
