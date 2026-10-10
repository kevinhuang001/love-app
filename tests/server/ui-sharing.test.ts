import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from './support.js';
import { visibleAIContent } from '../../apps/server/src/ai-content.js';
import { verifyPassword } from '../../apps/server/src/security.js';

test('password changes require current password, work before pairing and preserve only the current session', async (t) => {
  const s = await setup(t),
    a = await s.register('passworduser'),
    b = await s.register('passwordpartner');
  const user = (await s.db.prepare('SELECT * FROM users WHERE username=?').get('passworduser'))!;
  await s.db
    .prepare('INSERT INTO sessions VALUES(?,?,?)')
    .run('other-session', user.id, Date.now() + 3600000);
  await s
    .api(a.token)
    .post('/api/me/password', { currentPassword: 'wrong', password: 'new-password-123' })
    .expect(400);
  await s
    .api(a.token)
    .post('/api/me/password', { currentPassword: 'password123', password: 'short' })
    .expect(400);
  await s
    .api(a.token)
    .post('/api/me/password', { currentPassword: 'password123', password: 'new-password-123' })
    .expect(204);
  assert.ok(
    await verifyPassword(
      'new-password-123',
      String((await s.db.prepare('SELECT password FROM users WHERE id=?').get(user.id))!.password),
    ),
  );
  assert.equal(
    (await s.db.prepare('SELECT * FROM sessions WHERE userId=?').all(user.id)).length,
    1,
  );
  await s.api(a.token).get('/api/me').expect(200);
  await s.api(b.token).get('/api/me').expect(200);
});

test('both partners can change messages; other pairs cannot; stored thinking remains hidden', async (t) => {
  const s = await setup(t),
    a = await s.register('sharealice'),
    b = await s.register('sharebob'),
    c = await s.register('sharecharlie'),
    d = await s.register('sharedana');
  await s.pair(a.token, b.token);
  await s.pair(c.token, d.token);
  const m = (
    await s
      .api(a.token)
      .post('/api/messages', { clientId: randomUUID(), content: 'original' })
      .expect(201)
  ).body;
  await s.api(b.token).patch(`/api/messages/${m.id}`, { content: 'shared edit' }).expect(204);
  assert.equal((await s.api(a.token).get('/api/messages')).body.items[0].content, 'shared edit');
  await s.api(c.token).patch(`/api/messages/${m.id}`, { content: 'intruder' }).expect(404);
  await s.api(c.token).delete(`/api/messages/${m.id}`).expect(404);
  await s.db
    .prepare("UPDATE messages SET role='assistant',content=? WHERE id=?")
    .run('<think>secret reasoning</think>answer', m.id);
  assert.equal((await s.api(b.token).get('/api/messages')).body.items[0].content, 'answer');
  await s.api(b.token).delete(`/api/messages/${m.id}`).expect(204);
  assert.equal((await s.api(a.token).get('/api/messages')).body.items.length, 0);
});

test('thinking blocks, nested tags and unfinished thought text are removed while ordinary replies remain', () => {
  assert.equal(visibleAIContent('<think>private</think>reply'), 'reply');
  assert.equal(visibleAIContent('reply<think>unfinished'), 'reply');
  assert.equal(
    visibleAIContent('<analysis>outer<think>inner</think>outer</analysis>reply'),
    'reply',
  );
  assert.equal(visibleAIContent('<reasoning>private</reasoning>\n中文答复'), '中文答复');
  assert.equal(visibleAIContent('normal <code>text</code>'), 'normal <code>text</code>');
});
