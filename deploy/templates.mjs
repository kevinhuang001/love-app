import compose from '../compose.yml' with { type: 'text' };
import postgres from '../compose.postgres.yml' with { type: 'text' };
import https from '../compose.https.yml' with { type: 'text' };
import certbot from '../compose.certbot.yml' with { type: 'text' };
import storage from '../compose.storage.yml' with { type: 'text' };
import caddy from '../Caddyfile' with { type: 'text' };
import proxy from './certbot-proxy.sh' with { type: 'text' };
import renew from './certbot-renew.sh' with { type: 'text' };
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
