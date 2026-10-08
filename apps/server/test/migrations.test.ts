import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { openDatabase } from '../src/db.js';

test('schema 4 upgrades AI to pair storage once, retaining the configured partner and removing the personal table', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-upgrade-'));
  const schema = process.env.TEST_DATABASE_URL
    ? 'test_' + randomUUID().replaceAll('-', '')
    : undefined;
  const options = { path: process.env.TEST_DATABASE_URL || join(dir, 'old.sqlite'), schema };
  t.after(async () => {
    if (schema) {
      const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
      await client.connect();
      try {
        await client.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        await client.end();
      }
    }
    await rm(dir, { recursive: true, force: true });
  });
  let db = await openDatabase(options);
  try {
    await db.prepare('INSERT INTO couples(id) VALUES(?)').run('our-pair');
    for (const id of ['a', 'b', 'unpaired']) {
      await db
        .prepare('INSERT INTO users(id,username,name,password,email,coupleId) VALUES(?,?,?,?,?,?)')
        .run(id, id, id, 'hash', id + '@example.test', id === 'unpaired' ? null : 'our-pair');
    }
    await db.exec(`ALTER TABLE couples DROP COLUMN startTime;
      ALTER TABLE anniversaries DROP COLUMN time;
      ALTER TABLE todos DROP COLUMN time;
      DROP TABLE couple_ai_settings;
      CREATE TABLE ai_settings(userId TEXT PRIMARY KEY REFERENCES users(id),baseUrl TEXT NOT NULL,model TEXT NOT NULL,secret TEXT NOT NULL,enabled INTEGER NOT NULL,name TEXT NOT NULL,avatarMediaId TEXT REFERENCES media(id));`);
    await db
      .prepare('INSERT INTO ai_settings VALUES(?,?,?,?,?,?,?)')
      .run('a', '', '', '', 0, '空白助手', null);
    await db
      .prepare('INSERT INTO ai_settings VALUES(?,?,?,?,?,?,?)')
      .run('b', 'https://api.example.com/v1', 'model', 'encrypted-key', 1, '松子', null);
    await db
      .prepare('INSERT INTO ai_settings VALUES(?,?,?,?,?,?,?)')
      .run('unpaired', 'https://other.example.com', 'other', 'other-key', 1, 'other', null);
    await db.exec(
      db.provider === 'sqlite' ? 'PRAGMA user_version=4' : 'UPDATE database_meta SET version=4',
    );
  } finally {
    await db.close();
  }
  db = await openDatabase(options);
  try {
    const rows = await db.prepare('SELECT * FROM couple_ai_settings').all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].coupleId, 'our-pair');
    assert.equal(rows[0].name, '松子');
    assert.equal(rows[0].secret, 'encrypted-key');
    const tables = await db
      .prepare(
        db.provider === 'sqlite'
          ? "SELECT name FROM sqlite_master WHERE type='table' AND name='ai_settings'"
          : "SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name='ai_settings'",
      )
      .all();
    assert.equal(tables.length, 0);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM users').get())!.n, 3);
  } finally {
    await db.close();
  }
  db = await openDatabase(options);
  try {
    assert.equal((await db.prepare('SELECT name FROM couple_ai_settings').get())!.name, '松子');
  } finally {
    await db.close();
  }
});

test('schema 5 adds second-precision fields without changing pair configuration or existing dates', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'love-time-upgrade-'));
  const schema = process.env.TEST_DATABASE_URL
    ? 'test_' + randomUUID().replaceAll('-', '')
    : undefined;
  const options = { path: process.env.TEST_DATABASE_URL || join(dir, 'old.sqlite'), schema };
  t.after(async () => {
    if (schema) {
      const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
      await client.connect();
      try {
        await client.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        await client.end();
      }
    }
    await rm(dir, { recursive: true, force: true });
  });
  let db = await openDatabase(options);
  try {
    await db.exec(`ALTER TABLE couples DROP COLUMN startTime;
      ALTER TABLE anniversaries DROP COLUMN time;
      ALTER TABLE todos DROP COLUMN time;`);
    await db.prepare('INSERT INTO couples(id,startDate) VALUES(?,?)').run('pair', '2025-01-02');
    await db
      .prepare('INSERT INTO anniversaries(id,coupleId,title,date) VALUES(?,?,?,?)')
      .run('anniversary', 'pair', '旅行', '2025-06-07');
    await db
      .prepare('INSERT INTO todos(id,coupleId,title,date) VALUES(?,?,?,?)')
      .run('todo', 'pair', '下次旅行', '2026-10-10');
    await db
      .prepare(
        'INSERT INTO couple_ai_settings(coupleId,baseUrl,model,secret,enabled) VALUES(?,?,?,?,?)',
      )
      .run('pair', 'https://api.example.com/v1', 'model', 'encrypted', 1);
    await db.exec(
      db.provider === 'sqlite' ? 'PRAGMA user_version=5' : 'UPDATE database_meta SET version=5',
    );
  } finally {
    await db.close();
  }
  db = await openDatabase(options);
  try {
    assert.equal((await db.prepare('SELECT * FROM couples').get())!.startTime, '00:00:00');
    assert.equal((await db.prepare('SELECT * FROM anniversaries').get())!.time, '00:00:00');
    assert.equal((await db.prepare('SELECT * FROM todos').get())!.time, '00:00:00');
    assert.equal((await db.prepare('SELECT * FROM couple_ai_settings').get())!.secret, 'encrypted');
    await db.prepare('UPDATE todos SET time=?').run('12:34:56');
  } finally {
    await db.close();
  }
  db = await openDatabase(options);
  try {
    assert.equal((await db.prepare('SELECT * FROM todos').get())!.time, '12:34:56');
  } finally {
    await db.close();
  }
});
