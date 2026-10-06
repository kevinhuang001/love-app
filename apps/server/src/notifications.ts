import type { Request, Response } from 'express';
import { z } from 'zod';
import type { DB, User } from './db.js';

type Session = { user: User; hash: string; expires: number };
export function notificationStreams(db: DB, lookup: (token: string) => Session | null) {
  const clients = new Set<{ userId: string; hash: string; check: () => void; end: () => void }>();
  function open(req: Request, res: Response) {
    const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
    const auth = lookup(token)!;
    const coupleId = auth.user.coupleId!;
    let cursor =
      req.query.after === undefined
        ? Number(
            db.prepare('SELECT COALESCE(MAX(id),0) n FROM messages WHERE coupleId=?').get(coupleId)!
              .n,
          )
        : z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).parse(req.query.after);
    if ([...clients].filter((c) => c.userId === auth.user.id).length >= 5) {
      res.status(429).json({ error: '后台连接过多，请关闭其他设备的通知' });
      return;
    }
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    const send = (event: string, data: unknown, id?: number) => {
      if (res.writableLength > 65536) {
        end();
        return;
      }
      res.write(
        `${id === undefined ? '' : `id: ${id}\n`}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      );
    };
    const end = () => {
      clearInterval(timer);
      clients.delete(client);
      res.end();
    };
    const check = () => {
      const current = lookup(token);
      if (
        !current ||
        current.user.coupleId !== coupleId ||
        Number(db.prepare('SELECT COUNT(*) n FROM users WHERE coupleId=?').get(coupleId)!.n) !== 2
      ) {
        send('stop', {});
        end();
        return;
      }
      const rows = db
        .prepare(
          'SELECT id,senderId,role,readAt FROM messages WHERE coupleId=? AND id>? ORDER BY id LIMIT 100',
        )
        .all(coupleId, cursor);
      for (const row of rows) {
        cursor = Number(row.id);
        send(
          row.readAt === null && (row.senderId !== auth.user.id || row.role === 'assistant')
            ? 'message'
            : 'cursor',
          { messageId: cursor },
          cursor,
        );
      }
      res.write(': heartbeat\n\n');
    };
    const client = { userId: auth.user.id, hash: auth.hash, check, end };
    const timer = setInterval(check, 15000);
    timer.unref();
    clients.add(client);
    req.on('close', () => {
      clearInterval(timer);
      clients.delete(client);
    });
    send('ready', { cursor, coupleId }, cursor);
    check();
  }
  return {
    open,
    flush: () => {
      for (const client of clients) client.check();
    },
    closeUser: (id: string) => {
      for (const client of clients) if (client.userId === id) client.end();
    },
    closeSession: (hash: string) => {
      for (const client of clients) if (client.hash === hash) client.end();
    },
    close: () => {
      for (const client of clients) client.end();
    },
    count: () => clients.size,
  };
}
