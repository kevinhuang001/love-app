import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { DB } from './db.js';
export type PushSender = (tokens: string[], messageId: number) => Promise<string[]>;
export function firebaseSender(): PushSender | undefined {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS)
    return undefined;
  if (!getApps().length)
    initializeApp({
      credential: process.env.FIREBASE_SERVICE_ACCOUNT
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        : applicationDefault(),
    });
  return async (tokens, messageId) => {
    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: 'Love · 新消息', body: '你的人给你发来了一条消息' },
      data: { messageId: String(messageId), screen: 'chat' },
      android: {
        priority: 'high',
        ttl: 86400_000,
        notification: { channelId: 'messages', tag: `message-${messageId}`, icon: 'ic_stat_heart' },
      },
    });
    const invalid: string[] = [];
    let retry = false;
    result.responses.forEach((response, index) => {
      if (response.success) return;
      if (
        [
          'messaging/registration-token-not-registered',
          'messaging/invalid-registration-token',
        ].includes(response.error?.code || '')
      )
        invalid.push(tokens[index]);
      else retry = true;
    });
    invalid.forEach((token) => {
      tokens.splice(tokens.indexOf(token), 1);
    });
    if (retry) throw new Error('部分推送未送达，将重试');
    return invalid;
  };
}
export function pushWorker(db: DB, sender?: PushSender) {
  let busy = false;
  return async () => {
    if (busy || !sender) return;
    busy = true;
    try {
      const jobs = db
        .prepare('SELECT * FROM push_jobs WHERE nextAt<=? AND attempts<5 ORDER BY id LIMIT 20')
        .all(Date.now()) as {
        id: number;
        messageId: number;
        recipientId: string;
        attempts: number;
      }[];
      for (const job of jobs) {
        const message = db
          .prepare(
            'SELECT m.id FROM messages m JOIN users u ON u.id=? AND u.coupleId=m.coupleId WHERE m.id=? AND m.readAt IS NULL',
          )
          .get(job.recipientId, job.messageId);
        if (!message) {
          db.prepare('DELETE FROM push_jobs WHERE id=?').run(job.id);
          continue;
        }
        const tokens = (
          db.prepare('SELECT token FROM devices WHERE userId=?').all(job.recipientId) as {
            token: string;
          }[]
        ).map((row) => row.token);
        try {
          for (let i = 0; i < tokens.length; i += 500) {
            const invalid = await sender(tokens.slice(i, i + 500), job.messageId);
            invalid.forEach((token) => db.prepare('DELETE FROM devices WHERE token=?').run(token));
          }
          db.prepare('DELETE FROM push_jobs WHERE id=?').run(job.id);
        } catch {
          db.prepare('UPDATE push_jobs SET attempts=attempts+1,nextAt=? WHERE id=?').run(
            Date.now() + 30_000 * 2 ** job.attempts,
            job.id,
          );
        }
      }
    } finally {
      busy = false;
    }
  };
}
