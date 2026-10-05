import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:3000';
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
const html = await (await fetch(base)).text();
assert.match(html, /<meta charset="UTF-8"/);
assert.match(html, /Love/);
const cssPath = html.match(/href="([^"]+\.css)"/)[1];
const css = await (await fetch(base + cssPath)).text();
assert.match(css, /Noto Sans SC/);
const font = css.match(/url\(([^)]+\.woff2)\)/)[1];
assert.ok((await fetch(new URL(font.replace(/["']/g, ''), base + cssPath))).ok);
const password = 'container-test-password';
if (process.argv.includes('--verify-persistence')) {
  const a = await api('/api/auth/login', { username: 'docker_alice', password });
  const dates = await api('/api/anniversaries', null, a.token),
    todos = await api('/api/todos', null, a.token);
  assert.equal(dates[0].title, '我们的第一次见面');
  assert.equal(todos[0].title, '七夕');
  assert.equal(todos[0].calendar, 'lunar');
  assert.equal((await api('/api/me', null, a.token)).ai.name, '小桃');
  console.log('Docker restart preserved users, dates, lunar To Do and AI identity');
} else {
  const a = await api('/api/auth/register', { username: 'docker_alice', name: '小爱', password });
  const b = await api('/api/auth/register', { username: 'docker_bob', name: '小许', password });
  const { code } = await api('/api/pairing/invite', {}, a.token);
  await api('/api/pairing/join', { code }, b.token);
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
  const messages = await api('/api/messages', null, b.token);
  assert.equal(messages.items[0].content, '中文提示正常，七夕再见！');
  assert.equal((await api('/api/me', null, a.token)).ai.name, '小桃');
  console.log(
    'Docker serves Web fonts, UTF-8 API, paired chat, dates, lunar To Do and AI identity',
  );
}
