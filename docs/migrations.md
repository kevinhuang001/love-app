# 数据库迁移与备份版本

应用版本（例如 2.9.2）、备份格式版本（目前为 1）和数据库迁移版本（目前为 1）分别管理。没有数据库变更的发布无需增加迁移编号。

## 版本 1 与启动

`apps/server/src/migrations/001-initial.ts` 固定当前业务结构，以及 PostgreSQL 媒体分块表和外键。全新数据库执行 001；以后每次后端启动只执行尚未应用的增量。Docker 和非 Docker 运行均通过 `openDatabase` 执行相同流程，不依赖管理菜单的“更新”。镜像拉取不连接数据库，启动新容器时才迁移。

`schema_migrations` 保存每个增量的 `version`、`name`、`checksum`、`applied_at`。SQLite 使用 `BEGIN IMMEDIATE`，PostgreSQL 使用事务 advisory lock，检查历史、执行 DDL/数据转换、写历史在同一事务内完成。待执行增量整体提交；任一步失败全部回滚，应用启动失败。多个进程启动不会重复迁移。

迁移历史必须从 1 连续编号，且与镜像内的名称和校验和一致。未知的高版本数据库拒绝启动；不会降级或静默跳过。没有迁移记录的已有数据库、旧 `PRAGMA user_version` / `database_meta` 结构不自动采纳。此次按要求删除旧结构兼容，不提供此前 schema 4～9 的升级路径。

查看数据库版本：

```sql
SELECT version, name, checksum, applied_at
FROM schema_migrations ORDER BY version;
```

## 后续结构变更

1. 新增 `migrations/002-xxx.ts`，导出 `{ version: 2, name: '002_xxx', sqlite: '...', postgres: '...' }`。按实际数据库语法编写；可以包含数据转换。不要手写 BEGIN / COMMIT。
2. 在 `migrations.ts` 的 `migrations` 列表末尾追加该定义。编号不得跳跃；已发布定义及其所依赖的 SQL 转换不得修改。001 是快照，不能当作最新结构反复编辑。
3. 如增加正式业务表，将其加入 `database-restore.ts` 的 `transferTables`（已有表的相对顺序保持不变）；备份使用 `openDatabase` 创建完整目标 SQLite 结构，再按名称导出列，不再硬编码版本号或复制“最新 schema”。
4. 为从前一版本和跨多个版本的迁移添加数据保留、失败回滚与重复启动测试；分别测试 SQLite 与 PostgreSQL。

迁移应同时给两种数据库提供等价变化。对于不同存储方式的数据变化，还应维护备份的可移植表达和恢复转换。需要大规模或非事务操作时另行设计，当前框架不支持 `CREATE INDEX CONCURRENTLY` 等要求脱离事务的 SQL。

## 备份与导入

目录包含 `deployment.env`、`data.tar.gz`、`SHA256SUMS`。归档内必须有 `manifest.json`、`love.sqlite` 和 `media/`。清单包含格式版本、`applicationVersion`、`schemaVersion`、来源数据库、数据库 SHA-256、行数与媒体摘要；SQLite 快照包含完整迁移历史。PostgreSQL 也导出为相同可移植包。

导入先验证外层校验、应用/数据库版本、清单与历史一致性、数据库关联、行数和媒体摘要。仅允许低版本或同版本备份导入高版本或同版本软件。迁移只处理解压到临时目录的快照，校验通过后执行缺失增量，再对媒体和业务数据重新校验、重新加密凭据，最后切换/写入目标数据库。原归档不修改。高版本、损坏或无清单备份在修改目标数据前拒绝。

首次配置 SQLite 或内置 PostgreSQL 时，可选择导入并指定备份目录；只创建目标容器/数据卷，恢复完成后才询问启动应用。外部 PostgreSQL 不询问导入，直接连接并在后端启动时检查迁移。现有部署仍可通过“数据库管理 → 恢复备份”主动导入，当前部署配置不覆盖。管理程序与应用镜像的发布版本需一致。
