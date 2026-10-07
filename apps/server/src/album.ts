import { z } from 'zod';
import { validSolarDate } from '@love/calendar';
import type { DB, User } from './db.js';
const dateFilter = z.string().refine(validSolarDate, '相册日期无效').optional();
const sortSchema = z.enum(['date_desc', 'date_asc', 'uploaded_desc']);
const querySchema = z
  .object({
    type: z.enum(['all', 'image', 'video']).default('all'),
    owner: z.enum(['all', 'mine', 'partner']).default('all'),
    search: z.string().trim().max(100).default(''),
    from: dateFilter,
    to: dateFilter,
    sort: sortSchema.default('date_desc'),
    limit: z.coerce.number().int().min(1).max(100).default(60),
    cursor: z
      .string()
      .max(500)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, { message: '开始日期不能晚于结束日期' });
const cursorSchema = z.object({
  sort: sortSchema,
  value: z.string().max(30),
  id: z.string().uuid(),
});
function invalidCursor(message: string): never {
  throw new z.ZodError([{ code: 'custom', path: ['cursor'], message }]);
}
export async function readAlbum(db: DB, user: User, input: unknown) {
  const q = querySchema.parse(input);
  const clauses = ['m.coupleId=?'];
  const values: (string | number)[] = [user.coupleId!];
  if (q.type !== 'all') {
    clauses.push('media.kind=?');
    values.push(q.type);
  }
  if (q.owner !== 'all') {
    clauses.push(`m.ownerId${q.owner === 'mine' ? '=' : '<>'}?`);
    values.push(user.id);
  }
  if (q.search) {
    clauses.push('instr(lower(m.title),lower(?))>0');
    values.push(q.search);
  }
  if (q.from) {
    clauses.push('m.date>=?');
    values.push(q.from);
  }
  if (q.to) {
    clauses.push('m.date<=?');
    values.push(q.to);
  }
  const base = 'FROM moments m JOIN media ON media.id=m.mediaId WHERE ' + clauses.join(' AND ');
  const total = Number((await db.prepare(`SELECT count(*) AS n ${base}`).get(...values))!.n);
  const column = q.sort === 'uploaded_desc' ? 'createdAt' : 'date';
  const direction = q.sort === 'date_asc' ? 'ASC' : 'DESC';
  let seek = '';
  if (q.cursor) {
    let json: unknown;
    try {
      json = JSON.parse(Buffer.from(q.cursor, 'base64url').toString());
    } catch {
      invalidCursor('相册分页游标无效');
    }
    const cursor = cursorSchema.parse(json);
    if (cursor.sort !== q.sort) invalidCursor('相册排序与分页游标不匹配');
    if (
      column === 'date'
        ? !validSolarDate(cursor.value)
        : !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cursor.value)
    )
      invalidCursor('相册分页日期无效');
    const op = direction === 'ASC' ? '>' : '<';
    seek = ` AND (m.${column}${op}? OR (m.${column}=? AND m.id${op}?))`;
    values.push(cursor.value, cursor.value, cursor.id);
  }
  const rows = await db
    .prepare(
      `SELECT m.* ${base}${seek} ORDER BY m.${column} ${direction},m.id ${direction} LIMIT ?`,
    )
    .all(...values, q.limit + 1);
  const items = rows.slice(0, q.limit),
    last = items.at(-1);
  const nextCursor =
    rows.length > q.limit && last
      ? Buffer.from(JSON.stringify({ sort: q.sort, value: last[column], id: last.id })).toString(
          'base64url',
        )
      : null;
  return { items, total, nextCursor };
}
