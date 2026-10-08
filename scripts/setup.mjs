import * as prompts from '@clack/prompts';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, rename, chmod, mkdir, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import { isIP } from 'node:net';
const identifier = (value) =>
  /^[a-z][a-z0-9_]{0,30}$/.test(value) ? undefined : '使用小写字母、数字、下划线，以字母开头';
const username = (value) =>
  /^[a-z0-9_]{3,24}$/.test(value) ? undefined : '用户名为 3–24 位小写字母、数字或下划线';
const port = (value) =>
  /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 65535
    ? undefined
    : '端口范围为 1–65535';
const bindIP = (value) =>
  isIP(value) && !value.includes('%') ? undefined : '填写有效的 IPv4 或 IPv6 地址，不含端口';
const domain = (value) =>
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value) &&
  value !== 'love.example.com'
    ? undefined
    : '填写解析到服务器的真实域名，不含 https:// 或路径';
const email = (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : '填写有效邮箱');
export const quoteEnv = (value) => "'" + String(value).replaceAll("'", "\\'") + "'";
export function parseDeploymentEnv(content) {
  const config = {};
  for (const line of content.split(/\r?\n/)) {
    const quoted = line.match(/^([A-Za-z_][A-Za-z0-9_]*)='((?:\\'|[^'])*)'\s*$/);
    if (quoted) config[quoted[1]] = quoted[2].replaceAll("\\'", "'");
    else Object.assign(config, parseEnv(line));
  }
  return config;
}
export function validateConfig(config) {
  if (
    Object.entries(config).some(
      ([key, value]) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || /[\r\n\0]/.test(value),
    )
  )
    throw new Error('配置值不能包含换行或控制字符');
  if (!config.MEDIA_SIGNING_SECRET || config.MEDIA_SIGNING_SECRET.length < 32)
    throw new Error('媒体密钥至少 32 字符');
  if (username(config.ADMIN_USERNAME || '')) throw new Error('管理员用户名无效');
  if (
    !config.ADMIN_PASSWORD ||
    config.ADMIN_PASSWORD.length < 12 ||
    config.ADMIN_PASSWORD.length > 128
  )
    throw new Error('管理员密码长度为 12–128 字符');
  if (port(config.LOVE_PORT)) throw new Error('服务端口无效');
  if (bindIP(config.LOVE_BIND_IP || '')) throw new Error('HTTP 监听 IP 无效');
  if (!['0', '1'].includes(config.LOVE_HTTPS)) throw new Error('HTTPS 选择无效');
  if (config.LOVE_HTTPS === '1') {
    if (domain(config.LOVE_DOMAIN || '')) throw new Error('HTTPS 域名无效');
    if (!['certbot', 'caddy', 'external'].includes(config.LOVE_TLS_PROVIDER))
      throw new Error('证书方式无效');
    if (config.LOVE_TLS_PROVIDER === 'certbot' && email(config.CERTBOT_EMAIL || ''))
      throw new Error('Certbot 邮箱无效');
    if (port(config.LOVE_TLS_PORT || '')) throw new Error('HTTPS 访问端口无效');
    if (
      config.LOVE_TLS_PROVIDER !== 'external' &&
      (bindIP(config.LOVE_TLS_BIND_IP || '') || Number(config.LOVE_TLS_PORT) === 80)
    )
      throw new Error('HTTPS 监听 IP 无效或访问端口与 HTTP-01 的 80 端口冲突');
  }
  if (config.LOVE_DOCKERFILE && !['Dockerfile', 'Dockerfile.cn'].includes(config.LOVE_DOCKERFILE))
    throw new Error('构建文件只能为 Dockerfile 或 Dockerfile.cn');
  if (config.LOVE_IMAGE && !/^[A-Za-z0-9][A-Za-z0-9_./:@-]*$/.test(config.LOVE_IMAGE))
    throw new Error('Docker 镜像地址无效');
  if (config.LOVE_IMAGE_PULL && !['0', '1'].includes(config.LOVE_IMAGE_PULL))
    throw new Error('镜像拉取设置只能为 0 或 1');
  if (!['sqlite', 'postgres', 'external'].includes(config.LOVE_DATABASE))
    throw new Error('数据库选择无效');
  if (
    config.LOVE_DATABASE === 'postgres' &&
    (!config.POSTGRES_PASSWORD ||
      identifier(config.POSTGRES_USER) ||
      identifier(config.POSTGRES_DB))
  )
    throw new Error('PostgreSQL 配置无效');
  if (config.LOVE_DATABASE === 'external') {
    const url = new URL(config.DATABASE_URL);
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname ||
      url.pathname === '/'
    )
      throw new Error('PostgreSQL URL 无效');
  }
}
export async function setup({ output = '.env', ui = prompts, env = process.env } = {}) {
  let previous = {};
  try {
    previous = parseDeploymentEnv(await readFile(output, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const prior = (key) => previous[key] ?? env[key];
  const ask = async (result) => {
    const value = await result;
    if (ui.isCancel(value)) throw new Error('SETUP_CANCELLED');
    return value;
  };
  const text = async (message, fallback, validate) =>
    ask(
      ui.text({
        message,
        placeholder: String(fallback),
        defaultValue: String(fallback),
        validate: validate ? (value) => validate(value || String(fallback)) : undefined,
      }),
    );
  const password = async (message, old, minimum = 1) => {
    const value = await ask(
      ui.password({
        message: message + (old ? '（回车保留现有值）' : '（回车自动生成）'),
        validate: (v) =>
          v && (v.length < minimum || v.length > 128) ? `长度为 ${minimum}–128 字符` : undefined,
      }),
    );
    return value || old || randomBytes(24).toString('hex');
  };
  ui.intro('Love · 首次部署配置');
  const config = { ...previous };
  config.LOVE_DOCKERFILE = env.LOVE_DOCKERFILE || prior('LOVE_DOCKERFILE') || 'Dockerfile';
  config.LOVE_IMAGE = env.LOVE_IMAGE || prior('LOVE_IMAGE') || 'love-app:local';
  config.LOVE_IMAGE_PULL = env.LOVE_IMAGE_PULL || prior('LOVE_IMAGE_PULL') || '1';
  config.LOVE_DATABASE = await ask(
    ui.select({
      message: '选择数据库',
      initialValue: prior('LOVE_DATABASE') || (prior('DATABASE_URL') ? 'external' : 'sqlite'),
      options: [
        { value: 'sqlite', label: 'SQLite', hint: '默认 · 单机部署，无需数据库服务' },
        {
          value: 'postgres',
          label: 'PostgreSQL · Compose 内置',
          hint: '自动创建数据库容器和持久化卷',
        },
        { value: 'external', label: 'PostgreSQL · 外部数据库', hint: '连接已有 PostgreSQL' },
      ],
    }),
  );
  config.DATABASE_PROVIDER = config.LOVE_DATABASE === 'sqlite' ? 'sqlite' : 'postgres';
  config.DATABASE_URL = '';
  if (config.LOVE_DATABASE === 'postgres') {
    config.POSTGRES_DB = await text('数据库名称', prior('POSTGRES_DB') || 'love', identifier);
    config.POSTGRES_USER = await text('数据库用户', prior('POSTGRES_USER') || 'love', identifier);
    config.POSTGRES_PASSWORD = await password('数据库密码', prior('POSTGRES_PASSWORD'));
  } else if (config.LOVE_DATABASE === 'external') {
    config.DATABASE_URL =
      (await ask(
        ui.password({
          message: 'PostgreSQL 连接 URL' + (prior('DATABASE_URL') ? '（回车保留）' : ''),
          validate: (value) => {
            try {
              const u = new URL(value || prior('DATABASE_URL'));
              return ['postgres:', 'postgresql:'].includes(u.protocol) &&
                u.hostname &&
                u.pathname !== '/'
                ? undefined
                : '填写完整 postgres://user:password@host:5432/database';
            } catch {
              return '填写有效的 PostgreSQL 连接 URL';
            }
          },
        }),
      )) || prior('DATABASE_URL');
  }
  const https = await ask(
    ui.confirm({
      message: '使用 HTTPS？',
      initialValue: prior('LOVE_HTTPS') ? prior('LOVE_HTTPS') === '1' : true,
    }),
  );
  config.LOVE_HTTPS = https ? '1' : '0';
  config.LOVE_DOMAIN = https
    ? await text('访问域名', prior('LOVE_DOMAIN') || 'love.example.com', domain)
    : '';
  config.LOVE_TLS_PROVIDER = https
    ? await ask(
        ui.select({
          message: 'HTTPS 证书方式',
          initialValue: ['certbot', 'caddy', 'external'].includes(prior('LOVE_TLS_PROVIDER'))
            ? prior('LOVE_TLS_PROVIDER')
            : 'certbot',
          options: [
            {
              value: 'certbot',
              label: 'Certbot · 自动申请和续期',
              hint: '默认 · Let’s Encrypt，需要域名及公网 80，HTTPS 端口可自定义',
            },
            {
              value: 'caddy',
              label: 'Caddy · 自动 HTTPS',
              hint: '由 Caddy 自行管理证书，无需 Certbot',
            },
            {
              value: 'external',
              label: '已有反向代理 · 自行管理证书',
              hint: '不启动内置代理或 Certbot，使用自己的 Nginx/Caddy',
            },
          ],
        }),
      )
    : 'none';
  if (config.LOVE_TLS_PROVIDER === 'certbot')
    config.CERTBOT_EMAIL = await text('Certbot 联系邮箱', prior('CERTBOT_EMAIL') || '', email);
  const bundledTLS = https && config.LOVE_TLS_PROVIDER !== 'external';
  const bindingKey = bundledTLS ? 'LOVE_TLS_BIND_IP' : 'LOVE_BIND_IP';
  const previousIP = prior(bindingKey) || (bundledTLS ? '0.0.0.0' : '127.0.0.1');
  const address = await ask(
    ui.select({
      message: `${bundledTLS ? 'HTTPS' : 'HTTP'} 监听地址（宿主机）`,
      initialValue: ['127.0.0.1', '0.0.0.0'].includes(previousIP) ? previousIP : 'custom',
      options: [
        {
          value: '127.0.0.1',
          label: '127.0.0.1 · 仅本机',
          hint: bundledTLS ? '仅本机访问 HTTPS' : '默认 · 适合已有反向代理',
        },
        {
          value: '0.0.0.0',
          label: '0.0.0.0 · 全部 IPv4 网卡',
          hint: `允许局域网或公网访问 ${bundledTLS ? 'HTTPS' : 'HTTP'}`,
        },
        { value: 'custom', label: '指定宿主机 IP', hint: '绑定一张网卡，支持 IPv4 / IPv6' },
      ],
    }),
  );
  config[bindingKey] =
    address === 'custom'
      ? await text(
          '宿主机 IP（例如 192.168.1.10 或 ::1）',
          previousIP === '127.0.0.1' ? '' : previousIP,
          bindIP,
        )
      : address;
  config.LOVE_BIND_IP ||= '127.0.0.1';
  config.LOVE_PORT = bundledTLS
    ? prior('LOVE_PORT') || '3000'
    : await text('HTTP 端口', prior('LOVE_PORT') || '3000', port);
  if (https)
    config.LOVE_TLS_PORT = await text(
      'HTTPS 访问端口',
      prior('LOVE_TLS_PORT') || prior('LOVE_PORT') || '443',
      (value) =>
        port(value) ||
        (bundledTLS && Number(value) === 80
          ? '80 端口用于证书 HTTP-01 验证，请选择其他 HTTPS 端口'
          : undefined),
    );
  if (config.LOVE_TLS_PROVIDER === 'certbot')
    ui.note(
      `域名需解析到本服务器，公网开放 TCP 80 和 HTTPS 端口 ${config.LOVE_TLS_PORT}。证书每 12 小时检查续期并自动加载。`,
      'Certbot',
    );
  const loopback = config.LOVE_BIND_IP.startsWith('127.') || config.LOVE_BIND_IP === '::1';
  config.TRUST_PROXY = https && (bundledTLS || loopback) ? '1' : '0';
  const httpsAccess = `https://${config.LOVE_DOMAIN}${config.LOVE_TLS_PORT === '443' ? '' : ':' + config.LOVE_TLS_PORT}`;
  config.ALLOWED_ORIGINS = https
    ? `${httpsAccess},https://localhost,capacitor://localhost`
    : 'http://localhost:' +
      config.LOVE_PORT +
      ',http://127.0.0.1:' +
      config.LOVE_PORT +
      ',https://localhost,capacitor://localhost';
  config.ADMIN_USERNAME = await text('管理员用户名', prior('ADMIN_USERNAME') || 'admin', username);
  config.ADMIN_PASSWORD = await password('管理员密码', prior('ADMIN_PASSWORD'), 12);
  config.MEDIA_SIGNING_SECRET = prior('MEDIA_SIGNING_SECRET') || randomBytes(32).toString('hex');
  config.INITIAL_QUOTA_MIB = await text(
    '新配对默认容量（MiB）',
    prior('INITIAL_QUOTA_MIB') || '1024',
    (v) => (/^\d+$/.test(v) && Number(v) <= 1000000 ? undefined : '填写 0–1000000，0 禁止上传'),
  );
  const smtp = await ask(
    ui.confirm({
      message: '现在配置 SMTP 和邮箱注册？',
      initialValue: Boolean(prior('INITIAL_SMTP_HOST')),
    }),
  );
  config.INITIAL_REGISTRATION = 'closed';
  if (smtp) {
    config.INITIAL_SMTP_HOST = await text(
      'SMTP 主机',
      prior('INITIAL_SMTP_HOST') || 'smtp.example.com',
      (v) =>
        /^[a-zA-Z0-9.:-]+$/.test(v) && v !== 'smtp.example.com'
          ? undefined
          : '填写邮件服务商的 SMTP 主机',
    );
    config.INITIAL_SMTP_SECURITY = await ask(
      ui.select({
        message: 'SMTP 加密方式',
        initialValue: prior('INITIAL_SMTP_SECURITY') || 'starttls',
        options: [
          { value: 'starttls', label: 'STARTTLS', hint: '默认 · 通常使用端口 587' },
          { value: 'tls', label: 'TLS', hint: '通常使用端口 465' },
          { value: 'plain', label: '明文', hint: '仅用于本地邮件中继' },
        ],
      }),
    );
    config.INITIAL_SMTP_PORT = await text(
      'SMTP 端口',
      prior('INITIAL_SMTP_PORT') || (config.INITIAL_SMTP_SECURITY === 'tls' ? '465' : '587'),
      port,
    );
    config.INITIAL_SMTP_USER = await text(
      'SMTP 用户名',
      prior('INITIAL_SMTP_USER') || '',
      () => undefined,
    );
    config.INITIAL_SMTP_PASSWORD =
      (await ask(ui.password({ message: 'SMTP 密码或授权码（回车保留，未配置则为空）' }))) ||
      prior('INITIAL_SMTP_PASSWORD') ||
      '';
    config.INITIAL_SMTP_FROM = await text(
      '发件邮箱',
      prior('INITIAL_SMTP_FROM') || 'noreply@example.com',
      (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v !== 'noreply@example.com'
          ? undefined
          : '填写已授权的发件邮箱',
    );
    config.INITIAL_REGISTRATION = await ask(
      ui.select({
        message: '初始注册方式',
        initialValue: prior('INITIAL_REGISTRATION') || 'email',
        options: [
          { value: 'email', label: '开放邮箱注册', hint: '注册必须验证邮箱和图形验证码' },
          { value: 'whitelist', label: '邮箱白名单', hint: '登录后台添加允许注册的邮箱' },
          { value: 'closed', label: '仅管理员创建账号' },
        ],
      }),
    );
  }
  config.LOVE_SETUP_COMPLETE = '1';
  validateConfig(config);
  const ip = config[bindingKey];
  const binding =
    (isIP(ip) === 6 ? '[' + ip + ']' : ip) +
    ':' +
    (bundledTLS ? config.LOVE_TLS_PORT : config.LOVE_PORT);
  const access = https
    ? httpsAccess
    : ['0.0.0.0', '::'].includes(config.LOVE_BIND_IP)
      ? 'http://服务器实际IP:' + config.LOVE_PORT
      : 'http://' + binding;
  ui.note(
    `数据库：${config.LOVE_DATABASE}\n${bundledTLS ? 'HTTPS' : 'HTTP'} 监听：${binding}\n${bundledTLS ? '后端 HTTP：仅容器网络，不占宿主机端口\n' : ''}访问：${access}\n证书：${config.LOVE_TLS_PROVIDER}\n管理员：${config.ADMIN_USERNAME}\n默认容量：${config.INITIAL_QUOTA_MIB} MiB\n注册：${config.INITIAL_REGISTRATION}`,
    '即将保存',
  );
  if (!(await ask(ui.confirm({ message: '保存配置并继续？', initialValue: true }))))
    throw new Error('SETUP_CANCELLED');
  await mkdir(dirname(resolve(output)), { recursive: true });
  const content =
    '# Generated by ./love setup. Keep private.\n' +
    Object.entries(config)
      .map(([key, value]) => `${key}=${quoteEnv(value)}`)
      .join('\n') +
    '\n';
  const temp = output + '.tmp-' + process.pid;
  try {
    await writeFile(temp, content, { mode: 0o600, flag: 'wx' });
    await rename(temp, output);
    await chmod(output, 0o600);
  } finally {
    await unlink(temp).catch(() => {});
  }
  ui.outro(
    '配置已保存。管理员密码保存在 .env 的 ADMIN_PASSWORD；请妥善保管。SMTP 和容量配置仅用于首次初始化，后续在后台修改。',
  );
  return config;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('配置向导需要交互终端，请使用 ./love setup（Docker 会分配 -it）。');
    process.exitCode = 1;
  } else
    try {
      await setup({
        output: process.argv.includes('--output')
          ? process.argv[process.argv.indexOf('--output') + 1]
          : '.env',
      });
    } catch (error) {
      if (error.message === 'SETUP_CANCELLED') prompts.cancel('已取消，原配置未改动');
      else console.error(error.message);
      process.exitCode = 1;
    }
}
