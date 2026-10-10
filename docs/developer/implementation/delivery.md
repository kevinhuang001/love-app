# CI 与发布：怎样保证测试的是实际交付的代码

本地通过不等于用户最终下载的二进制可用。Love 的 CI 同时检查源代码、真实数据库、容器、独立管理程序与 APK；发布流程再核对测试提交和产物来源。

代码入口：[CI](../../../.github/workflows/ci.yml)、[镜像发布](../../../.github/workflows/containers.yml)、[Release](../../../.github/workflows/release.yml)、[管理程序构建](../../../manager/build.mjs)、[原生自测](../../../tests/manager/self-test.mjs)。命令和维护步骤见 [CI 参考](../ci.md)。

## 为什么需要多个测试环境

```mermaid
flowchart TB
  A[当前提交] --> T[类型、单元、构建、浏览器测试]
  A --> P[真实 PostgreSQL 测试]
  A --> D[两份 Dockerfile 构建与部署]
  A --> M[编译管理程序并测试 AMD64]
  A --> K[构建并核验 Android APK]
  M --> R[ARM64 空目录运行同一产物]
  T --> G[必需 job 全部成功]
  P --> G
  D --> G
  R --> G
  K --> G
```

SQLite 测试不能证明 PostgreSQL 的类型、事务、分块和序列正确；源码测试不能证明 Bun 编译后的二进制带齐依赖；模拟网络不能代替真正容器网络。管理程序自测从空目录、干净环境运行，避免机器上残留项目文件掩盖漏打包。

备份压缩在 Node CLI 和 Bun 管理程序共用流式实现。自测实际生成 Zstandard 归档、解包、核对内容并恢复，两个架构都要跑。测试假证书用于检查部署流程，不代表真实域名证书申请已经成功。

## 三种产物如何分别发布

```mermaid
flowchart TB
  A[main 的 Test and build 成功] --> B[核对来源 SHA 与必需 jobs]
  B --> C{发布目标}
  C -->|Release| D[下载已测试管理程序与 APK]
  D --> E[核对版本、正式签名、校验和]
  E --> F{tag 尚未发布？}
  F -->|是| G[创建新 Release]
  F -->|否| H[自动流程跳过，不覆盖]
  C -->|GHCR| I[分别构建与测试 AMD64、ARM64]
  I --> J[合并并发布多架构镜像]
```

Release 使用构建产物，不在发布步骤另建一份未经相同检查的 APK。镜像是独立流程，发布时也验证来源提交。不能因为 APK 成功就推断容器成功，反过来也一样。

PR 的镜像验证不发布 GHCR；纯文档 PR 不触发额外 containers 工作流，但仍触发 Test and build 的 Docker job。合并前查看当前 head 的检查，不采用上一个提交的绿色结果。

## 安装和更新如何利用产物元数据

```mermaid
flowchart TB
  A[用户运行安装器或检查更新] --> B{管理程序产物}
  B --> C[选择对应 CPU 架构并下载]
  C --> D[校验 SHA-256 与版本元数据]
  D --> E{验证通过？}
  E -->|否| X[保留原程序并报错]
  E -->|是| F[原子替换管理程序]
  A --> G[检查官方应用镜像版本与 digest]
  G --> H[显示当前与最新版本]
  H --> I[确认后更新并等待健康]
```

更新界面把管理程序和应用镜像分开显示。原生数据库维护要求两者版本一致，避免新管理程序提前迁移仍由旧应用使用的数据库。更新后没有软件版本回滚选项；恢复过程的失败回滚属于数据一致性保护，不是运行旧软件的入口。

更改版本号要同步 package 元数据、APPLICATION_VERSION、发布 tag 默认值和文档。应用版本、SQL 版本、备份格式版本独立，只有相应约定变化才增加各自编号。
