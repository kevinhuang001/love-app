// CI uses local certificate fixtures, never a real domain or production ACME account.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import https from 'node:https';
import http from 'node:http';
const dir = await mkdtemp(join(tmpdir(), 'love-tls-ci-'));
const network = 'love-tls-ci',
  proxy = 'love-tls-proxy',
  backend = 'love-tls-backend';
const certs = 'love-tls-ci-certs',
  webroot = 'love-tls-ci-webroot',
  domain = 'love.example.test';
const docker = (...args) =>
  execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const until = async (fn) => {
  let error;
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      return await fn();
    } catch (e) {
      error = e;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw error;
};
try {
  // Validate the separate Caddy-managed certificate path without contacting a CA.
  docker(
    'run',
    '--rm',
    '-e',
    `LOVE_DOMAIN=${domain}`,
    '-e',
    'LOVE_TLS_PORT=8013',
    '-v',
    `${resolve('Caddyfile')}:/etc/caddy/Caddyfile:ro`,
    'caddy:2-alpine',
    'caddy',
    'validate',
    '--config',
    '/etc/caddy/Caddyfile',
    '--adapter',
    'caddyfile',
  );
  docker('network', 'create', network);
  docker(
    'run',
    '-d',
    '--name',
    backend,
    '--network',
    network,
    '--network-alias',
    'love',
    '-e',
    'TRUST_PROXY=1',
    '-e',
    'MEDIA_SIGNING_SECRET=ci-tls-fixture-secret-not-for-production',
    '-e',
    'ADMIN_USERNAME=ci_admin',
    '-e',
    'ADMIN_PASSWORD=ci-tls-admin-password',
    'love-ci',
  );
  docker(
    'run',
    '-d',
    '--name',
    proxy,
    '--network',
    network,
    '-p',
    '127.0.0.1::80',
    '-p',
    '127.0.0.1::443',
    '-e',
    `LOVE_DOMAIN=${domain}`,
    '-e',
    'LOVE_TLS_PORT=8013',
    '-v',
    `${certs}:/etc/letsencrypt:ro`,
    '-v',
    `${webroot}:/var/www/certbot:ro`,
    '-v',
    `${resolve('deploy/certbot-proxy.sh')}:/opt/love/certbot-proxy.sh:ro`,
    '--entrypoint',
    '/bin/sh',
    'caddy:2-alpine',
    '/opt/love/certbot-proxy.sh',
  );
  const [container] = JSON.parse(docker('inspect', proxy));
  const httpPort = Number(container.NetworkSettings.Ports['80/tcp'][0].HostPort);
  const tlsPort = Number(container.NetworkSettings.Ports['443/tcp'][0].HostPort);
  const plain = (path = '/') =>
    new Promise((resolve, reject) => {
      const req = http.get(
        { hostname: '127.0.0.1', port: httpPort, path, headers: { Host: domain }, timeout: 5000 },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        },
      );
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('HTTP timeout')));
    });
  const pending = await until(async () => {
    const response = await plain();
    assert.equal(response.status, 503);
    return response;
  });
  assert.match(pending.body, /certificate pending/);
  // Verify HTTP-01 routing before issuing any certificate.
  docker(
    'run',
    '--rm',
    '-v',
    `${webroot}:/webroot`,
    '--entrypoint',
    'sh',
    'caddy:2-alpine',
    '-c',
    'mkdir -p /webroot/.well-known/acme-challenge; echo fixture-proof > /webroot/.well-known/acme-challenge/test-token',
  );
  const challenge = await plain('/.well-known/acme-challenge/test-token');
  assert.equal(challenge.status, 200);
  assert.equal(challenge.body.trim(), 'fixture-proof');
  const issue = async (serial) => {
    execFileSync(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-days',
        '30',
        '-keyout',
        join(dir, 'privkey.pem'),
        '-out',
        join(dir, 'fullchain.pem'),
        '-set_serial',
        String(serial),
        '-subj',
        `/CN=${domain}`,
        '-addext',
        `subjectAltName=DNS:${domain}`,
      ],
      { stdio: 'pipe' },
    );
    docker(
      'run',
      '--rm',
      '-v',
      `${certs}:/certs`,
      '-v',
      `${dir}:/fixture:ro`,
      '--entrypoint',
      'sh',
      'caddy:2-alpine',
      '-c',
      `mkdir -p /certs/live/${domain}; cp /fixture/*.pem /certs/live/${domain}/`,
    );
    return await readFile(join(dir, 'fullchain.pem'));
  };
  const secure = (ca) =>
    new Promise((resolve, reject) => {
      const req = https.get(
        {
          hostname: '127.0.0.1',
          port: tlsPort,
          servername: domain,
          path: '/api/health',
          headers: { Host: `${domain}:8013` },
          ca,
          agent: false,
          timeout: 5000,
        },
        (res) => {
          const serial = res.socket.getPeerCertificate().serialNumber;
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () =>
            resolve({ status: res.statusCode, headers: res.headers, body, serial }),
          );
        },
      );
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('TLS timeout')));
    });
  const check = async (ca, serial) =>
    until(async () => {
      const response = await secure(ca);
      assert.equal(response.status, 200);
      assert.equal(JSON.parse(response.body).status, 'ok');
      assert.equal(response.serial, serial);
      assert.match(response.headers['content-security-policy'], /upgrade-insecure-requests/);
      assert.equal(response.headers['cross-origin-opener-policy'], 'same-origin');
      assert.equal(response.headers['origin-agent-cluster'], '?1');
      assert.match(response.headers['strict-transport-security'], /max-age=/);
      assert.equal(response.headers['alt-svc'], undefined);
      return response;
    });
  await check(await issue(1), '01');
  const redirect = await plain();
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.location, `https://${domain}:8013/`);
  await check(await issue(2), '02');
  docker('exec', proxy, 'test', '-f', '/tmp/love-tls-ready');
  docker('run', '--rm', '--entrypoint', 'certbot', 'certbot/certbot:v5.8.0', '--version');
  console.log(
    'Real TLS proxy: challenge bootstrap, HTTPS headers, HTTP redirect and live certificate replacement passed.',
  );
} catch (error) {
  for (const name of [proxy, backend]) {
    try {
      const logs = spawnSync('docker', ['logs', name], { encoding: 'utf8' });
      console.error(logs.stdout + logs.stderr);
    } catch {}
  }
  throw error;
} finally {
  for (const name of [proxy, backend]) {
    try {
      docker('rm', '-f', name);
    } catch {}
  }
  for (const volume of [certs, webroot]) {
    try {
      docker('volume', 'rm', volume);
    } catch {}
  }
  try {
    docker('network', 'rm', network);
  } catch {}
  await rm(dir, { recursive: true, force: true });
}
