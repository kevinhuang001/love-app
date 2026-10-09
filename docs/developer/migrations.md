# 数据库迁移

结构变更保存为不可变的增量，启动时按顺序执行尚未应用的增量。应用版本、数据库迁移版本和备份格式版本分别管理；只有数据库变更才增加迁移编号。

## 当前起点

[migrations/001-initial.ts](../../apps/server/src/migrations/001-initial.ts) 固定本次重构时的完整结构，包括 PostgreSQL 媒体表和外键。[migrations.ts](../../apps/server/src/migrations.ts) 注册增量、生成校验和并执行迁移。

这是新的版本 1。旧 `PRAGMA user_version`／`database_meta`、此前 schema 4～9、没有新迁移历史的已有数据库均拒绝，不识别或自动采纳旧结构。新数据库和从版本 1 开始的历史才按增量升级。

## 执行规则

`openDatabase` 在后端启动和管理程序维护中调用迁移。SQLite 用 `BEGIN IMMEDIATE`；PostgreSQL 写事务先获取 advisory lock。锁内读取历史，执行待应用 SQL，再写历史。

所有待执行增量在同一事务中提交。任一步失败，DDL、数据和本次新增历史全部回滚，数据库连接不交给应用。多个进程启动会串行检查，不重复执行增量。

`schema_migrations` 的字段：

| 字段         | 用途                                                |
| ------------ | --------------------------------------------------- |
| `version`    | 从 1 开始连续的整数编号                             |
| `name`       | 增量名称，例如 `001_initial`                        |
| `checksum`   | 编号、名称、SQLite SQL 和 PostgreSQL SQL 的 SHA-256 |
| `applied_at` | 成功执行时的 ISO 时间                               |

历史必须是当前增量列表的连续前缀。缺号、名称或校验和变化，以及高于软件支持范围的版本均拒绝。空历史不能用来给已有业务结构重新打标。

查看历史：

```sql
SELECT version, name, checksum, applied_at
FROM schema_migrations ORDER BY version;
```

## 新增一个增量

以下是假设给 `couples` 增加 `label` 字段的示例，不是当前业务要求。创建 `apps/server/src/migrations/002-couple-label.ts`：

```ts
export const coupleLabelMigration = {
  version: 2,
  name: '002_couple_label',
  sqlite: "ALTER TABLE couples ADD COLUMN label TEXT NOT NULL DEFAULT '';",
  postgres: "ALTER TABLE couples ADD COLUMN label TEXT NOT NULL DEFAULT '';",
};
```

在 `migrations.ts` 导入并追加到 `migrations` 列表：

```ts
import { coupleLabelMigration } from './migrations/002-couple-label.js';
export const migrations: readonly Migration[] = [initialMigration, coupleLabelMigration];
```

两种数据库必须有等价的结构与数据变化，SQL 可以包含回填和数据转换。不要手写 BEGIN／COMMIT，不使用要求脱离事务的 `CREATE INDEX CONCURRENTLY` 等操作。

已发布增量不能修改；修复通过下一个增量完成。001 也不能当作“最新 schema”反复改写，它依赖的 SQL 转换代码同样影响校验和。

新增正式业务表时，维护 `database-restore.ts` 的 `transferTables`，保持已有表相对顺序并考虑外键依赖。备份通过 `openDatabase` 建立目标快照，不再另外维护一份最新建表脚本。涉及两种存储不同的数据变更时，同时检查可移植备份表达和恢复转换。

## 需要验证什么

至少覆盖上一版升级、跨多版升级、数据保留、重复启动、失败回滚、历史篡改和高版本拒绝。分别使用 SQLite 和真实 PostgreSQL；并发启动也要验证。

备份导入先校验原版本内容，再在临时副本迁移。原始归档不改写，目标数据在版本和内容检查之前不修改，流程见 [备份格式](backup-format.md)。

表结构演变的执行图见[实现细节](implementation/schema-migrations.md)。备份清单变化另走[备份格式迁移](backup-migrations.md)，不能通过 SQL 增量代替。
