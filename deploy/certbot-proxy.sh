#!/bin/sh
set -eu
: "${LOVE_DOMAIN:?HTTPS domain required}"
# The setup validator also enforces a real domain; reject Caddy config injection here.
case "$LOVE_DOMAIN" in *[!a-zA-Z0-9.-]*|'') echo 'Invalid HTTPS domain' >&2; exit 1;; esac
cert="/etc/letsencrypt/live/$LOVE_DOMAIN"
tls_port=${LOVE_TLS_PORT:-443}
case "$tls_port" in *[!0-9]*|'') echo 'Invalid HTTPS port' >&2; exit 1;; esac
[ "$tls_port" -ge 1 ] && [ "$tls_port" -le 65535 ] && [ "$tls_port" -ne 80 ] || { echo 'HTTPS port must be 1-65535 and different from HTTP-01 port 80' >&2; exit 1; }
public="https://$LOVE_DOMAIN"
[ "$tls_port" = 443 ] || public="$public:$tls_port"
runtime=/etc/caddy/love-runtime.Caddyfile
rm -f /tmp/love-tls-ready
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
    echo "    redir $public{uri} 308" >> "$runtime.next"
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
  header -Alt-Svc
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
    # Certificate paths stay unchanged after renewal; force reload of their content.
    if render "$next" && caddy reload --force --config "$runtime" --adapter caddyfile; then
      current=$next
      touch /tmp/love-tls-ready
      echo 'HTTPS proxy: renewed certificate loaded.'
    else
      echo 'HTTPS proxy: certificate reload failed; retrying in 30 seconds.' >&2
    fi
  fi
done
wait "$pid"
