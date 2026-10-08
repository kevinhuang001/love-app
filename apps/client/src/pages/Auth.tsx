import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Server, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaptchaField, type CaptchaValue } from '@/components/CaptchaField';
import { Api, defaultServer, normalizeServer } from '@/lib/api';
import type { Session } from '@/lib/types';
export type AuthConfig = {
  registration: 'closed' | 'email' | 'whitelist';
  registrationAvailable: boolean;
  mailAvailable: boolean;
};
export function Auth({ onSession }: { onSession: (session: Session) => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login'),
    [server, setServer] = useState(localStorage.getItem('love.server') || defaultServer()),
    [config, setConfig] = useState<AuthConfig | null>(null);
  const [username, setUsername] = useState(''),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [visible, setVisible] = useState(false),
    [code, setCode] = useState(''),
    [verificationId, setVerificationId] = useState(''),
    [cooldown, setCooldown] = useState(0),
    [captcha, setCaptcha] = useState<CaptchaValue>({ id: '', code: '' }),
    [refreshToken, setRefreshToken] = useState(0),
    [notice, setNotice] = useState('');
  const { api, serverError } = useMemo(() => {
    try {
      return { api: new Api({ server: normalizeServer(server), token: '' }), serverError: '' };
    } catch (error) {
      return { api: null, serverError: (error as Error).message };
    }
  }, [server]);
  useEffect(() => {
    setConfig(null);
    setVerificationId('');
    const abort = new AbortController();
    const timer = setTimeout(() => {
      if (api)
        void api
          .request<AuthConfig>('/api/auth/config', { signal: abort.signal })
          .then(setConfig)
          .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [api]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  function changeMode(value: 'login' | 'register' | 'reset') {
    setMode(value);
    setError('');
    setNotice('');
    setVerificationId('');
    setCode('');
    setRefreshToken((v) => v + 1);
  }
  async function sendCode() {
    setBusy(true);
    setError('');
    try {
      if (!api) throw Error('请在最下面配置有效的服务器 URL');
      const r = await api.post<{ verificationId: string; retryAfter: number }>(
        '/api/auth/email-code',
        {
          email,
          purpose: mode === 'reset' ? 'reset' : 'register',
          captchaId: captcha.id,
          captcha: captcha.code,
        },
      );
      setVerificationId(r.verificationId);
      setCooldown(r.retryAfter);
      setNotice('验证码已发送，请查看邮箱（也请检查垃圾邮件）。');
    } catch (err) {
      setError((err as Error).message);
      setRefreshToken((v) => v + 1);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!api) throw Error('请在最下面配置有效的服务器 URL');
      if (mode === 'reset') {
        await api.post('/api/auth/reset-password', { email, password, verificationId, code });
        changeMode('login');
        setNotice('密码已更新，请使用新密码登录。');
        return;
      }
      const result = await api.post<{ token: string }>(`/api/auth/${mode}`, {
        username,
        password,
        ...(mode === 'register'
          ? { name, email, verificationId, code }
          : { captchaId: captcha.id, captcha: captcha.code }),
      });
      localStorage.setItem('love.server', api.session.server);
      await onSession({ server: api.session.server, token: result.token });
    } catch (err) {
      setError((err as Error).message);
      if (mode === 'login') setRefreshToken((v) => v + 1);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page min-h-dvh px-7 py-10 sm:py-16">
      <div className="mx-auto max-w-sm">
        <div className="auth-heading mb-8">
          <div className="mb-8 flex items-center justify-between">
            <span className="wordmark">
              love
              <span className="brand-dot" />
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground">两人空间</span>
          </div>
          <h1 className="text-[28px] font-medium leading-snug tracking-tight">
            {mode === 'login'
              ? '好久不见。'
              : mode === 'register'
                ? '从这里，开始。'
                : '找回你的账号。'}
          </h1>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            {mode === 'reset'
              ? '验证邮箱后设置新密码。'
              : mode === 'register'
                ? '用你自己的邮箱创建账号，验证后就能进入。'
                : '登录后，回到你们的聊天和共同生活。'}
          </p>
        </div>
        {mode !== 'reset' && (
          <Tabs value={mode} onValueChange={(v) => changeMode(v as 'login' | 'register')}>
            <TabsList className="auth-tabs mb-6 w-full">
              <TabsTrigger className="flex-1" value="login">
                欢迎回来
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="register">
                创建账号
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {mode === 'register' && config && !config.registrationAvailable ? (
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-medium">暂未开放自助注册</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              请联系管理员创建账号，或等待服务器开放邮箱注册。
            </p>
            <Button variant="outline" className="mt-4" onClick={() => changeMode('login')}>
              返回登录
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={mode === 'login' ? 254 : 24}
                  pattern={mode === 'register' ? '[a-zA-Z0-9_]{3,24}' : undefined}
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder={mode === 'login' ? '用户名或已验证邮箱' : '字母、数字或下划线'}
                />
              </div>
            )}
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">怎么称呼你</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  required
                  autoComplete="nickname"
                  placeholder="你的昵称"
                />
              </div>
            )}
            {mode !== 'login' && (
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setVerificationId('');
                    setNotice('');
                  }}
                  required
                  maxLength={254}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@example.com"
                />
                {mode === 'register' && config?.registration === 'whitelist' && (
                  <p className="text-[10px] text-muted-foreground">
                    此服务器仅接受白名单邮箱注册。
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">{mode === 'reset' ? '新密码' : '密码'}</Label>
              <div className="relative">
                <Input
                  className="pr-11"
                  id="password"
                  type={visible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'login' ? 1 : 8}
                  maxLength={128}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="至少 8 位"
                />
                <button
                  type="button"
                  aria-label={visible ? '隐藏密码' : '显示密码'}
                  onClick={() => setVisible(!visible)}
                  className="absolute inset-y-0 right-3 text-muted-foreground"
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {api && (mode === 'login' || !verificationId) && (
              <CaptchaField
                api={api}
                purpose={mode}
                value={captcha}
                onChange={setCaptcha}
                busy={busy}
                refreshToken={refreshToken}
              />
            )}
            {mode !== 'login' && (
              <div className="space-y-3">
                {!verificationId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={
                      busy || !api || !captcha.id || !captcha.code || !email || cooldown > 0
                    }
                    onClick={() => void sendCode()}
                  >
                    {cooldown ? `${cooldown} 秒后重试` : '发送邮件验证码'}
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email-code">邮件验证码</Label>
                      <Input
                        id="email-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        pattern="[0-9]{6}"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="邮件中的 6 位数字"
                      />
                    </div>
                    <button
                      type="button"
                      className="text-xs text-primary"
                      disabled={busy || cooldown > 0}
                      onClick={() => {
                        setVerificationId('');
                        setRefreshToken((v) => v + 1);
                      }}
                    >
                      {cooldown ? `${cooldown} 秒后可重新发送` : '重新获取邮件验证码'}
                    </button>
                  </>
                )}
              </div>
            )}
            {notice && (
              <p role="status" className="text-xs leading-6 text-primary">
                {notice}
              </p>
            )}
            {(serverError || error) && (
              <p role="alert" className="text-sm text-destructive">
                {serverError || error}
              </p>
            )}
            <Button
              type="submit"
              disabled={busy || !api || (mode === 'login' ? !captcha.id : !verificationId)}
              className="mt-3 h-12 w-full"
            >
              {busy
                ? '处理中…'
                : mode === 'login'
                  ? '进入我们的空间'
                  : mode === 'register'
                    ? '开始我们的故事'
                    : '更新密码'}
              <ArrowRight size={16} />
            </Button>
          </form>
        )}
        {mode === 'login' && (
          <button
            className="mt-4 w-full text-center text-xs text-muted-foreground"
            onClick={() => changeMode('reset')}
          >
            忘记密码？
          </button>
        )}
        {mode === 'reset' && (
          <button
            className="mt-4 w-full text-center text-xs text-muted-foreground"
            onClick={() => changeMode('login')}
          >
            返回登录
          </button>
        )}
        <details className="server-disclosure mt-5 rounded-xl border px-4 py-3">
          <summary className="flex cursor-pointer items-center justify-between text-xs font-medium">
            <span>服务器设置</span>
            <span className="server-summary text-[11px] font-normal text-muted-foreground">
              点击配置 URL
            </span>
          </summary>
          <div className="pt-4">
            <div className="space-y-2">
              <Label htmlFor="server">
                <Server size={14} /> 服务器地址
              </Label>
              <Input
                id="server"
                type="url"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="https://love.example.com"
                autoCapitalize="none"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">你和另一半需要连接同一台服务器。</p>
              <p className="text-xs leading-6 text-muted-foreground">
                支持 http://IP:端口 或 https://域名。HTTP 连接未加密，公网建议使用 HTTPS。
              </p>
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}
