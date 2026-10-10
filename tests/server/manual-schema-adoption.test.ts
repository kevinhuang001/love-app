import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { initialMigration } from '../../apps/server/src/migrations/001-initial.js';
import { migrationChecksum } from '../../apps/server/src/migrations.js';

test(
  'standalone PostgreSQL adoption SQL preserves data, is idempotent, and rolls back incompatible schemas',
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    await client.connect();
    const schema = 'adoption_' + randomUUID().replaceAll('-', '');
    const sql = (
      await readFile(
        new URL('../../tools/database/postgresql-legacy-v9-to-schema1.sql', import.meta.url),
        'utf8',
      )
    ).replace('SET LOCAL search_path TO public;', `SET LOCAL search_path TO "${schema}";`);
    try {
      await client.query(`CREATE SCHEMA "${schema}"; SET search_path TO "${schema}";`);
      await client.query(initialMigration.postgres);
      await client.query(
        "CREATE TABLE database_meta(version BIGINT PRIMARY KEY); INSERT INTO database_meta VALUES(9); INSERT INTO couples(id) VALUES('retained');",
      );
      await client.query(sql);
      assert.equal(
        (await client.query('SELECT checksum FROM schema_migrations')).rows[0].checksum,
        migrationChecksum(initialMigration),
      );
      assert.equal((await client.query('SELECT id FROM couples')).rows[0].id, 'retained');
      await client.query(sql);
      await client.query(
        'DROP TABLE schema_migrations; CREATE TABLE database_meta(version BIGINT PRIMARY KEY); INSERT INTO database_meta VALUES(8)',
      );
      await assert.rejects(client.query(sql), /只适用于旧版本标记 9/);
      await client.query('ROLLBACK');
      assert.equal(
        Number((await client.query('SELECT version FROM database_meta')).rows[0].version),
        8,
      );
      await client.query(
        'UPDATE database_meta SET version=9; ALTER TABLE couples DROP COLUMN "startTime"',
      );
      await assert.rejects(client.query(sql), /字段数量不符/);
      await client.query('ROLLBACK');
      assert.equal(
        (await client.query("SELECT to_regclass('schema_migrations') AS name")).rows[0].name,
        null,
      );
      assert.equal((await client.query('SELECT id FROM couples')).rows[0].id, 'retained');
    } finally {
      await client.query('ROLLBACK');
      await client.query(`DROP SCHEMA "${schema}" CASCADE`);
      await client.end();
    }
  },
);
