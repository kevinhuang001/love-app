import { DatabaseSync, type SQLInputValue, type SQLOutputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';
import { PostgresConnection, postgresSettings } from './postgres.js';
import { migrateDatabase } from './migrations.js';
import { postgresSQL } from './sql.js';
export { postgresSQL } from './sql.js';
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
  transaction<T>(action: () => Promise<T> | T, options?: { snapshot?: boolean }): Promise<T>;
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
      sqlite.exec(
        'PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;',
      );
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
    try {
      await migrateDatabase(db);
      return db;
    } catch (error) {
      await db.close();
      throw error;
    }
  }
  if (options.schema && !/^[a-z][a-z0-9_]{0,62}$/.test(options.schema))
    throw new Error('无效的数据库 schema');
  const settings = postgresSettings();
  const pool = new pg.Pool({
    ...(url ? { connectionString: options.path } : {}),
    max: 10,
    connectionTimeoutMillis: settings.connectionTimeoutMillis,
    statement_timeout: settings.statement_timeout,
    query_timeout: settings.query_timeout,
    keepAlive: true,
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
  const connection = new PostgresConnection(pool, settings);
  const query = (sql: string, values: unknown[] = [], readOnly = false) =>
    connection.query(postgresSQL(sql), values, readOnly);
  const readOnly = (sql: string) =>
    /^\s*SELECT\b/i.test(sql) &&
    !/\bFOR\s+(UPDATE|SHARE|NO\s+KEY\s+UPDATE|KEY\s+SHARE)\b/i.test(sql);
  const db: DB = {
    provider,
    prepare: (sql) => ({
      get: async (...values) => (await query(sql, values, readOnly(sql))).rows[0],
      all: async (...values) => (await query(sql, values, readOnly(sql))).rows,
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
    transaction: (action, options) => connection.transaction(action, options),
    close: () => pool.end(),
  };
  try {
    if (options.schema) await query(`CREATE SCHEMA IF NOT EXISTS "${options.schema}"`);
    await migrateDatabase(db);
    return db;
  } catch (error) {
    await pool.end();
    throw error;
  }
}
export function transaction<T>(db: DB, action: () => Promise<T> | T): Promise<T> {
  return db.transaction(action);
}
