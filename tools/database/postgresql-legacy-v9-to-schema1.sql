-- Love：旧版 database_meta=9 → 新 schema 1，一次性 PostgreSQL 迁移。
-- 先停止 Love 应用；在 Love 的数据库中执行整个文件（DBeaver 使用“执行 SQL 脚本”）。
-- 默认应用表位于 public；如果你明确使用其他 schema，只修改下面这一行。
-- 不删除用户、消息、媒体或任何业务表；只替换版本记录。
-- 检查失败时整个事务回滚。可重复执行，不会重复登记。
BEGIN;
SET LOCAL search_path TO public;
SET LOCAL lock_timeout = '10s';

DO $love_migration$
DECLARE
  target_schema text := current_schema();
  spec jsonb := $love_spec${
  "access_logs": [
    {
      "name": "id",
      "type": "int8",
      "required": true
    },
    {
      "name": "requestId",
      "type": "text",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    },
    {
      "name": "method",
      "type": "text",
      "required": true
    },
    {
      "name": "path",
      "type": "text",
      "required": true
    },
    {
      "name": "status",
      "type": "int8",
      "required": true
    },
    {
      "name": "durationMs",
      "type": "float4",
      "required": true
    },
    {
      "name": "ip",
      "type": "text",
      "required": true
    },
    {
      "name": "actorId",
      "type": "text",
      "required": false
    },
    {
      "name": "userAgent",
      "type": "text",
      "required": true
    }
  ],
  "admin_sessions": [
    {
      "name": "hash",
      "type": "text",
      "required": true
    },
    {
      "name": "adminId",
      "type": "text",
      "required": true
    },
    {
      "name": "expires",
      "type": "int8",
      "required": true
    }
  ],
  "administrators": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "username",
      "type": "text",
      "required": true
    },
    {
      "name": "password",
      "type": "text",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    }
  ],
  "ai_actions": [
    {
      "name": "messageId",
      "type": "int8",
      "required": true
    },
    {
      "name": "callId",
      "type": "text",
      "required": true
    },
    {
      "name": "result",
      "type": "text",
      "required": true
    }
  ],
  "ai_jobs": [
    {
      "name": "messageId",
      "type": "int8",
      "required": true
    },
    {
      "name": "userId",
      "type": "text",
      "required": false
    },
    {
      "name": "status",
      "type": "text",
      "required": true
    },
    {
      "name": "error",
      "type": "text",
      "required": false
    },
    {
      "name": "transcript",
      "type": "text",
      "required": false
    }
  ],
  "album_imports": [
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "digest",
      "type": "text",
      "required": true
    }
  ],
  "anniversaries": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "title",
      "type": "text",
      "required": true
    },
    {
      "name": "date",
      "type": "text",
      "required": true
    },
    {
      "name": "time",
      "type": "text",
      "required": true
    }
  ],
  "audit_logs": [
    {
      "name": "id",
      "type": "int8",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    },
    {
      "name": "adminId",
      "type": "text",
      "required": true
    },
    {
      "name": "action",
      "type": "text",
      "required": true
    },
    {
      "name": "target",
      "type": "text",
      "required": true
    },
    {
      "name": "details",
      "type": "text",
      "required": true
    }
  ],
  "captchas": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "hash",
      "type": "text",
      "required": true
    },
    {
      "name": "purpose",
      "type": "text",
      "required": true
    },
    {
      "name": "ipHash",
      "type": "text",
      "required": true
    },
    {
      "name": "expires",
      "type": "int8",
      "required": true
    }
  ],
  "couple_ai_settings": [
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "baseUrl",
      "type": "text",
      "required": true
    },
    {
      "name": "model",
      "type": "text",
      "required": true
    },
    {
      "name": "secret",
      "type": "text",
      "required": true
    },
    {
      "name": "enabled",
      "type": "int8",
      "required": true
    },
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "avatarMediaId",
      "type": "text",
      "required": false
    }
  ],
  "couple_limits": [
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "quotaMiB",
      "type": "int8",
      "required": true
    }
  ],
  "couple_media_settings": [
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "retainOriginal",
      "type": "int8",
      "required": true
    }
  ],
  "couples": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "startDate",
      "type": "text",
      "required": false
    },
    {
      "name": "startTime",
      "type": "text",
      "required": true
    }
  ],
  "email_allowlist": [
    {
      "name": "email",
      "type": "text",
      "required": true
    },
    {
      "name": "note",
      "type": "text",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    }
  ],
  "email_codes": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "email",
      "type": "text",
      "required": true
    },
    {
      "name": "purpose",
      "type": "text",
      "required": true
    },
    {
      "name": "hash",
      "type": "text",
      "required": true
    },
    {
      "name": "attempts",
      "type": "int8",
      "required": true
    },
    {
      "name": "expires",
      "type": "int8",
      "required": true
    },
    {
      "name": "sentAt",
      "type": "int8",
      "required": true
    },
    {
      "name": "status",
      "type": "text",
      "required": true
    }
  ],
  "invites": [
    {
      "name": "hash",
      "type": "text",
      "required": true
    },
    {
      "name": "userId",
      "type": "text",
      "required": false
    },
    {
      "name": "expires",
      "type": "int8",
      "required": true
    }
  ],
  "media": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "coupleId",
      "type": "text",
      "required": false
    },
    {
      "name": "ownerId",
      "type": "text",
      "required": false
    },
    {
      "name": "kind",
      "type": "text",
      "required": true
    },
    {
      "name": "original",
      "type": "text",
      "required": true
    },
    {
      "name": "preview",
      "type": "text",
      "required": true
    },
    {
      "name": "thumbnail",
      "type": "text",
      "required": true
    },
    {
      "name": "width",
      "type": "int8",
      "required": false
    },
    {
      "name": "height",
      "type": "int8",
      "required": false
    },
    {
      "name": "duration",
      "type": "float4",
      "required": false
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    }
  ],
  "media_sizes": [
    {
      "name": "mediaId",
      "type": "text",
      "required": true
    },
    {
      "name": "originalBytes",
      "type": "int8",
      "required": true
    },
    {
      "name": "previewBytes",
      "type": "int8",
      "required": true
    },
    {
      "name": "thumbnailBytes",
      "type": "int8",
      "required": true
    },
    {
      "name": "totalBytes",
      "type": "int8",
      "required": true
    }
  ],
  "media_uploads": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "ownerId",
      "type": "text",
      "required": true
    },
    {
      "name": "metadata",
      "type": "text",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    }
  ],
  "message_media": [
    {
      "name": "messageId",
      "type": "int8",
      "required": true
    },
    {
      "name": "mediaId",
      "type": "text",
      "required": true
    },
    {
      "name": "position",
      "type": "int8",
      "required": true
    }
  ],
  "messages": [
    {
      "name": "id",
      "type": "int8",
      "required": true
    },
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "senderId",
      "type": "text",
      "required": true
    },
    {
      "name": "clientId",
      "type": "text",
      "required": true
    },
    {
      "name": "content",
      "type": "text",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    },
    {
      "name": "readAt",
      "type": "text",
      "required": false
    },
    {
      "name": "role",
      "type": "text",
      "required": true
    },
    {
      "name": "assistantName",
      "type": "text",
      "required": false
    },
    {
      "name": "assistantAvatarMediaId",
      "type": "text",
      "required": false
    }
  ],
  "moments": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "ownerId",
      "type": "text",
      "required": false
    },
    {
      "name": "title",
      "type": "text",
      "required": true
    },
    {
      "name": "mediaId",
      "type": "text",
      "required": true
    },
    {
      "name": "date",
      "type": "text",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    }
  ],
  "registration_invites": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "hash",
      "type": "text",
      "required": true
    },
    {
      "name": "label",
      "type": "text",
      "required": true
    },
    {
      "name": "uses",
      "type": "int8",
      "required": true
    },
    {
      "name": "maxUses",
      "type": "int8",
      "required": true
    },
    {
      "name": "expires",
      "type": "int8",
      "required": true
    },
    {
      "name": "revoked",
      "type": "int8",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    }
  ],
  "server_config": [
    {
      "name": "key",
      "type": "text",
      "required": true
    },
    {
      "name": "value",
      "type": "text",
      "required": true
    }
  ],
  "server_logs": [
    {
      "name": "id",
      "type": "int8",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    },
    {
      "name": "level",
      "type": "text",
      "required": true
    },
    {
      "name": "event",
      "type": "text",
      "required": true
    },
    {
      "name": "details",
      "type": "text",
      "required": true
    }
  ],
  "sessions": [
    {
      "name": "hash",
      "type": "text",
      "required": true
    },
    {
      "name": "userId",
      "type": "text",
      "required": true
    },
    {
      "name": "expires",
      "type": "int8",
      "required": true
    }
  ],
  "todos": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "coupleId",
      "type": "text",
      "required": true
    },
    {
      "name": "title",
      "type": "text",
      "required": true
    },
    {
      "name": "date",
      "type": "text",
      "required": true
    },
    {
      "name": "time",
      "type": "text",
      "required": true
    },
    {
      "name": "calendar",
      "type": "text",
      "required": true
    },
    {
      "name": "leapMonth",
      "type": "int8",
      "required": true
    },
    {
      "name": "repeat",
      "type": "text",
      "required": true
    },
    {
      "name": "completed",
      "type": "int8",
      "required": true
    },
    {
      "name": "completedDate",
      "type": "text",
      "required": false
    }
  ],
  "users": [
    {
      "name": "id",
      "type": "text",
      "required": true
    },
    {
      "name": "username",
      "type": "text",
      "required": true
    },
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "password",
      "type": "text",
      "required": true
    },
    {
      "name": "coupleId",
      "type": "text",
      "required": false
    },
    {
      "name": "avatarMediaId",
      "type": "text",
      "required": false
    },
    {
      "name": "email",
      "type": "text",
      "required": true
    },
    {
      "name": "verifiedAt",
      "type": "text",
      "required": false
    },
    {
      "name": "disabled",
      "type": "int8",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "text",
      "required": true
    },
    {
      "name": "lastLoginAt",
      "type": "text",
      "required": false
    }
  ],
  "media_files": [
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "mediaId",
      "type": "text",
      "required": false
    },
    {
      "name": "bytes",
      "type": "int8",
      "required": true
    },
    {
      "name": "sha256",
      "type": "text",
      "required": true
    },
    {
      "name": "complete",
      "type": "int8",
      "required": true
    },
    {
      "name": "updatedAt",
      "type": "text",
      "required": true
    }
  ],
  "media_chunks": [
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "position",
      "type": "int8",
      "required": true
    },
    {
      "name": "data",
      "type": "bytea",
      "required": true
    }
  ]
}$love_spec$::jsonb;
  item record;
  col jsonb;
  actual_type text;
  actual_required boolean;
  actual_columns integer;
  history_count integer;
  old_version bigint;
BEGIN
  IF target_schema IS NULL THEN
    RAISE EXCEPTION '目标 schema 不存在，请检查 search_path';
  END IF;

  IF to_regclass(format('%I.schema_migrations', target_schema)) IS NOT NULL THEN
    EXECUTE format('SELECT count(*) FROM %I.schema_migrations', target_schema) INTO history_count;
    IF history_count = 1 AND EXISTS (
      SELECT 1 FROM schema_migrations
      WHERE version = 1 AND name = '001_initial' AND checksum = '6210ab54c5c1690f33fbc3965c75db873714414223e14eb8b88120b052c09d2f'
    ) THEN
      RAISE NOTICE '数据库已经登记为 schema 1，无需重复迁移';
      RETURN;
    END IF;
    RAISE EXCEPTION '数据库已有其他迁移历史，不能用此文件覆盖';
  END IF;

  IF to_regclass(format('%I.database_meta', target_schema)) IS NULL THEN
    RAISE EXCEPTION '没有找到旧版 database_meta，不能确认数据库版本';
  END IF;
  EXECUTE format('LOCK TABLE %I.database_meta IN ACCESS EXCLUSIVE MODE', target_schema);
  EXECUTE format('SELECT count(*), min(version) FROM %I.database_meta', target_schema)
    INTO history_count, old_version;
  IF history_count <> 1 OR old_version IS DISTINCT FROM 9 THEN
    RAISE EXCEPTION '此文件只适用于旧版本标记 9；实际记录数 %，版本 %', history_count, old_version;
  END IF;

  FOR item IN SELECT key AS table_name, value AS columns FROM jsonb_each(spec) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=target_schema AND c.relname=item.table_name AND c.relkind='r'
    ) THEN
      RAISE EXCEPTION '缺少旧版业务表：%', item.table_name;
    END IF;
    EXECUTE format('LOCK TABLE %I.%I IN ACCESS EXCLUSIVE MODE', target_schema, item.table_name);
    SELECT count(*) INTO actual_columns FROM information_schema.columns
      WHERE table_schema=target_schema AND table_name=item.table_name;
    IF actual_columns <> jsonb_array_length(item.columns) THEN
      RAISE EXCEPTION '表 % 字段数量不符，停止迁移', item.table_name;
    END IF;
    FOR col IN SELECT value FROM jsonb_array_elements(item.columns) LOOP
      SELECT udt_name, is_nullable='NO' INTO actual_type, actual_required
      FROM information_schema.columns
      WHERE table_schema=target_schema AND table_name=item.table_name AND column_name=col->>'name';
      IF actual_type IS NULL OR NOT (
        actual_type=col->>'type' OR (col->>'type'='float4' AND actual_type='float8')
      ) OR actual_required IS DISTINCT FROM (col->>'required')::boolean THEN
        RAISE EXCEPTION '表 %.% 字段类型或非空约束不符，停止迁移', item.table_name, col->>'name';
      END IF;
    END LOOP;
  END LOOP;

  -- schema 1 定义是此前完整表结构的重新编号，不运行 CREATE TABLE 业务初始化。
  CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );
  INSERT INTO schema_migrations(version,name,checksum,applied_at)
  VALUES (1, '001_initial', '6210ab54c5c1690f33fbc3965c75db873714414223e14eb8b88120b052c09d2f',
    to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  DROP TABLE database_meta;
  RAISE NOTICE '迁移完成：schema 1 已登记，业务数据保留，可以启动 Love';
END
$love_migration$;
COMMIT;

SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version;
