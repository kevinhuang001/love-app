import type { Server } from 'socket.io';
import type { DB } from './db.js';
export function presence(io: Server, db: DB) {
  return async (coupleId: string | null) => {
    if (!coupleId) return;
    const members = await db
      .prepare('SELECT id,disabled FROM users WHERE coupleId=?')
      .all(coupleId);
    if (members.length !== 2) return;
    const users = members.map((member) => {
      const id = String(member.id);
      const connections = io.sockets.adapter.rooms.get(`user:${id}`) || new Set<string>();
      const online =
        !member.disabled &&
        [...connections].some((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          return (
            socket?.connected &&
            socket.data.active === true &&
            socket.rooms.has(`couple:${coupleId}`)
          );
        });
      return { id, online };
    });
    io.to(`couple:${coupleId}`).emit('presence:changed', { coupleId, users });
  };
}
