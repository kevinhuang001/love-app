#!/bin/sh
set -eu
: "${LOVE_DOMAIN:?HTTPS domain required}"
# The setup validator also enforces a real domain; reject Caddy config injection here.
case "$LOVE_DOMAIN" in *[!a-zA-Z0-9.-]*|'') echo 'Invalid HTTPS domain' >&2; exit 1;; esac
cert="/etc/letsencrypt/live/$LOVE_DOMAIN"
runtime=/etc/caddy/love-runtime.Caddyfile
fingerprint() {
  [ -s "$cert/fullchain.pem" ] && [ -s "$cert/privkey.pem" ] || return 0
  sha256sum "$cert/fullchain.pem" "$cert/privkey.pem"
}
render() {
  # The challenge endpoint is available before the first certificate exists.
  cat > "$runtime.next" <<EOF
{
  auto_https off
}
http://$LOVE_DOMAIN {
  handle /.well-known/acme-challenge/* {
    root * /var/www/certbot
    file_server
  }
  handle /__love_proxy_health {
    respond "ok" 200
  }
  handle {
EOF
  if [ -n "$1" ]; then
    echo "    redir https://$LOVE_DOMAIN{uri} 308" >> "$runtime.next"
  else
    echo '    respond "HTTPS certificate pending; check Certbot logs" 503' >> "$runtime.next"
  fi
  cat >> "$runtime.next" <<EOF
  }
}
EOF
  if [ -n "$1" ]; then
    cat >> "$runtime.next" <<EOF
https://$LOVE_DOMAIN {
  tls $cert/fullchain.pem $cert/privkey.pem
  encode zstd gzip
  request_body {
    max_size 105MB
  }
  reverse_proxy love:3000
}
EOF
  fi
  caddy validate --config "$runtime.next" --adapter caddyfile || return 1
  mv "$runtime.next" "$runtime"
}
current=$(fingerprint)
render "$current"
caddy run --config "$runtime" --adapter caddyfile &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; wait "$pid" || true; exit 0' TERM INT
sleep 2
if [ -n "$current" ]; then touch /tmp/love-tls-ready; fi
while kill -0 "$pid" 2>/dev/null; do
  sleep 30 & wait "$!"
  next=$(fingerprint)
  if [ -n "$next" ] && [ "$next" != "$current" ]; then
    if render "$next" && caddy reload --config "$runtime" --adapter caddyfile; then
      current=$next
      touch /tmp/love-tls-ready
      echo 'HTTPS proxy: renewed certificate loaded.'
    else
      echo 'HTTPS proxy: certificate reload failed; retrying in 30 seconds.' >&2
    fi
  fi
done
wait "$pid"
