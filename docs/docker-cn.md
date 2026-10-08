# 国内镜像构建

`Dockerfile.cn` 提供与默认 `Dockerfile` 相同的应用与媒体处理能力，使用以下源：

| 工具            | 镜像源                                        |
| --------------- | --------------------------------------------- |
| npm             | `https://registry.npmmirror.com/`             |
| pip             | `https://mirrors.ustc.edu.cn/pypi/simple`     |
| Debian apt      | `https://mirrors.ustc.edu.cn/debian`          |
| Debian 安全更新 | `https://mirrors.ustc.edu.cn/debian-security` |

应用没有 Python 依赖，镜像通过 `PIP_INDEX_URL` 配置 pip 源，不额外安装 Python 或 pip。npm 继续使用仓库的依赖锁与完整性校验；无需修改 `package-lock.json`。

## 首次部署

```sh
LOVE_DOCKERFILE=Dockerfile.cn ./love up
```

首次构建和配置向导均使用国内镜像版。向导将选择保存到 `.env`，后续直接运行 `./love up`。SQLite、内置或外部 PostgreSQL、HTTPS 和 SMTP 的配置流程见 [数据库与部署向导](database.md)。

## 已有部署

在原有 `.env` 中添加或修改这一行，保留其他配置和数据卷：

```dotenv
LOVE_DOCKERFILE=Dockerfile.cn
```

```sh
./love up
```

直接使用 Compose 的部署也读取这一项；保持原有项目名、配置文件和 profiles。例如内置 PostgreSQL 与 HTTPS：

```sh
docker compose -p love-v4 -f compose.yml -f compose.postgres.yml --profile https up -d --build --wait
```

## 单独构建

```sh
docker build -f Dockerfile.cn -t love-app:local .
```

可通过 `--build-arg NPM_REGISTRY=https://registry.npmmirror.com/` 或 `--build-arg PIP_INDEX_URL=https://mirrors.ustc.edu.cn/pypi/simple` 覆盖语言包源。基础镜像仍是 `node:24-bookworm-slim`；拉取 Docker Hub 镜像的网络配置与 apt/npm 镜像源独立。如使用自己的镜像缓存，可传入 `--build-arg NODE_IMAGE=你的仓库/node:24-bookworm-slim`，该镜像应与官方 Bookworm slim 基础镜像一致。

## apt 签名错误

国内构建切换 apt 下载链路到中科大 HTTPS 源，保留 Debian 的 `Signed-By` 和完整签名验证。精简基础镜像缺少系统 CA 时，先用 Node 内置可信根证书启动 HTTPS，再正常安装 Debian 的 `ca-certificates`。网络超时设置为 30 秒，重试 3 次，索引更新出现错误立即终止。

如果切换后仍提示 `At least one invalid signature`，检查宿主机的 `date -Is`、`df -h`、`df -i`、`docker system df`，排查磁盘空间、系统时间或代理返回错误内容。更新代码后可用 `docker compose -p love-v4 build --no-cache love` 重新获取索引（PostgreSQL 部署保留原有 `-f` 参数）。不要关闭签名验证或使用 `--allow-unauthenticated`。

GitHub CI 实际构建两份 Dockerfile，分别运行 SQLite 和 PostgreSQL 的容器功能与持久化检查，国内版另检查镜像源配置。
