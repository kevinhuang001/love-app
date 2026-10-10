# 备份与相册文件格式

这篇文档用于实现导出、导入或排查备份文件。服务器备份恢复整台 Love；相册 ZIP 仅用于导出普通图片和视频，不能导入或用于恢复服务器。操作步骤见[日常维护](../user/manage.md)，执行过程见[备份与恢复实现](implementation/backup-restore.md)。

## 三个版本号

| 字段                 | 当前值 | 管什么                                                |
| -------------------- | ------ | ----------------------------------------------------- |
| `applicationVersion` | 2.9.3  | 生成备份的软件版本；较新软件的备份不能导入较旧软件    |
| `schemaVersion`      | 1      | 快照里的表结构；低版本通过 SQL 迁移升级               |
| `version`            | 2      | 备份清单与数据表达方式；格式 1 通过独立转换器升级到 2 |

三者独立。增加表字段只增加 schemaVersion；移动清单字段只增加备份格式 version；普通功能更新可以只改变 applicationVersion。导入必须同时通过三个门槛，不能只比较其中一个。

## 备份目录

管理程序每次生成一个独立目录：

| 路径             | 文件内容                                                 | 恢复时用途                       |
| ---------------- | -------------------------------------------------------- | -------------------------------- |
| `deployment.env` | 来源部署的环境配置，含数据库连接、管理员配置、媒体密钥等 | 读取来源密钥；不覆盖目标部署配置 |
| `data.tar.zst`   | Zstandard 压缩的 tar，级别 15                            | 提取快照、媒体和格式清单         |
| `SHA256SUMS`     | 上述两个文件的 SHA-256，每行是 `摘要  文件名`            | 恢复前校验外层文件               |

外层文件名是稳定的导入入口，没有单独的外层版本号。`SHA256SUMS` 必须恰好识别 deployment.env 和唯一的数据归档（当前 data.tar.zst，旧版 data.tar.gz），重复条目、缺少条目和摘要不符均拒绝。SHA-256 用于一致性校验，不是数字签名：能修改整个备份的人也能重算摘要，备份仍需从可信来源取得。

`deployment.env` 含私人凭据，备份不是加密归档。保留权限并妥善存放。

## 数据归档内部结构

| 路径             | 说明                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `manifest.json`  | UTF-8 JSON 清单；记录格式、来源版本和校验结果                          |
| `love.sqlite`    | 可移植的 SQLite 数据快照，无论来源数据库是哪一种                       |
| `media/<文件名>` | 快照引用的媒体字节；包括原文件（若保留）、预览、缩略图、个人和助手头像 |

tar 不包含 SQLite 的 wal / shm 文件、源服务器绝对路径、Docker 数据目录或 PostgreSQL PGDMP。媒体只接受 media/ 下一层文件名；解包拒绝绝对路径、路径穿越、链接、特殊文件和重复文件。其他安全的未识别文件不作为恢复内容。

这组路径是各格式版本共同的外壳。当前格式迁移在同一外壳内工作；若未来连外层入口或路径规则都改变，必须同时增加安全解包读法和历史格式测试，不能只改 JSON 里的数字。

## love.sqlite 保存哪些表

快照包含 29 张表：27 张正式业务表、`schema_migrations` 和已清空的 `media_uploads`。具体字段见 [SQLite 表结构](database-sqlite.md)。

正式业务表由 [transferTables](../../apps/server/src/database-restore.ts) 按依赖顺序列出。包含普通用户、配对、会话、管理员、聊天及附件、回忆、日程、AI 配置与任务、注册与邮件验证、容量和日志。暂存上传不恢复为正式内容。

SQLite 内部 `sqlite_sequence` 保留 messages、access_logs、server_logs、audit_logs 的编号高水位。假设最大曾用消息号是 100，但后来的消息已删除，当前 MAX(id)=80，恢复仍需保留 100，不能让新消息重新使用旧编号。

PostgreSQL 来源不直接复制 `media_files`、`media_chunks` 或 `database_restores`：业务表转成 SQLite，媒体分块拼回文件，内部恢复记录省略。目标 PostgreSQL 在恢复时重新创建分块和本次恢复记录。详见 [PostgreSQL 表结构](database-postgresql.md)。

## 压缩：Zstandard 级别 15

格式 2 的新备份默认生成 data.tar.zst，使用 Zstandard 级别 15（标准默认级别为 3），开启帧校验。压缩无损，不重新编码图片或视频。数据按文件流入 tar，再流入压缩器，不把整个相册或归档装进内存。

实现使用 Node 24 / Bun 1.4 的 node:zlib 流式 API，不调用外部 zstd 命令，也不要求宿主机安装额外工具。较高压缩级别会增加备份 CPU 时间和编码器内存；数据库、JSON 和文本通常更容易压缩，已压缩的 WebP / MP4 往往节省较少，不能保证整份备份的固定压缩比例。

普通恢复器只接受格式 2 的 Zstandard 归档。格式 1 的 data.tar.gz 由注册表中的格式 1 模块和 1 → 2 转换器处理：在私有目录解码 gzip，校验旧内容，转换清单，再生成完整的格式 2 Zstandard 临时归档。转换成功后，这份新归档才交给普通恢复器。原备份保持原样。更改后缀不能替代转换；格式 2 清单装在 gzip 里也会被拒绝。

外层 SHA256SUMS 只允许一种数据归档。如果同时列出 data.tar.gz 和 data.tar.zst，拒绝导入，避免恢复器猜错。损坏或截断的 Zstandard 流也会停止解包。

技术参考：[Node Zlib](https://nodejs.org/docs/latest-v24.x/api/zlib.html)、[Bun node:zlib](https://bun.com/reference/node/zlib)。

## 格式 2 的 manifest.json

| 字段                       | 类型    | 约束与含义                                          |
| -------------------------- | ------- | --------------------------------------------------- |
| `format`                   | string  | 固定 `love-backup`                                  |
| `version`                  | integer | 固定 2                                              |
| `applicationVersion`       | string  | 来源软件的 major.minor.patch                        |
| `schemaVersion`            | integer | 从 1 开始的数据库迁移编号                           |
| `provider`                 | string  | 来源数据库 sqlite 或 postgres；不限制目标数据库类型 |
| `createdAt`                | string  | ISO UTC 时间                                        |
| `integrity.algorithm`      | string  | 固定 sha256                                         |
| `integrity.reportVersion`  | integer | 固定 1，表示内容报告的字段与摘要算法版本            |
| `integrity.databaseSha256` | string  | love.sqlite 全文件的 64 位小写十六进制 SHA-256      |
| `integrity.report`         | object  | 下面列出的内容报告                                  |

内容报告字段：

| 字段           | 类型    | 内容                                         |
| -------------- | ------- | -------------------------------------------- |
| `sourceDigest` | string  | 业务行、媒体及自增序号的综合 SHA-256         |
| `tables`       | object  | 表名 → 行数，包含正式业务表                  |
| `mediaRecords` | integer | media 记录数                                 |
| `mediaFiles`   | integer | 实际引用文件数；别名复用同一文件时不重复复制 |
| `mediaBytes`   | integer | 实际媒体字节总数                             |

所有数量为非负、安全范围内的整数。清单按对应版本的严格字段定义校验；未知字段、未知摘要算法和未知 reportVersion 不会被猜测性接受。

例如下面是清单结构示意，摘要和数量都是示例值，不能拿它恢复：

```json
{
  "format": "love-backup",
  "version": 2,
  "applicationVersion": "2.9.3",
  "schemaVersion": 1,
  "provider": "postgres",
  "createdAt": "2026-10-09T18:00:00.000Z",
  "integrity": {
    "algorithm": "sha256",
    "reportVersion": 1,
    "databaseSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "report": {
      "sourceDigest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "tables": { "couples": 1, "users": 2 },
      "mediaRecords": 0,
      "mediaFiles": 0,
      "mediaBytes": 0
    }
  }
}
```

实际 tables 包含所有正式业务表，不仅是示例里的两张。

## 内容摘要怎么算

报告版本 1 由 [database-restore.ts](../../apps/server/src/database-restore.ts) 计算，SQLite 导出和 PostgreSQL 恢复共用同一规则。

先按约定的表顺序、列顺序和主键顺序读取行。每行将列值数组序列化为 JSON，追加换行后参与该表的 SHA-256。无主键时按所有列排序。每张表记录列名、排序表达式、行数和行摘要。随后读取每个引用文件，记录媒体归属、文件名、字节数和文件摘要。最后把这些表记录、文件记录以及按名称排序的 sqlite_sequence 记录序列化，再计算 sourceDigest。

恢复前重算报告并比较 JSON 内容，不依赖 JSON 对象键的书写顺序。数据库文件摘要校验快照字节，内容报告则校验数据关联和媒体；两者作用不同，都必须通过。

该算法、历史表的相对顺序和旧结构的列顺序是旧备份的读取约定。未来改算法必须新增 reportVersion 和对应读取器，不能让旧备份突然使用新的算法重算。新表和 SQL 迁移也要运行历史备份测试。

## 格式 1 如何升级

格式 1 的来源信息与目录布局相同，但 databaseSha256 和 report 位于 JSON 顶层，没有 integrity 对象。

[001 读取器](../../apps/server/src/migrations/backup/001.ts) 按旧定义解析并校验原快照与媒体。[002 转换器](../../apps/server/src/migrations/backup/002.ts) 将这两个字段放进 integrity，补上 algorithm=sha256 和 reportVersion=1，并将 version 改为 2。软件版本、数据库版本、来源数据库、备份时间和内容不改变。

转换后用格式 2 读取器再次验证内容，再决定是否执行 SQL 迁移。当前这次格式变化不改表、不重编码媒体，也不新增数据库迁移。

## 导入顺序与失败处理

1. 校验外层文件，安全解包到私有临时目录。
2. 按来源格式解析清单，拒绝较新格式、较新软件和较新 schema。
3. 先验证原内容，再逐版转换格式；每一步用目标格式重新验证。
4. 对已验证的 SQLite 临时副本执行缺少的 SQL 迁移；成功后重算清单与报告。
5. 显示恢复预览，包括来源与目标备份格式，等待操作者确认。
6. 用备份携带的密钥解密 AI / SMTP 凭据，再用目标密钥加密；无法解密时由操作者决定取消或清空失效凭据。
7. PostgreSQL 在事务中导入并复核；SQLite 用暂存文件和持久化恢复日志切换数据库与媒体。

来源备份目录和归档始终不改写，目标部署配置保留。任何前置校验或迁移失败都会停止，目标业务数据不被替换。临时副本可能有中间改动，失败后由调用者丢弃，不当作新的可用备份。

管理程序负责把归档提取成私有副本。底层 validatePackage 会修改传入的工作目录，直接调用它时也必须传副本，不能传唯一的原始备份。

缺清单、旧 PGDMP、没有新迁移历史的旧 schema 4～9 仍不支持。本次可转换的是此前新体系的格式 1，而不是所有历史备份。追加格式的开发步骤见[备份格式迁移](backup-migrations.md)。

## 相册 ZIP

用户相册导出只包含 JPEG 图片和 MP4 视频，实况照片拆成同名的两份文件。不再提供完整相册清单、格式选择或用户导入接口。这不影响上述管理程序的服务器备份与恢复格式。
