import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from './support.js';
async function stream(s: Awaited<ReturnType<typeof setup>>, token: string, after?: number) {
  const abort = new AbortController();
  const response = await fetch(
    `${s.base}/api/notifications/stream${after === undefined ? '' : `?after=${after}`}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal },
  );
  assert.equal(response.status, 200);
  const reader = response.body!.getReader(),
    decoder = new TextDecoder();
  let buffer = '';
  async function next() {
    const deadline = AbortSignal.timeout(3000);
    while (true) {
      const end = buffer.indexOf('\n\n');
      if (end >= 0) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const event = frame.match(/^event: (.+)$/m)?.[1],
          raw = frame.match(/^data: (.+)$/m)?.[1];
        if (event && raw) return { event, data: JSON.parse(raw), raw: frame };
        continue;
      }
      const value = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) =>
          deadline.addEventListener('abort', () => reject(new Error('stream timeout')), {
            once: true,
          }),
        ),
      ]);
      if (value.done) return null;
      buffer += decoder.decode(value.value, { stream: true });
    }
  }
  return { next, close: () => abort.abort() };
}
test('private local stream replays missed unread IDs, suppresses read/own messages and closes on logout', async (t) => {
  const s = await setup(t),
    a = await s.register('stream_a'),
    b = await s.register('stream_b'),
    other = await s.register('stream_other');
  await s.api(other.token).get('/api/notifications/stream').expect(409);
  await s.pair(a.token, b.token);
  const connection = await stream(s, b.token);
  t.after(connection.close);
  const ready = await connection.next();
  assert.equal(ready!.event, 'ready');
  const message = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: 'private chat body' })
    .expect(201);
  const event = await connection.next();
  assert.equal(event!.event, 'message');
  assert.equal(event!.data.messageId, message.body.id);
  assert.ok(!event!.raw.includes('private chat body'));
  await connection.close();
  const skipped = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: 'read' })
    .expect(201);
  await s.api(b.token).post('/api/messages/read', { throughId: skipped.body.id }).expect(204);
  const missed = await s
    .api(a.token)
    .post('/api/messages', { clientId: randomUUID(), content: 'missed' })
    .expect(201);
  const replay = await stream(s, b.token, message.body.id);
  t.after(replay.close);
  assert.equal((await replay.next())!.event, 'ready');
  assert.equal((await replay.next())!.event, 'cursor');
  assert.deepEqual((await replay.next())!.data, { messageId: missed.body.id });
  await s.api(b.token).post('/api/auth/logout', {}).expect(204);
  assert.equal(await replay.next(), null);
  await s.api(b.token).get('/api/notifications/stream').expect(401);
});
test('unpair and administrator disabling immediately end notification connections', async (t) => {
  const s = await setup(t),
    a = await s.register('close_a'),
    b = await s.register('close_b');
  await s.pair(a.token, b.token);
  const c = await stream(s, b.token);
  t.after(c.close);
  await c.next();
  assert.equal(
    (await s.api(s.adminToken).get('/api/admin/overview')).body.notificationConnections,
    1,
  );
  await s.api(a.token).delete('/api/pairing').expect(204);
  assert.equal(await c.next(), null);
  await s.pair(a.token, b.token);
  const d = await stream(s, b.token);
  t.after(d.close);
  await d.next();
  await s.api(s.adminToken).patch(`/api/admin/users/${b.user.id}`, { disabled: true }).expect(204);
  assert.equal(await d.next(), null);
});
