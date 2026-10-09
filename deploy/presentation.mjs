// Short aligned rows keep terminal notes readable without printing private values.
export function formatRows(rows) {
  const width = (value) =>
    Array.from(value).reduce((n, c) => n + (c.charCodeAt(0) > 255 ? 2 : 1), 0);
  const column = Math.max(...rows.map(([label]) => width(label))) + 2;
  return rows.map(([label, value]) => label + ' '.repeat(column - width(label)) + value).join('\n');
}
export function databaseLabel(config) {
  return { sqlite: 'SQLite · 本机', postgres: 'PostgreSQL · 内置', external: 'PostgreSQL · 远程' }[
    config.LOVE_DATABASE || 'sqlite'
  ];
}
export function databaseEndpoint(config) {
  if (config.LOVE_DATABASE !== 'external') return '';
  try {
    const url = new URL(config.DATABASE_URL);
    return url.host + url.pathname;
  } catch {
    return '连接地址未配置';
  }
}
export function imageVersion(image) {
  const label = image?.Config?.Labels?.['org.opencontainers.image.version'];
  if (/^\d+\.\d+\.\d+$/.test(label || '')) return 'v' + label;
  for (const tag of image?.RepoTags || []) {
    const version = tag.match(/:v?(\d+\.\d+\.\d+)$/);
    if (version) return 'v' + version[1];
  }
  return '未知（旧镜像）';
}
export function deploymentRows(config, context = {}) {
  const rows = [
    ['管理程序', context.version ? 'v' + context.version : '—'],
    ['应用版本', context.appVersion || '尚未检查'],
    ['运行状态', context.status || '尚未检查'],
    ['最新版本', context.latestVersion ? 'v' + context.latestVersion : '选择“检查更新”查询'],
    ['项目名称', config.COMPOSE_PROJECT_NAME || 'love-v4'],
    ['数据库', databaseLabel(config)],
  ];
  if (databaseEndpoint(config)) rows.push(['数据源', databaseEndpoint(config)]);
  const tls = config.LOVE_HTTPS === '1' && config.LOVE_TLS_PROVIDER !== 'external';
  const ip = (tls ? config.LOVE_TLS_BIND_IP : config.LOVE_BIND_IP) || '127.0.0.1';
  rows.push([
    '监听地址',
    `${tls ? 'HTTPS' : 'HTTP'} · ${ip.includes(':') ? '[' + ip + ']' : ip}:${(tls ? config.LOVE_TLS_PORT : config.LOVE_PORT) || (tls ? '443' : '3000')}`,
  ]);
  return rows;
}
