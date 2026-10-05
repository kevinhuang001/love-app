import { useState } from 'react';
import { ArrowRight, Server, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Api, defaultServer, normalizeServer } from '@/lib/api';
import type { Session } from '@/lib/types';
export function Auth({ onSession }: { onSession: (session: Session) => Promise<void> }) {
  const [mode, setMode] = useState('login'),
    [server, setServer] = useState(localStorage.getItem('love.server') || defaultServer());
  const [username, setUsername] = useState(''),
    [name, setName] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [visible, setVisible] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const origin = normalizeServer(server);
      const api = new Api({ server: origin, token: '' });
      const result = await api.post<{ token: string }>(`/api/auth/${mode}`, {
        username,
        password,
        ...(mode === 'register' ? { name } : {}),
      });
      localStorage.setItem('love.server', origin);
      await onSession({ server: origin, token: result.token });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page min-h-dvh px-7 py-10 sm:py-16">
      <div className="mx-auto max-w-sm">
        <div className="auth-heading mb-9">
          <div className="mb-10 flex items-center justify-between">
            <span className="wordmark">
              love
              <span className="brand-dot" />
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground">两人空间</span>
          </div>
          <h1 className="text-[28px] font-medium leading-snug tracking-tight">
            {mode === 'login' ? '好久不见。' : '从这里，开始。'}
          </h1>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            登录后，回到你们的聊天和共同生活。
          </p>
        </div>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value);
            setError('');
          }}
        >
          <TabsList className="auth-tabs mb-6 w-full">
            <TabsTrigger className="flex-1" value="login">
              欢迎回来
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="register">
              创建账号
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={submit} className="space-y-4">
          <details className="server-disclosure rounded-xl border px-4 py-3">
            <summary className="flex cursor-pointer items-center justify-between text-xs font-medium">
              <span>服务器设置</span>
              <span className="server-summary text-[11px] font-normal text-muted-foreground">
                点击配置 URL
              </span>
            </summary>
            <div className="pt-4">
              {' '}
              <div className="space-y-2">
                <Label htmlFor="server">
                  <Server size={14} /> 服务器地址
                </Label>
                <Input
                  id="server"
                  type="url"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  required
                  placeholder="https://love.example.com"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">你和另一半需要连接同一台服务器。</p>
              </div>
            </div>
          </details>
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_]{3,24}"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="字母、数字或下划线"
            />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                className="pr-11"
                id="password"
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="mt-3 h-12 w-full">
            {busy ? '连接中…' : mode === 'login' ? '进入我们的空间' : '开始我们的故事'}
            <ArrowRight size={16} />
          </Button>
        </form>
        <p className="mt-7 text-center text-[11px] text-muted-foreground">
          与你的另一半连接同一台服务器
        </p>
      </div>
    </main>
  );
}
