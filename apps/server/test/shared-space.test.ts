import { test } from 'node:test';
import assert from 'node:assert/strict';
import { io, type Socket } from 'socket.io-client';
import { setup } from './support.js';
import { decryptKey } from '../src/ai.js';

function event(socket: Socket, name: string, predicate: (value: any) => boolean = () => true) {
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(name, receive);
      reject(new Error(`Timed out waiting for ${name}`));
    }, 5000);
    function receive(value: any) {
      if (!predicate(value)) return;
      clearTimeout(timer);
      socket.off(name, receive);
      resolve(value);
    }
    socket.on(name, receive);
  });
}

test('both partners share AI settings and identity; keys stay encrypted and relationships stay isolated', async (t) => {
  const s = await setup(t);
  const a = await s.register('alice'),
    b = await s.register('bob');
  const c = await s.register('charlie'),
    d = await s.register('dana');
  await s.pair(a.token, b.token);
  await s.pair(c.token, d.token);
  const socket = io(s.base, {
    auth: { token: b.token },
    transports: ['websocket'],
    autoConnect: false,
  });
  t.after(() => socket.disconnect());
  const connected = event(socket, 'connect');
  socket.connect();
  await connected;
  const changed = event(socket, 'profile:changed');
  await s
    .api(a.token)
    .post('/api/ai/settings', {
      baseUrl: 'https://api.example.com/v1',
      model: 'shared-model',
      apiKey: 'shared-private-key',
      enabled: true,
    })
    .expect(204);
  await changed;
  const first = (await s.api(b.token).get('/api/ai/settings').expect(200)).body;
  assert.equal(first.model, 'shared-model');
  assert.equal(first.hasKey, true);
  assert.equal(first.enabled, true);
  assert.equal(JSON.stringify(first).includes('shared-private-key'), false);
  await s
    .api(b.token)
    .post('/api/ai/settings', {
      baseUrl: first.baseUrl,
      model: 'partner-model',
      enabled: false,
    })
    .expect(204);
  const second = (await s.api(a.token).get('/api/ai/settings').expect(200)).body;
  assert.equal(second.model, 'partner-model');
  assert.equal(second.enabled, false);
  assert.equal(second.hasKey, true);
  const saved = await s.db.prepare('SELECT * FROM couple_ai_settings').all();
  assert.equal(saved.length, 1);
  assert.notEqual(saved[0].secret, 'shared-private-key');
  assert.equal(
    decryptKey(String(saved[0].secret), 'test-secret-at-least-thirty-two-chars'),
    'shared-private-key',
  );
  await s.api(b.token).patch('/api/ai/profile', { name: '松子' }).expect(204);
  assert.equal((await s.api(a.token).get('/api/me')).body.ai.name, '松子');
  assert.equal((await s.api(b.token).get('/api/me')).body.ai.name, '松子');
  assert.equal((await s.api(c.token).get('/api/ai/settings')).body.baseUrl, '');
  await s
    .api(b.token)
    .post('/api/ai/settings', {
      baseUrl: 'https://another.example.com/v1',
      model: 'new-model',
      enabled: true,
    })
    .expect(204);
  assert.equal((await s.api(a.token).get('/api/ai/settings')).body.hasKey, false);
  await s.api(a.token).delete('/api/pairing').expect(204);
  await s.api(b.token).get('/api/ai/settings').expect(409);
  await s.pair(a.token, b.token);
  const fresh = (await s.api(b.token).get('/api/ai/settings')).body;
  assert.equal(fresh.name, '小爱');
  assert.equal(fresh.baseUrl, '');
});

test('presence reflects foreground activity, multiple connections, disconnects and pair isolation', async (t) => {
  const s = await setup(t);
  const a = await s.register('alice'),
    b = await s.register('bob');
  await s.pair(a.token, b.token);
  const make = (token: string, active = true) => {
    const socket = io(s.base, {
      auth: { token, active },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
    });
    t.after(() => socket.disconnect());
    return socket;
  };
  const aSocket = make(a.token);
  const online = (id: string, value: boolean) => (state: any) =>
    state.users.some((user: any) => user.id === id && user.online === value);
  const initial = event(aSocket, 'presence:changed', online(b.user.id, false));
  aSocket.connect();
  assert.equal((await initial).users.find((user: any) => user.id === a.user.id).online, true);
  const bSocket = make(b.token, false);
  const connected = event(bSocket, 'connect');
  bSocket.connect();
  await connected;
  const active = event(aSocket, 'presence:changed', online(b.user.id, true));
  bSocket.emit('presence:set', { active: true });
  await active;
  const inactive = event(aSocket, 'presence:changed', online(b.user.id, false));
  bSocket.emit('presence:set', { active: false });
  await inactive;
  const second = make(b.token);
  const visible = event(aSocket, 'presence:changed', online(b.user.id, true));
  second.connect();
  await visible;
  const disconnected = event(aSocket, 'presence:changed', online(b.user.id, false));
  second.disconnect();
  await disconnected;
  const c = await s.register('charlie'),
    d = await s.register('dana');
  await s.pair(c.token, d.token);
  let leaked = false;
  aSocket.on('presence:changed', (state) => {
    if (state.users.some((user: any) => user.id === c.user.id)) leaked = true;
  });
  const outsider = make(c.token);
  const outsiderState = event(outsider, 'presence:changed');
  outsider.connect();
  await outsiderState;
  assert.equal(leaked, false);
  const back = event(aSocket, 'presence:changed', online(b.user.id, true));
  bSocket.emit('presence:set', { active: true });
  await back;
  const wallTime = Date.now();
  t.mock.method(Date, 'now', () => wallTime + 31000);
  const stale = event(aSocket, 'presence:changed', online(b.user.id, false));
  aSocket.emit('presence:get');
  await stale;
  const reported = event(aSocket, 'presence:changed', online(b.user.id, true));
  bSocket.emit('presence:set', { active: true, lastReportedAt: 0 });
  await reported;
  const loggedOut = event(aSocket, 'presence:changed', online(b.user.id, false));
  await s.api(b.token).post('/api/auth/logout', {}).expect(204);
  await loggedOut;
});
