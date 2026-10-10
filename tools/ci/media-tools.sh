#!/usr/bin/env bash
# Keep CI system packages separate from the runner's unrelated third-party repositories.
set -euo pipefail

media_ready() {
  command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null &&
    test -r /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf || return 1
  local encoders
  encoders=$(ffmpeg -hide_banner -encoders 2>/dev/null)
  [[ "$encoders" == *libx264* && "$encoders" == *libwebp* && "$encoders" == *aac* ]]
}

if ! media_ready; then
  source /etc/os-release
  [[ "$ID" == ubuntu && "$VERSION_CODENAME" == noble ]] || {
    echo 'CI media setup requires Ubuntu 24.04.' >&2
    exit 1
  }
  archive="$HOME/.cache/love-apt"
  mkdir -p "$archive"
  sources=$(mktemp)
  trap 'rm -f "$sources"' EXIT
  apt_options=(
    -o "Dir::Etc::sourcelist=$sources" -o Dir::Etc::sourceparts=-
    -o "Dir::Cache::archives=$archive"
    -o Acquire::Retries=1 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20
    -o APT::Update::Error-Mode=any -o APT::Keep-Downloaded-Packages=true
  )
  installed=false
  for mirror in https://archive.ubuntu.com/ubuntu https://azure.archive.ubuntu.com/ubuntu; do
    security=https://security.ubuntu.com/ubuntu
    [[ "$mirror" != *azure* ]] || security=$mirror
    printf 'deb %s noble main universe\ndeb %s noble-updates main universe\ndeb %s noble-security main universe\n' \
      "$mirror" "$mirror" "$security" > "$sources"
    chmod 644 "$sources"
    echo "Installing required media tools from $mirror (cached .deb files reused)."
    if timeout --kill-after=15s 60s sudo apt-get "${apt_options[@]}" update &&
      timeout --kill-after=15s 180s sudo env DEBIAN_FRONTEND=noninteractive \
        apt-get "${apt_options[@]}" install -y --no-install-recommends ffmpeg fonts-dejavu-core; then
      installed=true
      break
    fi
    echo 'Mirror failed or exceeded its download budget; trying the next official mirror.' >&2
  done
  [[ "$installed" == true ]] || exit 1
fi

media_ready || { echo 'Required media encoders or captcha font are missing.' >&2; exit 1; }
ffmpeg -version
ffprobe -version
