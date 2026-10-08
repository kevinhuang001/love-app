// Shared schema; driver supplies PostgreSQL identity and timestamp definitions.
export const schema = `
  
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
    
CREATE TABLE IF NOT EXISTS todos(
    id TEXT PRIMARY KEY, coupleId TEXT NOT NULL REFERENCES couples(id), title TEXT NOT NULL,
    date TEXT NOT NULL, calendar TEXT NOT NULL DEFAULT 'solar', leapMonth INTEGER NOT NULL DEFAULT 0,
    repeat TEXT NOT NULL DEFAULT 'none', completed INTEGER NOT NULL DEFAULT 0, completedDate TEXT);
    CREATE INDEX IF NOT EXISTS todos_couple ON todos(coupleId);
CREATE TABLE IF NOT EXISTS couple_ai_settings(coupleId TEXT PRIMARY KEY REFERENCES couples(id), baseUrl TEXT NOT NULL, model TEXT NOT NULL, secret TEXT NOT NULL, enabled INTEGER NOT NULL, name TEXT NOT NULL DEFAULT '小爱', avatarMediaId TEXT REFERENCES media(id));
    CREATE TABLE IF NOT EXISTS ai_jobs(messageId INTEGER PRIMARY KEY REFERENCES messages(id), userId TEXT REFERENCES users(id), status TEXT NOT NULL DEFAULT 'pending', error TEXT, transcript TEXT);
    CREATE TABLE IF NOT EXISTS ai_actions(messageId INTEGER, callId TEXT, result TEXT NOT NULL, PRIMARY KEY(messageId,callId));
    
CREATE TABLE IF NOT EXISTS registration_invites(id TEXT PRIMARY KEY,hash TEXT UNIQUE NOT NULL,label TEXT NOT NULL,uses INTEGER NOT NULL DEFAULT 0,maxUses INTEGER NOT NULL,expires INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0,createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS server_config(key TEXT PRIMARY KEY,value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS administrators(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,createdAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS admin_sessions(hash TEXT PRIMARY KEY,adminId TEXT NOT NULL REFERENCES administrators(id),expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS captchas(id TEXT PRIMARY KEY,hash TEXT NOT NULL,purpose TEXT NOT NULL,ipHash TEXT NOT NULL,expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS email_codes(id TEXT PRIMARY KEY,email TEXT NOT NULL,purpose TEXT NOT NULL,hash TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,expires INTEGER NOT NULL,sentAt INTEGER NOT NULL,status TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS email_codes_email ON email_codes(email,purpose,sentAt);
  CREATE TABLE IF NOT EXISTS email_allowlist(email TEXT PRIMARY KEY,note TEXT NOT NULL,createdAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS media_sizes(mediaId TEXT PRIMARY KEY REFERENCES media(id),originalBytes INTEGER NOT NULL,previewBytes INTEGER NOT NULL,thumbnailBytes INTEGER NOT NULL,totalBytes INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS couple_limits(coupleId TEXT PRIMARY KEY REFERENCES couples(id),quotaMiB INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS access_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,requestId TEXT NOT NULL,createdAt TEXT NOT NULL,method TEXT NOT NULL,path TEXT NOT NULL,status INTEGER NOT NULL,durationMs REAL NOT NULL,ip TEXT NOT NULL,actorId TEXT,userAgent TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS access_logs_created ON access_logs(createdAt,id);
  CREATE TABLE IF NOT EXISTS server_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,createdAt TEXT NOT NULL,level TEXT NOT NULL,event TEXT NOT NULL,details TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,createdAt TEXT NOT NULL,adminId TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,details TEXT NOT NULL);`;
