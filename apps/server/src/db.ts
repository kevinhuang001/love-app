import { DatabaseSync, type SQLInputValue, type SQLOutputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';
import { schema } from './schema.js';
import { pairAIUpgrade } from './migrations.js';
export type User = {
  id: string;
  username: string;
  name: string;
  password: string;
  coupleId: string | null;
  email: string;
  disabled: number;
  verifiedAt: string | null;
};
export type Row = Record<string, SQLOutputValue>;
export type DatabaseOptions = { path: string; provider?: 'sqlite' | 'postgres'; schema?: string };
export type Statement = {
  get(...values: unknown[]): Promise<Row | undefined>;
  all(...values: unknown[]): Promise<Row[]>;
  run(...values: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }>;
};
export interface DB {
  readonly provider: 'sqlite' | 'postgres';
  prepare(sql: string): Statement;
  exec(sql: string): Promise<void>;
  transaction<T>(action: () => Promise<T> | T): Promise<T>;
  close(): Promise<void>;
}
class Queue {
  private tail: Promise<unknown> = Promise.resolve();
  async run<T>(action: () => Promise<T> | T): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await action();
    } finally {
      release();
    }
  }
}
// Convert syntax outside quoted SQL text only. All user values remain driver parameters.
export function postgresSQL(sql: string): string {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?|[A-Za-z_][A-Za-z_0-9]*/g, (token) => {
    if (token === '?') return '$' + ++index;
    if (token.startsWith("'") || token.startsWith('"')) return token;
    if (token.toLowerCase() === 'instr') return 'strpos';
    if (token === 'INTEGER') return 'BIGINT';
    return /[a-z][A-Z]/.test(token) ? '"' + token + '"' : token;
  });
}
function pgSchema() {
  const now = `(to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))`;
  return postgresSQL(
    schema
      .replaceAll('INTEGER PRIMARY KEY AUTOINCREMENT', 'BIGSERIAL PRIMARY KEY')
      .replaceAll("(strftime('%Y-%m-%dT%H:%M:%fZ','now'))", now)
      // PostgreSQL requires the target table to exist before this circular foreign key.
      .replace('avatarMediaId TEXT REFERENCES media(id)', 'avatarMediaId TEXT'),
  );
}
export async function openDatabase(input: string | DatabaseOptions): Promise<DB> {
  const options = typeof input === 'string' ? { path: input } : input;
  const url = /^postgres(?:ql)?:\/\//.test(options.path);
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(options.path) && !url)
    throw new Error('只支持 PostgreSQL URL 或 SQLite 路径');
  const provider = options.provider || (url ? 'postgres' : 'sqlite');
  if (provider === 'sqlite') {
    if (url) throw new Error('DATABASE_PROVIDER 与 DATABASE_URL 不一致');
    if (options.path !== ':memory:') mkdirSync(dirname(options.path), { recursive: true });
    const sqlite = new DatabaseSync(options.path);
    try {
      const version = Number(sqlite.prepare('PRAGMA user_version').get()!.user_version);
      if (version !== 0 && version !== 4 && version !== 5)
        throw new Error('数据库结构版本不匹配，请使用新的数据目录');
      sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        sqlite.exec(schema);
        if (version === 4) sqlite.exec(pairAIUpgrade);
        sqlite.exec('PRAGMA user_version=5; COMMIT;');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      sqlite.close();
      throw error;
    }
    const queue = new Queue(),
      context = new AsyncLocalStorage<boolean>();
    const execute = <T>(action: () => T): Promise<T> =>
      context.getStore() ? Promise.resolve().then(action) : queue.run(action);
    const db: DB = {
      provider,
      prepare: (sql) => ({
        get: (...values) =>
          execute(() => sqlite.prepare(sql).get(...(values as SQLInputValue[])) as Row | undefined),
        all: (...values) =>
          execute(() => sqlite.prepare(sql).all(...(values as SQLInputValue[])) as Row[]),
        run: (...values) =>
          execute(() => {
            const result = sqlite.prepare(sql).run(...(values as SQLInputValue[]));
            return { changes: Number(result.changes), lastInsertRowid: result.lastInsertRowid };
          }),
      }),
      exec: (sql) =>
        execute(() => {
          sqlite.exec(sql);
        }),
      transaction: (action) =>
        context.getStore()
          ? Promise.resolve().then(action)
          : queue.run(() =>
              context.run(true, async () => {
                sqlite.exec('BEGIN IMMEDIATE');
                try {
                  const value = await action();
                  sqlite.exec('COMMIT');
                  return value;
                } catch (error) {
                  sqlite.exec('ROLLBACK');
                  throw error;
                }
              }),
            ),
      close: () => queue.run(() => sqlite.close()),
    };
    return db;
  }
  if (options.schema && !/^[a-z][a-z0-9_]{0,62}$/.test(options.schema))
    throw new Error('无效的数据库 schema');
  const pool = new pg.Pool({
    ...(url ? { connectionString: options.path } : {}),
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ...(options.schema ? { options: `-c search_path=${options.schema}` } : {}),
    // Keep SQLite-compatible numeric API values; reject loss of integer precision.
    types: {
      getTypeParser: (oid: number, format?: 'text' | 'binary') =>
        oid === 20 || oid === 1700
          ? (value: string) => {
              const n = Number(value);
              if (!Number.isSafeInteger(n)) throw new Error('数据库整数超出安全范围');
              return n;
            }
          : pg.types.getTypeParser(oid, format),
    },
  });
  pool.on('error', () => console.error('PostgreSQL idle connection failed'));
  const context = new AsyncLocalStorage<pg.PoolClient>();
  const query = (sql: string, values: unknown[] = []) =>
    (context.getStore() || pool).query(postgresSQL(sql), values);
  const db: DB = {
    provider,
    prepare: (sql) => ({
      get: async (...values) => (await query(sql, values)).rows[0],
      all: async (...values) => (await query(sql, values)).rows,
      run: async (...values) => {
        // The only API consuming generated row IDs is message creation.
        const returning =
          /^\s*INSERT\s+INTO\s+messages\b/i.test(sql) && !/\bRETURNING\b/i.test(sql);
        const result = await query(sql + (returning ? ' RETURNING id' : ''), values);
        return { changes: result.rowCount || 0, lastInsertRowid: result.rows[0]?.id || 0 };
      },
    }),
    exec: async (sql) => {
      await query(sql);
    },
    transaction: async (action) => {
      if (context.getStore()) return action();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Serialize short mutation transactions across processes, preserving the same
        // quota/pairing/one-use-code semantics as SQLite's single-writer transaction.
        await client.query('SELECT pg_advisory_xact_lock(1279874629)');
        return await context.run(client, async () => {
          try {
            const value = await action();
            await client.query('COMMIT');
            return value;
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          }
        });
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
  try {
    if (options.schema) await pool.query(`CREATE SCHEMA IF NOT EXISTS "${options.schema}"`);
    await db.transaction(async () => {
      await db.exec('CREATE TABLE IF NOT EXISTS database_meta(version BIGINT PRIMARY KEY)');
      const version = await db.prepare('SELECT version FROM database_meta').get();
      if (version && version.version !== 4 && version.version !== 5)
        throw new Error('数据库结构版本不匹配');
      await db.exec(pgSchema());
      if (version?.version === 4) {
        await db.exec(pairAIUpgrade);
        await db.exec('DELETE FROM database_meta WHERE version=4');
      }
      await db.exec(`DO $$ BEGIN
        IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='users_avatar_fk' AND conrelid='users'::regclass) THEN
          ALTER TABLE users ADD CONSTRAINT users_avatar_fk FOREIGN KEY ("avatarMediaId") REFERENCES media(id);
        END IF;
      END $$;`);
      await db.prepare('INSERT INTO database_meta VALUES(5) ON CONFLICT DO NOTHING').run();
    });
    return db;
  } catch (error) {
    await pool.end();
    throw error;
  }
}
export function transaction<T>(db: DB, action: () => Promise<T> | T): Promise<T> {
  return db.transaction(action);
}
