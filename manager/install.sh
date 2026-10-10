#!/usr/bin/env bash
# Downloads the standalone manager only. Existing configuration and data stay in place.
set -euo pipefail
umask 077

fail() { printf '\n安装失败：%s\n' "$*" >&2; exit 1; }
verify_checksum() {
  local directory=$1 name=$2
  awk -v asset="$name" '$2 == asset && length($1) == 64 && $1 !~ /[^a-f0-9]/ { print $1 "  " asset; found++ } END { if (found != 1) exit 1 }' "$directory/SHA256SUMS" > "$directory/check" || fail '发布校验文件无效。'
  (cd "$directory" && sha256sum --check --status check) || fail '下载或解压校验失败，原程序保留。'
}
main() {
  [[ $(uname -s) == Linux ]] || fail '仅支持 Linux 部署主机。'
  case "$(uname -m)" in
    x86_64) asset=love-linux-x64 ;;
    aarch64|arm64) asset=love-linux-arm64 ;;
    *) fail '仅支持 AMD64 和 ARM64。' ;;
  esac
  for command in curl sha256sum mktemp awk; do
    command -v "$command" >/dev/null 2>&1 || fail "缺少 $command，请先安装。"
  done
  directory=$(pwd -P)
  [[ ! -d "$directory/love" && ! -L "$directory/love" ]] || fail '当前目录的 love 是目录或符号链接，请选择部署目录。'
  stage=$(mktemp -d "$directory/.love-install.XXXXXXXX")
  trap 'rm -rf -- "$stage"' EXIT
  trap 'exit 130' INT
  trap 'exit 143' HUP TERM
  download=(curl --fail --location --proto '=https' --proto-redir '=https' --connect-timeout 20 --max-time 900 --retry 3 --retry-delay 2)
  printf '\nLove · 安装管理程序\n\n  架构  %s\n  目录  %s\n\n' "${asset#love-linux-}" "$directory"
  # Resolve once, then use fixed-version URLs for both binary and checksum.
  release_url=$("${download[@]}" --silent --show-error --head --output /dev/null --write-out '%{url_effective}' https://github.com/kevinhuang001/love-app/releases/latest)
  [[ "$release_url" =~ ^https://github\.com/kevinhuang001/love-app/releases/tag/(v[0-9]+\.[0-9]+\.[0-9]+)$ ]] || fail '无法获取正式发布版本。'
  version=${BASH_REMATCH[1]}
  base="https://github.com/kevinhuang001/love-app/releases/download/$version"
  printf '正在下载 %s…\n' "$version"
  "${download[@]}" --silent --show-error "$base/SHA256SUMS" --output "$stage/SHA256SUMS"
  archive="$asset.xz"
  if awk -v asset="$archive" '$2 == asset { found=1 } END { exit !found }' "$stage/SHA256SUMS"; then
    command -v xz >/dev/null 2>&1 || fail '缺少 xz，请先安装 xz-utils（Debian/Ubuntu）或 xz。'
    "${download[@]}" --progress-bar "$base/$archive" --output "$stage/$archive"
    verify_checksum "$stage" "$archive"
    printf '正在解压管理程序…\n'
    XZ_OPT= XZ_DEFAULTS= xz --decompress --stdout -- "$stage/$archive" > "$stage/$asset" || fail '压缩包解压失败，原程序保留。'
  else
    # Compatibility with releases published before XZ downloads were introduced.
    "${download[@]}" --progress-bar "$base/$asset" --output "$stage/$asset"
  fi
  verify_checksum "$stage" "$asset"
  chmod 755 "$stage/$asset"
  mv -fT -- "$stage/$asset" "$directory/love"
  printf '\n安装完成 · %s\n配置和数据保持不变。\n' "$version"
  rm -rf -- "$stage"
  trap - EXIT
  # bash receives the script through stdin; reconnect the manager to the terminal.
  if [[ -t 1 ]] && { : </dev/tty; } 2>/dev/null; then
    printf '\n正在打开管理菜单…\n'
    exec "$directory/love" </dev/tty
  fi
  printf '\n在此目录运行 %s./love 即可打开管理菜单。\n' "$([[ $EUID == 0 ]] || printf 'sudo ')"
}

main "$@"
