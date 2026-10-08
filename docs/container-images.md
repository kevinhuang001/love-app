# 预构建镜像部署

提供三种部署方式：

| 方式                       | 用途                                     | 本机构建 |
| -------------------------- | ---------------------------------------- | -------- |
| GHCR 容器仓库              | 日常部署，Docker 自动选择 x86_64 / ARM64 | 不需要   |
| Release 镜像包             | 无法连接 GHCR，或手动传输到服务器        | 不需要   |
| Dockerfile / Dockerfile.cn | 自定义代码、本地构建                     | 需要     |

## GHCR 拉取

从项目目录运行：

```sh
LOVE_IMAGE=ghcr.io/kevinhuang001/love-app:latest ./love up
```

启动器直接拉取镜像，跳过 build。没有 `.env` 时，在该镜像中运行首次配置向导，配置 SQLite 或 PostgreSQL、管理员、容量、HTTPS 和可选 SMTP，保存后启动服务。镜像地址会一同保存，后续运行 `./love up` 自动拉取并启动。

已有部署先在原 `.env` 中修改或添加：

```dotenv
LOVE_IMAGE=ghcr.io/kevinhuang001/love-app:latest
LOVE_IMAGE_PULL=1
```

然后执行 `./love up`。保留原项目名、媒体密钥、其他配置和数据卷。

GHCR 地址：[love-app 容器包](https://github.com/kevinhuang001/love-app/pkgs/container/love-app)。新包首次发布默认私有，项目所有者在 **Package settings → Change visibility → Public** 设置一次即可让用户免登录拉取。GitHub Actions 使用自动提供的 `GITHUB_TOKEN` 发布，无需手动配置 PAT。

## Release 下载与导入

[Docker 镜像下载](https://github.com/kevinhuang001/love-app/releases/tag/docker-latest) 提供：

- `Love-docker-amd64.tar.gz`：普通 Intel / AMD 64 位 Linux 服务器。
- `Love-docker-arm64.tar.gz`：ARM64 Linux 服务器。
- `Love-docker-deploy.tar.gz`：部署配置与启动器，可替代克隆整个项目。
- `SHA256SUMS`、`image-info.json`：文件校验、源码提交和镜像 digest。

`uname -m` 为 `x86_64` 选择 amd64，为 `aarch64` 选择 arm64。下载对应架构的镜像包、部署包和 `SHA256SUMS` 到同一目录，可执行 `sha256sum --ignore-missing -c SHA256SUMS` 校验已下载文件。

新服务器（以 amd64 为例）：

```sh
mkdir love-deploy
tar -xzf Love-docker-deploy.tar.gz -C love-deploy
docker load -i Love-docker-amd64.tar.gz
cd love-deploy
LOVE_IMAGE=love-app:prebuilt LOVE_IMAGE_PULL=0 ./love up
```

ARM64 替换导入的文件名，其余相同。导入的应用镜像统一命名为 `love-app:prebuilt`；`LOVE_IMAGE_PULL=0` 禁止从 registry 拉取该镜像。配置向导保存这些设置，后续直接运行 `./love up`。Caddy、Certbot（选择时）和 PostgreSQL（选择时）仍需首次拉取自身镜像，完整离线部署还需单独准备这些镜像。

已有部署先将新部署包解压到原项目目录，更新启动器、Compose 和证书脚本（保留原 `.env`）。然后 `docker load` 新镜像，将 `.env` 设置为 `LOVE_IMAGE=love-app:prebuilt`、`LOVE_IMAGE_PULL=0`，然后在原项目目录运行 `./love up`。无需清空数据卷。

## 直接使用 Compose

设置好 `.env` 后，GHCR 方式：

```sh
docker compose -p love-v4 -f compose.yml -f compose.https.yml --profile https up -d --no-build --pull always --wait
```

从 Release 导入方式：

```sh
docker compose -p love-v4 -f compose.yml -f compose.https.yml --profile https up -d --no-build --pull missing --wait
```

以上为 Caddy 自动 HTTPS；Certbot 还需加 `-f compose.certbot.yml`，HTTP 则去掉 `compose.https.yml` 和 `--profile https`。内置 HTTPS 需要 Compose >= 2.24.4，`LOVE_TLS_PORT` 设置公网端口，`LOVE_TLS_BIND_IP` 设置监听 IP。推荐使用 `./love up` 自动选择组合。

内置 PostgreSQL 在命令中加入 `-f compose.yml -f compose.postgres.yml`，保持原有项目名。这里的 `--no-build` 明确禁止 Compose 从源码构建。

## 更新与固定镜像

`latest` 和 `main` 跟随最新通过 CI 的主分支，Release 的 `docker-latest` 同步替换为这次构建的镜像包。`image-info.json` 标明实际源码提交。

需要固定来源时，在 `.env` 使用 `LOVE_IMAGE=ghcr.io/kevinhuang001/love-app:sha-完整40位提交`；需要固定镜像内容，使用 `LOVE_IMAGE=ghcr.io/kevinhuang001/love-app@sha256:镜像digest`。回退镜像前仍需确认数据库结构是否兼容，并保留数据备份。

恢复本地构建设置 `LOVE_IMAGE=love-app:local`；国内源设置 `LOVE_DOCKERFILE=Dockerfile.cn`。运行 `./love up` 会重新走 build。

## 发布与验证

主分支的 Test and build 全部通过后，独立发布流程在原生 x86_64 和 ARM64 运行器上构建镜像，检查应用功能与持久化，再导出、删除镜像、重新 `docker load` 并验证恢复后的容器。两种架构均通过才发布 GHCR 多架构 manifest 和 Release 文件。PR 只构建和验证，不会发布。过时的主分支 CI 结果不会更新滚动发布。

管理员也可在 **Actions → Build and publish container images → Run workflow** 填入当前主分支成功的 Test and build `run_id` 重新发布。
