import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type pg from 'pg';
import { PostgresConnection, postgresSettings, CommitUncertainError } from '../src/postgres.js';

const settings = { ...postgresSettings({}), retryDelay: 0 };
const error = (code: string) => Object.assign(new Error(code), { code });
function fixture(
  handle: (sql: string, attempt: number) => unknown,
  acquisition?: (n: number) => void,
) {
  let connects = 0;
  const queries: string[] = [],
    releases: boolean[] = [];
  const pool = {
    async connect() {
      acquisition?.(++connects);
      const client = new EventEmitter() as pg.PoolClient;
      client.query = (async (sql: string) => {
        queries.push(sql);
        const value = await handle(sql, queries.filter((q) => q === sql).length);
        return value || { rows: [{ n: 1 }], rowCount: 1 };
      }) as pg.PoolClient['query'];
      client.release = (destroy?: boolean | Error) => {
        releases.push(Boolean(destroy));
      };
      return client;
    },
  };
  return {
    connection: new PostgresConnection(pool as Pick<pg.Pool, 'connect'>, settings),
    queries,
    releases,
    connects: () => connects,
  };
}
test('PostgreSQL defaults increase timeouts, reject invalid settings and preserve configured values', () => {
  assert.deepEqual(postgresSettings({}), {
    connectionTimeoutMillis: 60000,
    statement_timeout: 120000,
    query_timeout: 130000,
    attempts: 3,
    retryDelay: 1000,
  });
  assert.equal(postgresSettings({ PG_QUERY_TIMEOUT_MS: '240000' }).statement_timeout, 240000);
  for (const config of [
    { PG_RETRY_ATTEMPTS: '0' },
    { PG_QUERY_TIMEOUT_MS: 'NaN' },
    { PG_CONNECTION_TIMEOUT_MS: '-1' },
    { PG_RETRY_DELAY_MS: '60001' },
  ])
    assert.throws(() => postgresSettings(config));
});
test('connections retry transient failures with a finite budget; authentication is never retried', async () => {
  const f = fixture(
    () => {},
    (n) => {
      if (n < 3) throw error('ECONNREFUSED');
    },
  );
  assert.equal((await f.connection.query('SELECT 1', [], true)).rows[0].n, 1);
  assert.equal(f.connects(), 3);
  const exhausted = fixture(
    () => {},
    () => {
      throw error('ECONNREFUSED');
    },
  );
  await assert.rejects(exhausted.connection.query('SELECT 1', [], true), /ECONNREFUSED/);
  assert.equal(exhausted.connects(), 3);
  const fatal = fixture(
    () => {},
    () => {
      throw error('28P01');
    },
  );
  await assert.rejects(fatal.connection.query('SELECT 1', [], true), /28P01/);
  assert.equal(fatal.connects(), 1);
});
test('reads discard broken clients and retry, while ambiguous writes are never replayed', async () => {
  const f = fixture((_sql, n) => {
    if (n < 3) throw error('ECONNRESET');
  });
  await f.connection.query('SELECT 1', [], true);
  assert.deepEqual(f.releases, [true, true, false]);
  const write = fixture(() => {
    throw error('ECONNRESET');
  });
  await assert.rejects(write.connection.query('INSERT INTO example VALUES(1)'), /ECONNRESET/);
  assert.equal(write.queries.length, 1);
  const aborted = fixture((_sql, n) => {
    if (n === 1) throw error('40P01');
  });
  await aborted.connection.query('INSERT INTO example VALUES(1)');
  assert.equal(aborted.queries.length, 2);
  const invalid = fixture(() => {
    throw error('23505');
  });
  await assert.rejects(invalid.connection.query('INSERT INTO example VALUES(1)'), /23505/);
  assert.equal(invalid.queries.length, 1);
});
test('transactions retry setup but invoke callbacks once and roll back failed mutations', async () => {
  let actions = 0;
  const f = fixture((sql, n) => {
    if (sql.startsWith('SELECT pg_advisory') && n === 1) throw error('ECONNRESET');
  });
  assert.equal(
    await f.connection.transaction(async () => {
      actions++;
      await f.connection.query('INSERT INTO example VALUES(1)');
      return 7;
    }),
    7,
  );
  assert.equal(actions, 1);
  assert.equal(f.queries.filter((s) => s === 'BEGIN').length, 2);
  const failed = fixture((sql) => {
    if (sql === 'SELECT 1') throw error('ECONNRESET');
  });
  await assert.rejects(
    failed.connection.transaction(async () => {
      actions++;
      await failed.connection.query('SELECT 1', [], true);
    }),
    /ECONNRESET/,
  );
  assert.equal(actions, 2);
  assert.equal(failed.queries.filter((s) => s === 'SELECT 1').length, 1);
  assert.equal(failed.queries.at(-1), 'ROLLBACK');
});
test('lost COMMIT responses are marked uncertain and never replayed or rolled back on that client', async () => {
  for (const code of ['ECONNRESET', 'EPIPE']) {
    let actions = 0;
    const f = fixture((sql) => {
      if (sql === 'COMMIT') throw error(code);
    });
    await assert.rejects(
      f.connection.transaction(async () => {
        actions++;
        return 4;
      }),
      CommitUncertainError,
    );
    assert.equal(actions, 1);
    assert.equal(f.queries.at(-1), 'COMMIT');
    assert.deepEqual(f.releases, [true]);
  }
});
