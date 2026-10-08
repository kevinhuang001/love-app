import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const base = 'http://127.0.0.1:3000';
if (process.env.SMOKE_BIND_IP) {
  const [container] = JSON.parse(
    execFileSync('docker', ['inspect', process.env.SMOKE_CONTAINER || 'love-smoke'], {
      encoding: 'utf8',
    }),
  );
  assert.ok(
    container.NetworkSettings.Ports['3000/tcp'].some(
      (binding) => binding.HostIp === process.env.SMOKE_BIND_IP,
    ),
    'Container must publish the configured host IP',
  );
}
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const response = await fetch(base + '/api/health');
    if (response.ok) break;
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (attempt === 59) throw new Error('Container did not become healthy');
}
async function api(path, body, token, method = body ? 'POST' : 'GET') {
  const r = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.ok(r.ok, `${method} ${path}: ${r.status} ${await r.clone().text()}`);
  return r.status === 204 ? null : r.json();
}
assert.equal((await api('/api/health')).database, process.env.SMOKE_DATABASE || 'sqlite');
const web = await fetch(base);
assert.ok(web.ok);
assert.doesNotMatch(web.headers.get('content-security-policy'), /upgrade-insecure-requests/);
for (const header of [
  'cross-origin-opener-policy',
  'origin-agent-cluster',
  'strict-transport-security',
])
  assert.equal(web.headers.get(header), null, `${header} must not be sent over HTTP`);
assert.equal(web.headers.get('x-content-type-options'), 'nosniff');
const html = await web.text();
const jsPath = html.match(/src="([^" ]+\.js)"/)[1];
assert.ok((await fetch(base + jsPath)).ok);
assert.ok((await fetch(base + '/favicon.svg')).ok);
assert.match(html, /<meta charset="UTF-8"/);
assert.match(html, /Love/);
const cssPath = html.match(/href="([^"]+\.css)"/)[1];
const css = await (await fetch(base + cssPath)).text();
assert.match(css, /Noto Sans SC/);
const font = css.match(/url\(([^)]+\.woff2)\)/)[1];
assert.ok((await fetch(new URL(font.replace(/["']/g, ''), base + cssPath))).ok);
// Exercise the production PNG challenge and validation. Only this CI fixture sets
// the digest in its isolated container database; production has no test bypass.
async function captcha(purpose) {
  const challenge = await api('/api/auth/captcha?purpose=' + purpose);
  assert.match(challenge.image, /^data:image\/png;base64,/);
  assert.ok(Buffer.from(challenge.image.split(',')[1], 'base64').length > 500);
  const answer = '23456';
  execFileSync(
    'docker',
    [
      'exec',
      process.env.SMOKE_CONTAINER || 'love-smoke',
      'node',
      '--input-type=module',
      '-e',
      `import { openDatabase } from './apps/server/dist/db.js';
     import { createHmac } from 'node:crypto';
     const db = await openDatabase({path:process.env.DATABASE_URL || process.env.DATABASE_PATH || '/app/data/love.sqlite',provider:process.env.DATABASE_PROVIDER || undefined});
     const id = process.argv[1], answer = process.argv[2];
     const hash = createHmac('sha256', process.env.MEDIA_SIGNING_SECRET).update('captcha:' + id + ':' + answer).digest('hex');
     await db.prepare('UPDATE captchas SET hash=? WHERE id=?').run(hash, id); await db.close();`,
      challenge.id,
      answer,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return { captchaId: challenge.id, captcha: answer };
}
const password = 'container-test-password';
const admin = await api('/api/admin/login', {
  username: 'ci_admin',
  password: 'ci-admin-password-for-smoke',
  ...(await captcha('admin')),
});
assert.equal((await api('/api/auth/config')).registration, 'closed');
const login = (username) =>
  captcha('login').then((proof) => api('/api/auth/login', { username, password, ...proof }));
if (process.argv.includes('--verify-persistence')) {
  const a = await login('docker_alice');
  const dates = await api('/api/anniversaries', null, a.token),
    todos = await api('/api/todos', null, a.token);
  assert.equal(dates[0].title, '我们的第一次见面');
  assert.equal(todos[0].title, '七夕');
  assert.equal(todos[0].calendar, 'lunar');
  assert.equal((await api('/api/me', null, a.token)).ai.name, '小桃');
  const couples = await api('/api/admin/couples', null, admin.token);
  assert.equal(couples.items[0].quotaMiB, 128);
  assert.equal((await api('/api/admin/overview', null, admin.token)).users, 2);
  assert.equal((await api('/api/admin/settings', null, admin.token)).defaultQuotaMiB, 4096);
  console.log(
    'Docker restart preserved administrator, verified users, quotas, dates, lunar To Do and AI identity',
  );
} else {
  const settings = await api('/api/admin/settings', null, admin.token);
  assert.equal(settings.defaultQuotaMiB, Number(process.env.SMOKE_INITIAL_QUOTA || 1024));
  await api('/api/admin/settings', { ...settings, defaultQuotaMiB: 4096 }, admin.token, 'PATCH');
  for (const [username, name] of [
    ['docker_alice', '小爱'],
    ['docker_bob', '小许'],
  ]) {
    await api(
      '/api/admin/users',
      { username, name, email: username + '@example.test', password, confirmedEmail: true },
      admin.token,
    );
  }
  const a = await login('docker_alice'),
    b = await login('docker_bob');
  const { code } = await api('/api/pairing/invite', {}, a.token);
  await api('/api/pairing/join', { code }, b.token);
  const couples = await api('/api/admin/couples', null, admin.token);
  await api(
    '/api/admin/couples/' + couples.items[0].id + '/quota',
    { quotaMiB: 128 },
    admin.token,
    'PATCH',
  );
  await api('/api/anniversaries', { title: '我们的第一次见面', date: '2025-01-01' }, a.token);
  await api(
    '/api/todos',
    { title: '七夕', date: '2026-07-07', calendar: 'lunar', repeat: 'yearly', leapMonth: false },
    a.token,
  );
  await api('/api/ai/profile', { name: '小桃' }, a.token, 'PATCH');
  await api(
    '/api/messages',
    { clientId: crypto.randomUUID(), content: '中文提示正常，七夕再见！' },
    a.token,
  );
  assert.equal(
    (await api('/api/messages', null, b.token)).items[0].content,
    '中文提示正常，七夕再见！',
  );
  assert.equal((await api('/api/me', null, a.token)).ai.name, '小桃');
  assert.ok(
    (await api('/api/admin/logs/access', null, admin.token)).items.some(
      (x) => x.path === '/api/messages',
    ),
  );
  console.log(
    'Docker serves Web fonts, PNG captcha, administrator access, verified accounts, quotas, logs and paired UTF-8 chat',
  );
}
