import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { DB } from './db.js';

export const pushProviders = ['fcm', 'jpush'] as const;
export type PushProvider = (typeof pushProviders)[number];
export type PushSender = (token: string, messageId: number) => Promise<'sent' | 'invalid'>;
export type PushSenders = Partial<Record<PushProvider, PushSender>>;
export const deviceKey = (provider: PushProvider, token: string) => `${provider}:${token}`;

export function firebaseSender(): PushSender | undefined {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS)
    return undefined;
  if (!getApps().length)
    initializeApp({
      credential: process.env.FIREBASE_SERVICE_ACCOUNT
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        : applicationDefault(),
    });
  return async (token, messageId) => {
    try {
      await getMessaging().send({
        token,
        notification: { title: 'Love · 新消息', body: '你的人给你发来了一条消息' },
        data: { messageId: String(messageId), screen: 'chat' },
        android: {
          priority: 'high',
          ttl: 86400_000,
          notification: {
            channelId: 'messages',
            tag: `message-${messageId}`,
            icon: 'ic_stat_heart',
          },
        },
      });
      return 'sent';
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      )
        return 'invalid';
      throw new Error('FCM 推送未送达');
    }
  };
}

export type JPushConfig = {
  appKey: string;
  masterSecret: string;
  thirdPartyChannel?: Record<string, unknown>;
};
// Fixed provider endpoint. Never allow a user-controlled URL to receive MasterSecret.
export function jpushSender(config: JPushConfig, send: typeof fetch = fetch): PushSender {
  return async (token, messageId) => {
    const response = await send('https://api.jpush.cn/v3/push', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.appKey}:${config.masterSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'android',
        audience: { registration_id: [token] },
        notification: {
          android: {
            alert: '你的人给你发来了一条消息',
            title: 'Love · 新消息',
            channel_id: 'messages',
            priority: 2,
            small_icon: 'ic_stat_heart',
            extras: { messageId: String(messageId), screen: 'chat' },
            // Every vendor click lands in one activity, including a cold process.
            intent: {
              url: 'intent:#Intent;action=com.kevinhuang.love.OPEN_CHAT;component=com.kevinhuang.love/.PushClickActivity;end',
            },
          },
        },
        options: {
          time_to_live: 86400,
          third_party_channel: Object.fromEntries(
            ['huawei', 'honor', 'xiaomi', 'oppo', 'vivo', 'meizu'].map((vendor) => [
              vendor,
              {
                distribution: 'first_ospush',
                ...((config.thirdPartyChannel?.[vendor] || {}) as object),
              },
            ]),
          ),
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = (await response.json().catch(() => ({}))) as {
      msg_id?: string | number;
      error?: { code?: number };
    };
    // 1011: the sole registration ID has expired/no target. 1003 is a general
    // parameter error and must not delete a valid device on a channel configuration error.
    if (response.status === 400 && result.error?.code === 1011) return 'invalid';
    if (!response.ok || !result.msg_id)
      throw new Error(
        `JPush 推送失败 (${response.status}/${result.error?.code || 'invalid-response'})`,
      );
    return 'sent';
  };
}
export function configuredPushSenders(): PushSenders {
  const senders: PushSenders = {};
  const firebase = firebaseSender();
  if (firebase) senders.fcm = firebase;
  const appKey = process.env.JPUSH_APP_KEY,
    masterSecret = process.env.JPUSH_MASTER_SECRET;
  if (Boolean(appKey) !== Boolean(masterSecret))
    throw new Error('JPUSH_APP_KEY 和 JPUSH_MASTER_SECRET 必须同时配置');
  if (appKey && masterSecret) {
    const channel = JSON.parse(process.env.JPUSH_THIRD_PARTY_CHANNEL || '{}');
    if (!channel || typeof channel !== 'object' || Array.isArray(channel))
      throw new Error('JPUSH_THIRD_PARTY_CHANNEL 必须是 JSON 对象');
    senders.jpush = jpushSender({ appKey, masterSecret, thirdPartyChannel: channel });
  }
  return senders;
}

export function pushWorker(
  db: DB,
  senders: PushSenders = {},
  report: (code: string) => void = () => {},
) {
  // Keep accepted deliveries across retries and process restarts. A provider
  // success means acceptance, not a guaranteed device delivery receipt.
  db.exec(`CREATE TABLE IF NOT EXISTS push_acceptances(
    jobId INTEGER NOT NULL REFERENCES push_jobs(id) ON DELETE CASCADE,
    deviceKey TEXT NOT NULL, PRIMARY KEY(jobId,deviceKey))`);
  let busy = false;
  return async () => {
    if (busy || !Object.keys(senders).length) return;
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
            `SELECT m.id FROM messages m JOIN users u ON u.id=? AND u.coupleId=m.coupleId
          WHERE m.id=? AND m.readAt IS NULL AND u.disabled=0`,
          )
          .get(job.recipientId, job.messageId);
        if (!message) {
          db.prepare('DELETE FROM push_jobs WHERE id=?').run(job.id);
          continue;
        }
        const devices = db
          .prepare('SELECT token FROM devices WHERE userId=?')
          .all(job.recipientId) as { token: string }[];
        let retry = false;
        for (const { token: key } of devices) {
          if (
            db
              .prepare('SELECT 1 FROM push_acceptances WHERE jobId=? AND deviceKey=?')
              .get(job.id, key)
          )
            continue;
          const separator = key.indexOf(':'),
            provider = key.slice(0, separator) as PushProvider,
            token = key.slice(separator + 1);
          // Only typed registrations belong to this API. Old installations must register again.
          if (!pushProviders.includes(provider)) {
            db.prepare('DELETE FROM devices WHERE token=?').run(key);
            continue;
          }
          const sender = senders[provider];
          if (!sender) {
            retry = true;
            report(`push.${provider}.unconfigured`);
            continue;
          }
          try {
            if ((await sender(token, job.messageId)) === 'invalid')
              db.prepare('DELETE FROM devices WHERE token=?').run(key);
            else db.prepare('INSERT OR IGNORE INTO push_acceptances VALUES(?,?)').run(job.id, key);
          } catch {
            retry = true;
            report(`push.${provider}.failed`);
          }
        }
        if (retry)
          db.prepare('UPDATE push_jobs SET attempts=attempts+1,nextAt=? WHERE id=?').run(
            Date.now() + 30_000 * 2 ** job.attempts,
            job.id,
          );
        else db.prepare('DELETE FROM push_jobs WHERE id=?').run(job.id);
      }
    } finally {
      busy = false;
    }
  };
}
