import { readFileSync } from 'node:fs';
const sources = {
  'compose.yml': '../infra/docker/compose.yml',
  'compose.postgres.yml': '../infra/docker/compose.postgres.yml',
  'compose.https.yml': '../infra/certificates/compose.https.yml',
  'compose.certbot.yml': '../infra/certificates/compose.certbot.yml',
  'compose.storage.yml': '../infra/docker/compose.storage.yml',
  Caddyfile: '../infra/certificates/Caddyfile',
  'deploy/certbot-proxy.sh': '../infra/certificates/certbot-proxy.sh',
  'deploy/certbot-renew.sh': '../infra/certificates/certbot-renew.sh',
};
export const templates = Object.fromEntries(
  Object.entries(sources).map(([name, path]) => [
    name,
    readFileSync(new URL(path, import.meta.url), 'utf8'),
  ]),
);
