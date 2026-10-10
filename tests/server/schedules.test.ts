import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './support.js';
import { executeTool } from '../../apps/server/src/ai.js';

test('schedule APIs and assistant tools persist seconds, validate instants, and preserve recurrence time', async (t) => {
  const s = await setup(t),
    a = await s.register('alice'),
    b = await s.register('bob');
  await s.pair(a.token, b.token);
  const anniversary = await s
    .api(a.token)
    .post('/api/anniversaries', { title: '出发', date: '2025-05-06', time: '07:08:09' })
    .expect(201);
  assert.equal((await s.api(b.token).get('/api/anniversaries')).body[0].time, '07:08:09');
  await s
    .api(b.token)
    .patch('/api/anniversaries/' + anniversary.body.id, {
      title: '返程',
      date: '2025-05-07',
      time: '11:22:33',
    })
    .expect(204);
  assert.equal((await s.api(a.token).get('/api/anniversaries')).body[0].time, '11:22:33');
  await s
    .api(a.token)
    .post('/api/anniversaries', { title: '无效', date: '2025-02-31', time: '07:08:09' })
    .expect(400);
  await s
    .api(a.token)
    .post('/api/anniversaries', { title: '无效', date: '2025-02-28', time: '25:08:09' })
    .expect(400);
  await s
    .api(a.token)
    .post('/api/anniversaries', { title: '未来', date: '2100-01-01', time: '00:00:00' })
    .expect(400);
  await s
    .api(a.token)
    .patch('/api/couple', { startDate: '2025-01-02', startTime: '03:04:05' })
    .expect(200);
  assert.equal((await s.api(b.token).get('/api/me')).body.couple.startTime, '03:04:05');
  const result = await executeTool(s.db, a.user.id, 'create_todo', {
    title: '七夕',
    date: '2026-07-07',
    time: '20:21:22',
    calendar: 'lunar',
    repeat: 'yearly',
    leapMonth: false,
  });
  await s
    .api(b.token)
    .post(`/api/todos/${(result as { id: string }).id}/completion`, { completed: true })
    .expect(204);
  const row = (await s.api(a.token).get('/api/todos')).body[0];
  assert.equal(row.time, '20:21:22');
  assert.ok(row.completedDate);
  await s
    .api(a.token)
    .post('/api/todos', { title: '无效', date: '2026-10-09', time: '01:02:60' })
    .expect(400);
});
