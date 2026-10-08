#!/bin/sh
set -eu
: "${LOVE_DOMAIN:?HTTPS domain required}"
: "${CERTBOT_EMAIL:?Certbot email required}"
config=${CERTBOT_CONFIG_DIR:-/etc/letsencrypt}
webroot=${CERTBOT_WEBROOT:-/var/www/certbot}
mkdir -p "$webroot"
pause() { sleep "$1" & wait "$!"; }
trap 'exit 0' TERM INT
if [ -n "${CERTBOT_PROXY_URL:-}" ]; then
  until python -c 'import os, urllib.request; request = urllib.request.Request(os.environ["CERTBOT_PROXY_URL"], headers={"Host": os.environ["LOVE_DOMAIN"]}); urllib.request.urlopen(request, timeout=5).close()'; do
    echo 'Certbot: waiting for the HTTP challenge endpoint.'
    pause 5
  done
fi
while :; do
  if [ ! -s "$config/live/$LOVE_DOMAIN/fullchain.pem" ]; then
    if certbot certonly --non-interactive --agree-tos --email "$CERTBOT_EMAIL" \
      --webroot --webroot-path "$webroot" --config-dir "$config" \
      --cert-name "$LOVE_DOMAIN" --domain "$LOVE_DOMAIN"; then
      echo 'Certbot: certificate issued; proxy will load it automatically.'
    else
      echo 'Certbot: issuance failed; check DNS and public port 80. Retry in 15 minutes.' >&2
      pause 900
      continue
    fi
  fi
  if certbot renew --non-interactive --config-dir "$config" --cert-name "$LOVE_DOMAIN" \
    --webroot --webroot-path "$webroot"; then
    echo 'Certbot: renewal check complete; next check in 12 hours.'
    pause 43200
  else
    echo 'Certbot: renewal failed; keeping current certificate, retry in 15 minutes.' >&2
    pause 900
  fi
done
