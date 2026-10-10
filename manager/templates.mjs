import compose from '../infra/docker/compose.yml' with { type: 'text' };
import postgres from '../infra/docker/compose.postgres.yml' with { type: 'text' };
import https from '../infra/certificates/compose.https.yml' with { type: 'text' };
import certbot from '../infra/certificates/compose.certbot.yml' with { type: 'text' };
import storage from '../infra/docker/compose.storage.yml' with { type: 'text' };
import caddy from '../infra/certificates/Caddyfile' with { type: 'text' };
import proxy from '../infra/certificates/certbot-proxy.sh' with { type: 'text' };
import renew from '../infra/certificates/certbot-renew.sh' with { type: 'text' };
export const templates = {
  'compose.yml': compose,
  'compose.postgres.yml': postgres,
  'compose.https.yml': https,
  'compose.certbot.yml': certbot,
  'compose.storage.yml': storage,
  Caddyfile: caddy,
  'deploy/certbot-proxy.sh': proxy,
  'deploy/certbot-renew.sh': renew,
};
