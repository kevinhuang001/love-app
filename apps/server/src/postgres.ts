import { AsyncLocalStorage } from 'node:async_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import type pg from 'pg';
import { HttpError } from './errors.js';

export class CommitUncertainError extends HttpError {
  constructor(public readonly original: unknown) {
    super(503, '数据库提交结果尚未确认，请稍后检查上传结果');
  }
}
export class PostgresUnavailableError extends HttpError {
  readonly code: string;
  constructor(public readonly original: unknown) {
    super(503, '数据库暂时不可用，请稍后重试 (' + code(original) + ')');
    this.code = code(original);
  }
}
export type PostgresSettings = {
  connectionTimeoutMillis: number;
  statement_timeout: number;
  query_timeout: number;
  attempts: number;
  retryDelay: number;
};
export function postgresSettings(env: NodeJS.ProcessEnv = process.env): PostgresSettings {
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const raw = env[key];
    const value = raw === undefined || raw === '' ? fallback : Number(raw);
    if (!Number.isInteger(value) || value < min || value > max)
      throw new Error(`${key} 必须为 ${min}–${max} 的整数`);
    return value;
  };
  const queryTimeout = integer('PG_QUERY_TIMEOUT_MS', 120000, 1000, 3600000);
  return {
    connectionTimeoutMillis: integer('PG_CONNECTION_TIMEOUT_MS', 60000, 1000, 3600000),
    statement_timeout: queryTimeout,
    // Allow the server to report cancellation before the driver's local timer fires.
    query_timeout: queryTimeout + 10000,
    attempts: integer('PG_RETRY_ATTEMPTS', 3, 1, 10),
    retryDelay: integer('PG_RETRY_DELAY_MS', 1000, 0, 60000),
  };
}
function code(error: unknown) {
  return String((error as { code?: string })?.code || '');
}
export function isTransientPostgresError(error: unknown): boolean {
  if (error instanceof PostgresUnavailableError) return isTransientPostgresError(error.original);
  return (
    /^(08\w{3}|40001|40P01|55P03|57P0[123]|53300|53400|57014|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ENETUNREACH|EHOSTUNREACH|EAI_AGAIN)$/.test(
      code(error),
    ) ||
    /connection.*(?:terminated|timeout|closed)|timeout exceeded when trying to connect|query read timeout/i.test(
      String((error as Error)?.message),
    )
  );
}
function definitelyAborted(error: unknown) {
  // PostgreSQL returned an error for this standalone statement, not an ambiguous network failure.
  return /^(40001|40P01|55P03|57P03)$/.test(code(error));
}
export class PostgresConnection {
  private context = new AsyncLocalStorage<pg.PoolClient>();
  constructor(
    private pool: Pick<pg.Pool, 'connect'>,
    private settings: PostgresSettings,
  ) {}
  private async pause(attempt: number) {
    await delay(Math.min(this.settings.retryDelay * 2 ** attempt, 60000));
  }
  private async connect() {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.pool.connect();
      } catch (error) {
        if (!isTransientPostgresError(error)) throw error;
        if (attempt + 1 >= this.settings.attempts) throw new PostgresUnavailableError(error);
        await this.pause(attempt);
      }
    }
  }
  async query(sql: string, values: unknown[] = [], readOnly = false): Promise<pg.QueryResult> {
    const current = this.context.getStore();
    if (current) return current.query(sql, values); // A failed transaction must roll back as a whole.
    for (let attempt = 0; ; attempt++) {
      const client = await this.connect();
      const onError = () => {};
      client.on('error', onError);
      let failed = false;
      try {
        return await client.query(sql, values);
      } catch (error) {
        failed = true;
        if (
          attempt + 1 >= this.settings.attempts ||
          !(readOnly ? isTransientPostgresError(error) : definitelyAborted(error))
        )
          throw isTransientPostgresError(error) ? new PostgresUnavailableError(error) : error;
      } finally {
        client.removeListener('error', onError);
        client.release(failed); // A timed-out query must never return its busy connection to the pool.
      }
      await this.pause(attempt);
    }
  }
  async transaction<T>(action: () => Promise<T> | T, options?: { snapshot?: boolean }): Promise<T> {
    if (this.context.getStore()) return action();
    // Retry BEGIN/lock acquisition only; callbacks may have external or filesystem side effects.
    for (let attempt = 0; ; attempt++) {
      const client = await this.connect();
      const onError = () => {};
      client.on('error', onError);
      let started = false,
        failed = false;
      try {
        await client.query(
          options?.snapshot ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN',
        );
        if (!options?.snapshot) await client.query('SELECT pg_advisory_xact_lock(1279874629)');
        started = true;
        return await this.context.run(client, async () => {
          const value = await action();
          try {
            await client.query('COMMIT');
          } catch (error) {
            // A SQLSTATE response confirms failure. Lost responses cannot prove whether COMMIT ran.
            if (!/^[0-9]{2}[0-9A-Z]{3}$/.test(code(error)) || /^08/.test(code(error)))
              throw new CommitUncertainError(error);
            throw error;
          }
          return value;
        });
      } catch (error) {
        failed = true;
        // No further commands on a connection whose COMMIT outcome is unknown.
        if (!(error instanceof CommitUncertainError))
          await client.query('ROLLBACK').catch(() => {});
        if (started || !isTransientPostgresError(error) || attempt + 1 >= this.settings.attempts)
          throw error instanceof CommitUncertainError || !isTransientPostgresError(error)
            ? error
            : new PostgresUnavailableError(error);
      } finally {
        client.removeListener('error', onError);
        client.release(failed);
      }
      await this.pause(attempt);
    }
  }
}
