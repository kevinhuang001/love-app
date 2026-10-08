import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setup } from './support.js';

test('public HTTP keeps CSP protections without upgrading assets, even with untrusted proxy headers', async (t) => {
  const s = await setup(t);
  s.app.set('trust proxy', false);
  for (const path of ['/api/health', '/api/auth/config', '/api/messages']) {
    const response = await request(s.app)
      .get(path)
      .set('Host', 'public-http.test:8013')
      .set('X-Forwarded-Proto', 'https');
    const csp = response.headers['content-security-policy'];
    assert.doesNotMatch(csp, /upgrade-insecure-requests/);
    assert.match(csp, /script-src 'self'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /connect-src [^;]*http: ws:/);
    assert.match(csp, /img-src [^;]*http:/);
    assert.match(csp, /media-src [^;]*http:/);
    for (const header of [
      'cross-origin-opener-policy',
      'origin-agent-cluster',
      'strict-transport-security',
    ])
      assert.equal(response.headers[header], undefined);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN');
  }
});

test('trusted proxy HTTPS retains upgrade, isolation and HSTS; HTTP on that proxy stays HTTP', async (t) => {
  const s = await setup(t);
  s.app.set('trust proxy', 1);
  const secure = await request(s.app).get('/api/health').set('X-Forwarded-Proto', 'https');
  assert.match(secure.headers['content-security-policy'], /upgrade-insecure-requests/);
  assert.equal(secure.headers['cross-origin-opener-policy'], 'same-origin');
  assert.equal(secure.headers['origin-agent-cluster'], '?1');
  assert.match(secure.headers['strict-transport-security'], /max-age=/);
  assert.doesNotMatch(secure.headers['content-security-policy'], /connect-src [^;]* ws:/);
  const plain = await request(s.app).get('/api/health').set('X-Forwarded-Proto', 'http');
  assert.doesNotMatch(plain.headers['content-security-policy'], /upgrade-insecure-requests/);
  assert.equal(plain.headers['origin-agent-cluster'], undefined);
});
