# 国内镜像 Dockerfile.cn（开发者与 CI）

用户部署运行 `./love`，从菜单下载预构建镜像，见 [镜像与管理菜单](container-images.md)。不再提供本地 build 部署入口。

开发者需要修改源码并构建时，可执行：

```sh
docker build -f Dockerfile.cn -t love-development .
```

Dockerfile.cn 使用 npmmirror 的 npm 源、中科大的 pip 和 apt HTTPS 镜像源，保持证书及 APT 签名验证。可通过 `NPM_REGISTRY`、`PIP_INDEX_URL`、`NODE_IMAGE` build arguments 指定自己的缓存。基础镜像默认为 Node 24 Bookworm slim。

`At least one invalid signature` 需要检查系统时间、磁盘空间、代理返回内容；不要关闭签名验证。CI 会构建标准版和国内镜像版，并检查源、证书、FFmpeg、实际容器功能及数据库持久化。
