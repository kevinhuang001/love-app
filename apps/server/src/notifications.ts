import type { Request, Response } from 'express';
import { z } from 'zod';
import type { DB, User } from './db.js';
import { fail } from './errors.js';
type Session = { user: User; hash: string; expires: number };
export function notificationStreams(db: DB, lookup: (token: string) => Promise<Session | null>) {
  const clients = new Set<{
    userId: string;
    hash: string;
    check: () => Promise<void>;
    end: () => void;
  }>();
  async function open(req: Request, res: Response) {
    const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
    const auth = await lookup(token);
    if (!auth) fail(401, '登录已过期');
    const coupleId = auth!.user.coupleId;
    if (!coupleId) fail(409, '请先与另一半配对');
    let cursor =
      req.query.after === undefined
        ? Number(
            (await db
              .prepare('SELECT COALESCE(MAX(id),0) n FROM messages WHERE coupleId=?')
              .get(coupleId))!.n,
          )
        : z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).parse(req.query.after);
    if ([...clients].filter((c) => c.userId === auth!.user.id).length >= 5) {
      res.status(429).json({ error: '后台连接过多，请关闭其他设备的通知' });
      return;
    }
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    let ended = false,
      checking: Promise<void> | undefined,
      requested = false;
    const end = () => {
      if (ended) return;
      ended = true;
      clearInterval(timer);
      clients.delete(client);
      res.end();
    };
    const send = (event: string, data: unknown, id?: number) => {
      if (ended) return;
      if (res.writableLength > 65536) {
        end();
        return;
      }
      res.write(
        `${id === undefined ? '' : `id: ${id}\n`}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      );
    };
    const drain = async () => {
      const current = await lookup(token);
      if (ended) return;
      if (
        !current ||
        current.user.coupleId !== coupleId ||
        Number(
          (await db.prepare('SELECT COUNT(*) n FROM users WHERE coupleId=?').get(coupleId))!.n,
        ) !== 2
      ) {
        send('stop', {});
        end();
        return;
      }
      const rows = await db
        .prepare(
          'SELECT id,senderId,role,readAt FROM messages WHERE coupleId=? AND id>? ORDER BY id LIMIT 100',
        )
        .all(coupleId, cursor);
      if (ended) return;
      for (const row of rows) {
        cursor = Number(row.id);
        send(
          row.readAt === null && (row.senderId !== auth!.user.id || row.role === 'assistant')
            ? 'message'
            : 'cursor',
          { messageId: cursor },
          cursor,
        );
      }
      if (!ended) res.write(': heartbeat\n\n');
    };
    const check = () => {
      requested = true;
      if (!checking)
        checking = (async () => {
          try {
            while (requested && !ended) {
              requested = false;
              await drain();
            }
          } catch {
            end();
          } finally {
            checking = undefined;
          }
        })();
      return checking;
    };
    const client = { userId: auth!.user.id, hash: auth!.hash, check, end };
    const timer = setInterval(() => {
      void check();
    }, 15000);
    timer.unref();
    clients.add(client);
    req.on('close', end);
    send('ready', { cursor, coupleId }, cursor);
    await check();
  }
  return {
    open,
    flush: () => Promise.all([...clients].map((client) => client.check())).then(() => {}),
    closeUser: (id: string) => {
      for (const c of clients) if (c.userId === id) c.end();
    },
    closeSession: (hash: string) => {
      for (const c of clients) if (c.hash === hash) c.end();
    },
    close: () => {
      for (const c of clients) c.end();
    },
    count: () => clients.size,
  };
}
