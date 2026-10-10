import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { setTimeout as delay } from 'node:timers/promises';
import { PostgresConnection, postgresSettings } from '../../apps/server/src/postgres.js';

// Run against CI's real PostgreSQL service, not a driver mock. Interrupt a query
// on the server and verify that the application reconnects and receives one result.
test(
  'real PostgreSQL interrupted reads reconnect on a fresh backend',
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    const settings = { ...postgresSettings({}), retryDelay: 0 };
    const pool = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: settings.connectionTimeoutMillis,
      statement_timeout: settings.statement_timeout,
      query_timeout: settings.query_timeout,
    });
    pool.on('error', () => {});
    const supervisor = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    await supervisor.connect();
    t.after(async () => {
      await pool.end();
      await supervisor.end();
    });
    const first = await pool.connect();
    const pid = (await first.query('SELECT pg_backend_pid() pid')).rows[0].pid;
    first.release();
    const sql = 'SELECT pg_sleep(0.75), pg_backend_pid() pid, 42 answer';
    const connection = new PostgresConnection(pool, settings);
    const reading = connection.query(sql, [], true);
    // Attach immediately so a regression cannot leave an unhandled rejection during polling.
    void reading.catch(() => {});
    let active = false;
    for (let n = 0; n < 100; n++) {
      const state = await supervisor.query(
        'SELECT state,query FROM pg_stat_activity WHERE pid=$1',
        [pid],
      );
      if (state.rows[0]?.state === 'active' && state.rows[0].query === sql) {
        active = true;
        break;
      }
      await delay(10);
    }
    if (!active) {
      await reading;
      assert.fail('the test query never became active');
    }
    const killed = await supervisor.query('SELECT pg_terminate_backend($1) stopped', [pid]);
    assert.equal(killed.rows[0].stopped, true);
    const result = await reading;
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].answer, 42);
    assert.notEqual(result.rows[0].pid, pid);
    // The recovered connection remains usable and is returned to the pool safely.
    assert.equal((await connection.query('SELECT 7 answer', [], true)).rows[0].answer, 7);
  },
);
