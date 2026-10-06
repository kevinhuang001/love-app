import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Users,
  HardDrive,
  ScrollText,
  Settings2,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Plus,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Api, defaultServer, normalizeServer } from '@/lib/api';
import type { Session } from '@/lib/types';
import { CaptchaField, type CaptchaValue } from '@/components/CaptchaField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loading, ErrorState } from '@/components/common';
const bytes = (value: number) =>
  value >= 1024 ** 3
    ? `${(value / 1024 ** 3).toFixed(2)} GB`
    : `${(value / 1024 ** 2).toFixed(2)} MB`;
const time = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
const modes = { closed: '仅管理员建号', email: '开放邮箱注册', whitelist: '仅邮箱白名单' };
type Person = {
  id: string;
  username: string;
  name: string;
  email: string;
  disabled: number;
  verifiedAt: string;
  createdAt: string;
  lastLoginAt: string | null;
  coupleId: string | null;
  storageBytes: number;
};
type Pair = {
  id: string;
  members: Pick<Person, 'id' | 'name' | 'username' | 'email' | 'disabled'>[];
  active: boolean;
  storageBytes: number;
  effectiveQuotaMiB: number;
  quotaMiB: number | null;
  messages: number;
  media: number;
  moments: number;
};
type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
type SMTP = {
  host: string;
  port: number;
  security: 'tls' | 'starttls' | 'plain';
  user: string;
  from: string;
  senderName: string;
  passwordConfigured: boolean;
  password?: string;
  clearPassword?: boolean;
};
type Config = {
  registration: 'closed' | 'email' | 'whitelist';
  domains: string[];
  defaultQuotaMiB: number;
  retentionDays: number;
  smtp: SMTP;
  smtpReady: boolean;
};
type Overview = {
  users: number;
  disabledUsers: number;
  pairedUsers: number;
  activeCouples: number;
  media: number;
  images: number;
  videos: number;
  storageBytes: number;
  messages: number;
  moments: number;
  requests24h: number;
  errors24h: number;
  aiPending: number;
  aiFailed: number;
  notificationConnections: number;
  uptime: number;
  node: string;
  registration: Config['registration'];
  smtpReady: boolean;
  retentionDays: number;
};
type LogRow = {
  id: number;
  createdAt: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  ip?: string;
  actorId?: string;
  requestId?: string;
  userAgent?: string;
  level?: string;
  event?: string;
  action?: string;
  adminId?: string;
  target?: string;
  details?: Record<string, unknown>;
};
function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
function Panel({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="text-lg font-medium">{title}</h2>
      {detail && <p className="mt-2 text-xs leading-6 text-muted-foreground">{detail}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
export function AdminPortal() {
  const cache = useQueryClient();
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem('love.admin.session') || 'null');
      return s?.token && s?.server ? { token: s.token, server: normalizeServer(s.server) } : null;
    } catch {
      return null;
    }
  });
  const [server, setServer] = useState(localStorage.getItem('love.server') || defaultServer()),
    [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [captcha, setCaptcha] = useState<CaptchaValue>({ id: '', code: '' }),
    [refreshToken, setRefreshToken] = useState(0),
    [configured, setConfigured] = useState<boolean | null>(null);
  const publicApi = useMemo(() => {
    try {
      return new Api({ server: normalizeServer(server), token: '' });
    } catch {
      return null;
    }
  }, [server]);
  const end = () => {
    sessionStorage.removeItem('love.admin.session');
    setSession(null);
    cache.removeQueries({ queryKey: ['admin'] });
  };
  const api = useMemo(() => (session ? new Api(session, end) : null), [session]);
  useEffect(() => {
    if (!publicApi) return;
    const abort = new AbortController();
    void publicApi
      .request<{ adminConfigured: boolean }>('/api/admin/status', { signal: abort.signal })
      .then((r) => setConfigured(r.adminConfigured))
      .catch(() => setConfigured(null));
    return () => abort.abort();
  }, [publicApi]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!publicApi) throw Error('请配置有效的服务器 URL');
      const result = await publicApi.post<{ token: string }>('/api/admin/login', {
        username,
        password,
        captchaId: captcha.id,
        captcha: captcha.code,
      });
      const s = { server: publicApi.session.server, token: result.token };
      sessionStorage.setItem('love.admin.session', JSON.stringify(s));
      cache.removeQueries({ queryKey: ['admin'] });
      setSession(s);
      setPassword('');
    } catch (err) {
      setError((err as Error).message);
      setRefreshToken((v) => v + 1);
    } finally {
      setBusy(false);
    }
  }
  if (!api || !session)
    return (
      <main className="min-h-dvh px-7 py-10">
        <div className="mx-auto max-w-sm">
          <a
            href="#"
            className="mb-10 inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            <ArrowLeft size={14} />
            返回用户登录
          </a>
          <span className="mb-5 block text-[10px] tracking-[.22em] text-primary">LOVE / ADMIN</span>
          <h1 className="text-3xl font-medium">服务器管理</h1>
          <p className="mt-3 mb-8 text-xs leading-6 text-muted-foreground">
            独立的管理员账号，用于管理访问、账号和存储。
          </p>
          {configured === false && (
            <p className="mb-5 rounded-xl border bg-secondary p-4 text-xs leading-6">
              管理员尚未初始化，请先按部署说明创建首位管理员。
            </p>
          )}
          <form onSubmit={login} className="space-y-4">
            <Field label="管理员用户名" id="admin-username">
              <Input
                id="admin-username"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field label="管理员密码" id="admin-password">
              <Input
                id="admin-password"
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {publicApi && (
              <CaptchaField
                api={publicApi}
                purpose="admin"
                value={captcha}
                onChange={setCaptcha}
                busy={busy}
                refreshToken={refreshToken}
              />
            )}{' '}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="h-12 w-full" disabled={busy || !captcha.id || configured === false}>
              {busy ? '登录中…' : '进入管理后台'}
            </Button>
          </form>
          <details className="server-disclosure mt-5 rounded-xl border px-4 py-3">
            <summary className="cursor-pointer text-xs">服务器设置</summary>
            <Field label="服务器地址" id="admin-server">
              <Input
                id="admin-server"
                className="mt-4"
                type="url"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                autoCapitalize="none"
                placeholder="https://love.example.com"
              />
            </Field>
          </details>
        </div>
      </main>
    );
  return <AdminWorkspace api={api} end={end} />;
}
function AdminWorkspace({ api, end }: { api: Api; end: () => void }) {
  const cache = useQueryClient(),
    [tab, setTab] = useState('overview'),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [kind, setKind] = useState<'access' | 'server' | 'audit'>('access'),
    [level, setLevel] = useState(''),
    [status, setStatus] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [filters, setFilters] = useState({ from: '', to: '' });
  const [person, setPerson] = useState<Person | null>(null),
    [pair, setPair] = useState<Pair | null>(null),
    [quota, setQuota] = useState(''),
    [create, setCreate] = useState(false),
    [busy, setBusy] = useState(false),
    [newPassword, setNewPassword] = useState(''),
    [newUser, setNewUser] = useState({
      username: '',
      name: '',
      email: '',
      password: '',
      confirmedEmail: false,
    }),
    [passwordOpen, setPasswordOpen] = useState(false),
    [adminPassword, setAdminPassword] = useState({ currentPassword: '', password: '' });
  const suffix = new URLSearchParams({ page: String(page), search });
  if (filters.from) suffix.set('from', new Date(filters.from).toISOString());
  if (filters.to) suffix.set('to', new Date(filters.to).toISOString());
  if (kind === 'server' && level) suffix.set('level', level);
  if (kind === 'access' && status) suffix.set('status', status);
  const endpoint =
    tab === 'overview'
      ? '/api/admin/overview'
      : tab === 'logs'
        ? `/api/admin/logs/${kind}?${suffix}`
        : `/api/admin/${tab}?${suffix}`;
  const query = useQuery({
    queryKey: ['admin', api.session.server, tab, kind, page, search, level, status, filters],
    queryFn: () => api.request<Overview | Page<Person> | Page<Pair> | Page<LogRow>>(endpoint),
    enabled: tab !== 'settings',
    refetchInterval: tab === 'overview' ? 30000 : false,
    retry: 1,
  });
  const refresh = () => cache.invalidateQueries({ queryKey: ['admin'] });
  async function act(
    path: string,
    body: unknown,
    method: 'post' | 'patch' = 'patch',
    success = '已更新',
  ) {
    setBusy(true);
    try {
      await api[method](path, body);
      toast.success(success);
      await refresh();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const nav = [
    ['overview', '概览', Activity],
    ['users', '账号', Users],
    ['couples', '配对与存储', HardDrive],
    ['logs', '日志', ScrollText],
    ['settings', '设置', Settings2],
  ] as const;
  const data = query.data as Page<unknown> | undefined;
  return (
    <main className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div>
            <span className="text-[10px] tracking-[.2em] text-muted-foreground">LOVE / ADMIN</span>
            <h1 className="mt-1 text-lg font-medium">服务器管理</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="修改管理员密码"
              onClick={() => setPasswordOpen(true)}
            >
              <ShieldCheck size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="刷新管理数据"
              onClick={() => void refresh()}
            >
              <RefreshCw size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="退出管理后台"
              onClick={async () => {
                try {
                  await api.post('/api/admin/logout', {});
                } finally {
                  end();
                }
              }}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
        <nav aria-label="后台导航" className="mx-auto flex max-w-6xl overflow-x-auto px-3 sm:px-6">
          {nav.map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setPage(1);
                setSearch('');
              }}
              aria-current={tab === value ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs ${tab === value ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground'}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        {tab === 'settings' ? (
          <AdminSettings api={api} />
        ) : (
          <>
            {tab !== 'overview' && (
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  className="min-w-0 flex-1 sm:max-w-md"
                  aria-label="搜索管理数据"
                  placeholder={
                    tab === 'users'
                      ? '搜索用户名、昵称或邮箱'
                      : tab === 'couples'
                        ? '搜索配对成员或空间 ID'
                        : '搜索路径、IP 或事件'
                  }
                  value={search}
                  maxLength={100}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {tab === 'users' && (
                  <Button
                    onClick={() => {
                      setNewUser({
                        username: '',
                        name: '',
                        email: '',
                        password: '',
                        confirmedEmail: false,
                      });
                      setCreate(true);
                    }}
                  >
                    <Plus size={16} />
                    创建账号
                  </Button>
                )}
              </div>
            )}
            {tab === 'logs' && (
              <Panel
                title="日志查询"
                detail="访问日志不记录查询参数、请求正文或凭据；服务日志与操作记录只保存必要的诊断信息。"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['access', '访问日志'],
                      ['server', '后台日志'],
                      ['audit', '操作记录'],
                    ].map(([value, label]) => (
                      <Button
                        key={value}
                        variant={kind === value ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setKind(value as typeof kind);
                          setPage(1);
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <form
                    className="grid gap-3 sm:grid-cols-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (from && to && from > to) {
                        toast.error('开始时间不能晚于结束时间');
                        return;
                      }
                      setFilters({ from, to });
                      setPage(1);
                    }}
                  >
                    <Field label="开始时间" id="log-from">
                      <Input
                        id="log-from"
                        type="datetime-local"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </Field>
                    <Field label="结束时间" id="log-to">
                      <Input
                        id="log-to"
                        type="datetime-local"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </Field>
                    <div className="flex items-end gap-2">
                      <Button type="submit" variant="outline">
                        应用时间
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setFrom('');
                          setTo('');
                          setFilters({ from: '', to: '' });
                          setPage(1);
                        }}
                      >
                        清除
                      </Button>
                    </div>
                  </form>
                  {kind === 'access' && (
                    <select
                      aria-label="响应状态筛选"
                      className="album-select w-full sm:w-60"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">全部响应状态</option>
                      {['2', '3', '4', '5'].map((v) => (
                        <option key={v} value={v}>
                          {v}xx
                        </option>
                      ))}
                    </select>
                  )}
                  {kind === 'server' && (
                    <select
                      aria-label="日志级别"
                      className="album-select w-full sm:w-60"
                      value={level}
                      onChange={(e) => {
                        setLevel(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">全部级别</option>
                      <option value="info">信息</option>
                      <option value="warn">警告</option>
                      <option value="error">错误</option>
                    </select>
                  )}
                </div>
              </Panel>
            )}
            {query.isPending ? (
              <Loading />
            ) : query.isError ? (
              <ErrorState error={query.error} retry={() => void query.refetch()} />
            ) : tab === 'overview' ? (
              <Dashboard data={query.data as Overview} />
            ) : tab === 'users' ? (
              <div className="space-y-3">
                {(query.data as Page<Person>).items.map((p) => (
                  <article
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 sm:p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-medium">{p.name}</h2>
                        <span
                          className={`rounded-md px-2 py-1 text-[10px] ${p.disabled ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary'}`}
                        >
                          {p.disabled ? '已停用' : p.coupleId ? '已配对' : '未配对'}
                        </span>
                      </div>
                      <p className="mt-2 break-all text-xs text-muted-foreground">
                        {p.username} · {p.email}
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        存储 {bytes(p.storageBytes)} · 最近登录 {time(p.lastLoginAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`管理${p.name}`}
                      onClick={() => {
                        setPerson(p);
                        setNewPassword('');
                      }}
                    >
                      管理
                    </Button>
                  </article>
                ))}
              </div>
            ) : tab === 'couples' ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {(query.data as Page<Pair>).items.map((p) => (
                  <article key={p.id} className="rounded-2xl border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-medium">
                          {p.members.length
                            ? p.members.map((m) => m.name).join(' 与 ')
                            : '已结束的两人空间'}
                        </h2>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {p.active ? '配对中' : '已归档'} · {p.id.slice(0, 8)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`设置${p.id}的存储配额`}
                        onClick={() => {
                          setPair(p);
                          setQuota(p.quotaMiB === null ? '' : String(p.quotaMiB));
                        }}
                      >
                        存储配额
                      </Button>
                    </div>
                    {p.members.map((m) => (
                      <p key={m.id} className="mt-3 break-all text-xs text-muted-foreground">
                        {m.username} · {m.email}
                        {m.disabled ? ' · 已停用' : ''}
                      </p>
                    ))}
                    <p className="mt-4 text-xl font-medium">
                      {bytes(p.storageBytes)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        / {`${p.effectiveQuotaMiB} MiB`}
                      </span>
                    </p>
                    {p.effectiveQuotaMiB > 0 && (
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(100, (p.storageBytes / (p.effectiveQuotaMiB * 1024 * 1024)) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    <p className="mt-3 text-[10px] text-muted-foreground">
                      {p.media} 个媒体 · {p.moments} 个回忆 · {p.messages} 条消息
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(query.data as Page<LogRow>).items.map((row) => (
                  <article key={row.id} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-1 text-[10px] ${(row.status || 0) >= 500 || row.level === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary'}`}
                        >
                          {row.status || row.level || '操作'}
                        </span>
                        <strong className="font-medium">
                          {row.method || row.event || row.action}
                        </strong>
                      </div>
                      <time className="text-[10px] text-muted-foreground">
                        {time(row.createdAt)}
                      </time>
                    </div>
                    {row.path && <p className="mt-3 break-all font-mono text-xs">{row.path}</p>}
                    {row.target && <p className="mt-2 break-all text-xs">{row.target}</p>}
                    {row.details && (
                      <pre className="mt-3 whitespace-pre-wrap break-all text-[10px] leading-5 text-muted-foreground">
                        {JSON.stringify(row.details, null, 2)}
                      </pre>
                    )}
                    {row.ip && (
                      <p className="mt-3 break-all text-[10px] text-muted-foreground">
                        {row.ip} · {row.durationMs} ms · {row.requestId?.slice(0, 8)}
                      </p>
                    )}
                    <details className="mt-2 text-[10px] text-muted-foreground">
                      <summary className="cursor-pointer">详细信息</summary>
                      <p className="mt-2 break-all leading-5">
                        {row.requestId || row.adminId || row.actorId} {row.userAgent}
                      </p>
                    </details>
                  </article>
                ))}
              </div>
            )}
            {tab !== 'overview' && data && 'items' in data && (
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {data.total} 条 · 第 {page} 页{data.total === 0 ? ' · 暂无记录' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page * data.pageSize >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        <a href="#" className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowLeft size={13} />
          返回应用
        </a>
      </div>
      <Dialog open={create} onOpenChange={setCreate}>
        <DialogContent>
          <DialogTitle>创建用户账号</DialogTitle>
          <DialogDescription>
            仅管理员建号模式下，用户无需自行注册。请先确认其邮箱归属。
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act('/api/admin/users', newUser, 'post', '账号已创建')) setCreate(false);
            }}
          >
            {[
              ['username', '新账号用户名'],
              ['name', '用户昵称'],
              ['email', '用户邮箱'],
              ['password', '初始密码'],
            ].map(([key, label]) => (
              <Field key={key} label={label} id={`create-${key}`}>
                <Input
                  id={`create-${key}`}
                  required
                  type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                  minLength={key === 'password' ? 8 : key === 'username' ? 3 : 1}
                  maxLength={key === 'username' ? 24 : key === 'name' ? 40 : 254}
                  pattern={key === 'username' ? '[a-zA-Z0-9_]{3,24}' : undefined}
                  autoComplete="off"
                  value={newUser[key as keyof Omit<typeof newUser, 'confirmedEmail'>]}
                  onChange={(e) => setNewUser((v) => ({ ...v, [key]: e.target.value }))}
                />
              </Field>
            ))}
            <label className="flex items-start gap-3 text-xs leading-6">
              <input
                type="checkbox"
                className="mt-1 accent-primary"
                required
                checked={newUser.confirmedEmail}
                onChange={(e) => setNewUser((v) => ({ ...v, confirmedEmail: e.target.checked }))}
              />
              我已确认该邮箱属于此用户
            </label>
            <DialogFooter>
              <Button disabled={busy}>创建账号</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(person)}
        onOpenChange={(v) => {
          if (!v) setPerson(null);
        }}
      >
        <DialogContent>
          <DialogTitle>管理 {person?.name}</DialogTitle>
          <DialogDescription>
            {person?.username} · {person?.email}
          </DialogDescription>
          {person && (
            <div className="space-y-5">
              <p className="text-xs leading-6 text-muted-foreground">
                创建时间 {time(person.createdAt)}
                <br />
                已用存储 {bytes(person.storageBytes)}。停用或重置密码会立即撤销登录会话。
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  variant={person.disabled ? 'outline' : 'destructive'}
                  onClick={async () => {
                    if (await act(`/api/admin/users/${person.id}`, { disabled: !person.disabled }))
                      setPerson(null);
                  }}
                >
                  {person.disabled ? '恢复账号' : '停用账号'}
                </Button>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={async () => {
                    if (
                      await act(
                        `/api/admin/users/${person.id}`,
                        { revokeSessions: true },
                        'patch',
                        '登录会话已撤销',
                      )
                    )
                      setPerson(null);
                  }}
                >
                  撤销全部会话
                </Button>
              </div>
              <form
                className="space-y-3 border-t pt-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await act(
                      `/api/admin/users/${person.id}`,
                      { password: newPassword },
                      'patch',
                      '密码已重置，会话已撤销',
                    )
                  )
                    setPerson(null);
                }}
              >
                <Field label="重置后的密码" id="reset-user-password">
                  <Input
                    id="reset-user-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Field>
                <Button disabled={busy} variant="outline">
                  重置密码并撤销会话
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(pair)}
        onOpenChange={(v) => {
          if (!v) setPair(null);
        }}
      >
        <DialogContent>
          <DialogTitle>两人空间存储配额</DialogTitle>
          <DialogDescription>
            已使用 {bytes(pair?.storageBytes || 0)}。降低配额不会删除现有文件，超额时停止新增上传。
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                pair &&
                (await act(`/api/admin/couples/${pair.id}/quota`, {
                  quotaMiB: quota === '' ? null : Number(quota),
                }))
              )
                setPair(null);
            }}
          >
            <Field label="空间上限（MiB）" id="pair-quota">
              <Input
                id="pair-quota"
                type="number"
                min={0}
                max={1000000}
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                placeholder="使用当前默认额度"
              />
            </Field>
            <p className="text-xs text-muted-foreground">留空使用默认额度，0 禁止新增上传。</p>
            <DialogFooter>
              <Button disabled={busy}>保存存储配额</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogTitle>修改管理员密码</DialogTitle>
          <DialogDescription>修改后所有管理员会话失效，需要重新登录。</DialogDescription>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act('/api/admin/password', adminPassword, 'post', '管理员密码已更新'))
                end();
            }}
          >
            <Field label="当前管理员密码" id="current-admin-password">
              <Input
                id="current-admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={adminPassword.currentPassword}
                onChange={(e) =>
                  setAdminPassword((v) => ({ ...v, currentPassword: e.target.value }))
                }
              />
            </Field>
            <Field label="新管理员密码" id="new-admin-password">
              <Input
                id="new-admin-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={adminPassword.password}
                onChange={(e) => setAdminPassword((v) => ({ ...v, password: e.target.value }))}
              />
            </Field>
            <DialogFooter>
              <Button disabled={busy}>更新管理员密码</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Dashboard({ data: d }: { data: Overview }) {
  const cards = [
    ['用户账号', d.users, `${d.disabledUsers} 个已停用 · ${d.pairedUsers} 人已配对`],
    ['配对空间', d.activeCouples, '当前两人的共同空间'],
    ['媒体存储', bytes(d.storageBytes), `${d.images} 张照片 · ${d.videos} 个视频`],
    ['24 小时访问', d.requests24h, `${d.errors24h} 次服务错误`],
    ['回忆与聊天', d.moments, `${d.messages} 条聊天消息`],
    ['后台任务', d.aiPending, `${d.aiPending} 个 AI 待处理`],
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, detail]) => (
          <section key={String(label)} className="rounded-2xl border bg-card p-6">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-4 text-3xl font-medium tracking-tight">{value}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">{detail}</p>
          </section>
        ))}
      </div>
      <Panel title="运行状态" detail="数据来自当前服务器，每 30 秒更新。">
        <dl className="grid gap-4 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">注册策略</dt>
            <dd className="mt-1.5 font-medium">{modes[d.registration]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">邮件服务</dt>
            <dd className="mt-1.5 font-medium">{d.smtpReady ? '已配置' : '尚未配置'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">服务运行</dt>
            <dd className="mt-1.5">
              {Math.floor(d.uptime / 3600)} 小时 {Math.floor((d.uptime % 3600) / 60)} 分钟 · Node{' '}
              {d.node}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">安卓本地通知</dt>
            <dd className="mt-1.5">直连服务器 · {d.notificationConnections} 个在线连接</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">日志保留</dt>
            <dd className="mt-1.5">
              {d.retentionDays} 天 · {d.aiFailed} 个 AI 任务失败
            </dd>
          </div>
        </dl>
      </Panel>
    </>
  );
}
function AdminSettings({ api }: { api: Api }) {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', api.session.server, 'settings'],
    queryFn: () => api.request<Config>('/api/admin/settings'),
  });
  const list = useQuery({
    queryKey: ['admin', api.session.server, 'allowlist'],
    queryFn: () =>
      api.request<{ email: string; note: string; createdAt: string }[]>('/api/admin/allowlist'),
  });
  const [draft, setDraft] = useState<Config | null>(null),
    [domains, setDomains] = useState(''),
    [busy, setBusy] = useState(false),
    [recipient, setRecipient] = useState(''),
    [entry, setEntry] = useState({ email: '', note: '' });
  useEffect(() => {
    if (query.data) {
      setDraft({ ...query.data, smtp: { ...query.data.smtp, password: '' } });
      setDomains(query.data.domains.join('\n'));
    }
  }, [query.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    try {
      const result = await api.patch<Config>('/api/admin/settings', {
        ...draft,
        domains: domains
          .split(/[\n,]/)
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean),
      });
      cache.setQueryData(['admin', api.session.server, 'settings'], result);
      await cache.invalidateQueries({ queryKey: ['admin', api.session.server, 'overview'] });
      toast.success('服务器设置已保存');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (query.isPending || !draft) return <Loading />;
  const smtp = (key: keyof SMTP, value: string | number | boolean) =>
    setDraft((v) => (v ? { ...v, smtp: { ...v.smtp, [key]: value } } : v));
  return (
    <>
      <form onSubmit={save} className="space-y-5">
        <Panel
          title="注册与存储"
          detail="所有自助注册都需要邮件验证和图形验证码；仅管理员建号时，注册入口会关闭。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="注册方式" id="registration-policy">
              <select
                id="registration-policy"
                className="album-select w-full"
                value={draft.registration}
                onChange={(e) =>
                  setDraft({ ...draft, registration: e.target.value as Config['registration'] })
                }
              >
                {Object.entries(modes).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="新配对默认存储上限（MiB）" id="default-quota">
              <Input
                id="default-quota"
                type="number"
                min={0}
                max={1000000}
                required
                value={draft.defaultQuotaMiB}
                onChange={(e) => setDraft({ ...draft, defaultQuotaMiB: Number(e.target.value) })}
              />
            </Field>
            <Field label="允许注册的邮箱域名" id="allowed-domains">
              <textarea
                id="allowed-domains"
                className="min-h-24 w-full rounded-xl border bg-background p-3 text-xs outline-none focus:border-ring"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="example.com，每行一个；留空不限制域名"
              />
            </Field>
            <Field label="日志保留天数" id="retention-days">
              <Input
                id="retention-days"
                type="number"
                min={7}
                max={90}
                required
                value={draft.retentionDays}
                onChange={(e) => setDraft({ ...draft, retentionDays: Number(e.target.value) })}
              />
              <p className="text-[10px] text-muted-foreground">
                7–90 天，每类日志最多保留 100000 条。默认额度用于新配对，0 禁止新增上传。
              </p>
            </Field>
          </div>
        </Panel>
        <Panel
          title="邮件服务 · SMTP"
          detail="先保存配置，再发送测试邮件。凭据加密保存；密码留空时保留已保存的值。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SMTP 主机" id="smtp-host">
              <Input
                id="smtp-host"
                value={draft.smtp.host}
                onChange={(e) => smtp('host', e.target.value)}
                placeholder="smtp.example.com"
              />
            </Field>
            <Field label="SMTP 端口" id="smtp-port">
              <Input
                id="smtp-port"
                type="number"
                min={1}
                max={65535}
                value={draft.smtp.port}
                onChange={(e) => smtp('port', Number(e.target.value))}
              />
            </Field>
            <Field label="邮件加密方式" id="smtp-security">
              <select
                id="smtp-security"
                className="album-select w-full"
                value={draft.smtp.security}
                onChange={(e) => smtp('security', e.target.value)}
              >
                <option value="starttls">STARTTLS · 常用 587 端口</option>
                <option value="tls">TLS · 常用 465 端口</option>
                <option value="plain">无加密 · 仅用于可信内网</option>
              </select>
            </Field>
            <Field label="SMTP 账号" id="smtp-user">
              <Input
                id="smtp-user"
                autoComplete="off"
                value={draft.smtp.user}
                onChange={(e) => smtp('user', e.target.value)}
              />
            </Field>
            <Field label="SMTP 密码或授权码" id="smtp-password">
              <Input
                id="smtp-password"
                type="password"
                autoComplete="new-password"
                value={draft.smtp.password || ''}
                onChange={(e) => smtp('password', e.target.value)}
                placeholder={draft.smtp.passwordConfigured ? '已保存，留空不修改' : '尚未保存'}
              />
            </Field>
            <Field label="发件邮箱" id="smtp-from">
              <Input
                id="smtp-from"
                type="email"
                value={draft.smtp.from}
                onChange={(e) => smtp('from', e.target.value)}
              />
            </Field>
            <Field label="发件人显示名称" id="smtp-name">
              <Input
                id="smtp-name"
                required
                maxLength={60}
                value={draft.smtp.senderName}
                onChange={(e) => smtp('senderName', e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-3 text-xs">
              <input
                type="checkbox"
                className="accent-primary"
                checked={Boolean(draft.smtp.clearPassword)}
                onChange={(e) => smtp('clearPassword', e.target.checked)}
              />
              清除已保存的 SMTP 密码
            </label>
          </div>
        </Panel>
        <div className="flex justify-end">
          <Button disabled={busy}>
            <Check size={16} />
            {busy ? '保存中…' : '保存服务器设置'}
          </Button>
        </div>
      </form>
      <Panel title="测试邮件">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api.post('/api/admin/smtp/test', { email: recipient });
              toast.success('测试邮件已交给 SMTP 服务器，请检查收件箱');
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            type="email"
            aria-label="测试邮件收件人"
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="测试收件邮箱"
          />
          <Button variant="outline" disabled={busy}>
            发送 SMTP 测试邮件
          </Button>
        </form>
      </Panel>
      <Panel
        title="邮箱白名单"
        detail="切换到白名单注册后，仅这些邮箱可自行创建并验证账号；也可以在账号页由管理员直接建号。"
      >
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api.post('/api/admin/allowlist', entry);
              setEntry({ email: '', note: '' });
              await list.refetch();
              toast.success('邮箱已加入白名单');
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            aria-label="白名单邮箱"
            type="email"
            required
            value={entry.email}
            onChange={(e) => setEntry((v) => ({ ...v, email: e.target.value }))}
            placeholder="邮箱地址"
          />
          <Input
            aria-label="白名单备注"
            value={entry.note}
            onChange={(e) => setEntry((v) => ({ ...v, note: e.target.value }))}
            maxLength={120}
            placeholder="备注（选填）"
          />
          <Button variant="outline" disabled={busy}>
            加入白名单
          </Button>
        </form>
        {list.isError ? (
          <ErrorState error={list.error} retry={() => void list.refetch()} />
        ) : (
          <ul className="mt-5 divide-y">
            {list.data?.map((row) => (
              <li key={row.email} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="break-all text-xs">{row.email}</p>
                  <p className="mt-1 break-all text-[10px] text-muted-foreground">
                    {row.note || '无备注'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`移除白名单${row.email}`}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api.request('/api/admin/allowlist', {
                        method: 'DELETE',
                        body: JSON.stringify({ email: row.email }),
                      });
                      await list.refetch();
                    } catch (err) {
                      toast.error((err as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  移除
                </Button>
              </li>
            ))}
          </ul>
        )}
        {list.data?.length === 0 && (
          <p className="mt-5 text-xs text-muted-foreground">白名单为空。</p>
        )}
      </Panel>
    </>
  );
}
