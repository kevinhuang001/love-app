import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
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
export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  const version = Number(db.prepare('PRAGMA user_version').get()!.user_version);
  if (version !== 0 && version !== 4) throw new Error('数据库结构版本不匹配，请使用新的数据目录');
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS couples(id TEXT PRIMARY KEY, startDate TEXT);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL, coupleId TEXT REFERENCES couples(id), avatarMediaId TEXT REFERENCES media(id), email TEXT UNIQUE NOT NULL, verifiedAt TEXT, disabled INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), lastLoginAt TEXT);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS invites(hash TEXT PRIMARY KEY, userId TEXT REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY, coupleId TEXT REFERENCES couples(id), ownerId TEXT REFERENCES users(id), kind TEXT NOT NULL, original TEXT NOT NULL, preview TEXT NOT NULL, thumbnail TEXT NOT NULL, width INTEGER, height INTEGER, duration REAL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, coupleId TEXT NOT NULL REFERENCES couples(id), senderId TEXT NOT NULL REFERENCES users(id), clientId TEXT NOT NULL, content TEXT NOT NULL, mediaId TEXT REFERENCES media(id), createdAt TEXT NOT NULL, readAt TEXT, role TEXT NOT NULL DEFAULT 'user', assistantName TEXT, assistantAvatarMediaId TEXT REFERENCES media(id), UNIQUE(senderId, clientId));
    CREATE INDEX IF NOT EXISTS messages_couple ON messages(coupleId,id);
    CREATE TABLE IF NOT EXISTS moments(id TEXT PRIMARY KEY, coupleId TEXT NOT NULL REFERENCES couples(id), ownerId TEXT REFERENCES users(id), title TEXT NOT NULL, mediaId TEXT NOT NULL REFERENCES media(id), date TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
    CREATE INDEX IF NOT EXISTS moments_couple_date ON moments(coupleId,date,id);
    CREATE INDEX IF NOT EXISTS moments_couple_uploaded ON moments(coupleId,createdAt,id);
    CREATE TABLE IF NOT EXISTS anniversaries(id TEXT PRIMARY KEY, coupleId TEXT NOT NULL REFERENCES couples(id), title TEXT NOT NULL, date TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS devices(token TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), updatedAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS push_jobs(id INTEGER PRIMARY KEY, messageId INTEGER UNIQUE REFERENCES messages(id), recipientId TEXT REFERENCES users(id), attempts INTEGER NOT NULL DEFAULT 0, nextAt INTEGER NOT NULL);
    `);
  db.exec(`CREATE TABLE IF NOT EXISTS todos(
    id TEXT PRIMARY KEY, coupleId TEXT NOT NULL REFERENCES couples(id), title TEXT NOT NULL,
    date TEXT NOT NULL, calendar TEXT NOT NULL DEFAULT 'solar', leapMonth INTEGER NOT NULL DEFAULT 0,
    repeat TEXT NOT NULL DEFAULT 'none', completed INTEGER NOT NULL DEFAULT 0, completedDate TEXT);
    CREATE INDEX IF NOT EXISTS todos_couple ON todos(coupleId);`);
  db.exec(`CREATE TABLE IF NOT EXISTS ai_settings(userId TEXT PRIMARY KEY REFERENCES users(id), baseUrl TEXT NOT NULL, model TEXT NOT NULL, secret TEXT NOT NULL, enabled INTEGER NOT NULL, name TEXT NOT NULL DEFAULT '小爱', avatarMediaId TEXT REFERENCES media(id));
    CREATE TABLE IF NOT EXISTS ai_jobs(messageId INTEGER PRIMARY KEY REFERENCES messages(id), userId TEXT REFERENCES users(id), status TEXT NOT NULL DEFAULT 'pending', error TEXT, transcript TEXT);
    CREATE TABLE IF NOT EXISTS ai_actions(messageId INTEGER, callId TEXT, result TEXT NOT NULL, PRIMARY KEY(messageId,callId));
    PRAGMA user_version=4;`);
  return db;
}
export type DB = ReturnType<typeof openDatabase>;
export function transaction<T>(db: DB, action: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = action();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
