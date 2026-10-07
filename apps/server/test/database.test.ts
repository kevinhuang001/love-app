import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setup } from './support.js';
test('transaction rollback and single-use authentication remain atomic under concurrent requests', async (t) => {
  const s = await setup(t);
  await assert.rejects(
    s.db.transaction(async () => {
      await s.db.prepare('INSERT INTO server_config VALUES(?,?)').run('rollback-proof', 'private');
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw new Error('rollback');
    }),
    /rollback/,
  );
  assert.equal(
    await s.db.prepare('SELECT value FROM server_config WHERE key=?').get('rollback-proof'),
    undefined,
  );
  const proof = await s.captcha('admin');
  const responses = await Promise.all(
    [0, 1].map(() =>
      request(s.app)
        .post('/api/admin/login')
        .send({ username: 'admin_master', password: 'admin-test-password-123', ...proof }),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
  const email = 'atomic@example.test',
    code = await s.emailCode(email);
  const attempts = await Promise.all(
    ['atomic_one', 'atomic_two'].map((username) =>
      request(s.app)
        .post('/api/auth/register')
        .send({ username, password: 'password123', email, name: 'atomic', ...code }),
    ),
  );
  assert.deepEqual(attempts.map((r) => r.status).sort(), [201, 400]);
  assert.equal((await s.db.prepare('SELECT COUNT(*) n FROM users WHERE email=?').get(email))!.n, 1);
});
