import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Link2, Bell, Moon, LogOut, Sparkles, Camera, Server, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '@/lib/context';
import { enablePush, disablePush } from '@/lib/push';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar } from '@/components/common';
type AISettings = {
  baseUrl: string;
  model: string;
  enabled: boolean;
  hasKey: boolean;
  name: string;
  avatar: import('@/lib/types').Media | null;
};
export function Us({ logout, onChat }: { logout: () => Promise<void>; onChat: () => void }) {
  const { api, profile } = useApp(),
    cache = useQueryClient();
  const [name, setName] = useState(profile.user.name),
    [code, setCode] = useState(''),
    [invite, setInvite] = useState(''),
    [inviteExpiry, setInviteExpiry] = useState(0),
    [busy, setBusy] = useState(false),
    [unpair, setUnpair] = useState(false),
    [signout, setSignout] = useState(false),
    [push, setPush] = useState(localStorage.getItem('love.push.enabled') === 'true'),
    [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const [aiUrl, setAiUrl] = useState(''),
    [model, setModel] = useState(''),
    [apiKey, setApiKey] = useState(''),
    [aiEnabled, setAiEnabled] = useState(false);
  const avatarFile = useRef<HTMLInputElement>(null),
    aiAvatarFile = useRef<HTMLInputElement>(null);
  const [aiName, setAiName] = useState(profile.ai.name);
  const config = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => api.request<AISettings>('/api/ai/settings'),
  });
  useEffect(() => {
    if (config.data) {
      setAiUrl(config.data.baseUrl);
      setModel(config.data.model);
      setAiEnabled(config.data.enabled);
      setAiName(config.data.name);
    }
  }, [config.data]);
  useEffect(() => setName(profile.user.name), [profile.user.name]);
  async function action(fn: () => Promise<unknown>, message?: string) {
    setBusy(true);
    try {
      await fn();
      await cache.invalidateQueries({ queryKey: ['profile'] });
      if (message) toast.success(message);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page-scroll page-enter settings-page space-y-5 p-5 sm:p-8">
      <div className="profile-heading flex items-center gap-5 py-2">
        <button
          aria-label="修改头像"
          className="relative shrink-0"
          disabled={busy}
          onClick={() => avatarFile.current?.click()}
        >
          {profile.user.avatar ? (
            <img
              alt="你的头像"
              src={api.url(profile.user.avatar.thumbnailUrl)}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <Avatar name={profile.user.name} large />
          )}
          <span className="absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <Camera size={13} />
          </span>
        </button>
        <input
          type="file"
          hidden
          ref={avatarFile}
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void action(async () => {
                const media = await api.upload(file, () => {});
                await api.patch('/api/me', { avatarMediaId: media.id });
              }, '头像已更新');
            e.target.value = '';
          }}
        />
        <div>
          <p className="text-[11px] text-muted-foreground">个人资料</p>
          <h2 className="mt-1 text-2xl font-medium">{profile.user.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">@{profile.user.username}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            className="mt-2 h-7 px-0 text-xs text-primary"
            onClick={() => avatarFile.current?.click()}
          >
            {busy ? '保存中…' : '更换头像'}
          </Button>
        </div>
      </div>
      <Card className="gap-4 p-5">
        <div className="flex items-center gap-2 font-medium">
          <Link2 size={18} className="text-primary" />
          {profile.partner ? '已经找到你' : '连接另一半'}
        </div>
        {profile.partner ? (
          <>
            <div className="flex items-center gap-3">
              {profile.partner.avatar ? (
                <img
                  alt="另一半头像"
                  className="size-10 rounded-full object-cover"
                  src={api.url(profile.partner.avatar.thumbnailUrl)}
                />
              ) : (
                <Avatar name={profile.partner.name} />
              )}
              <div>
                <p className="text-sm">{profile.partner.name}</p>
                <p className="text-xs text-muted-foreground">已连接到同一个空间</p>
              </div>
              <Check size={18} className="ml-auto text-primary" />
            </div>
            <Button
              variant="ghost"
              className="h-auto justify-start p-0 text-xs text-muted-foreground"
              onClick={() => setUnpair(true)}
            >
              管理配对关系
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs leading-6 text-muted-foreground">
              生成邀请码发给另一半，或输入对方的邀请码。有效期 10 分钟。
            </p>
            {invite && (
              <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3">
                <span className="font-mono tracking-widest">{invite}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="复制邀请码"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(invite);
                      toast.success('邀请码已复制');
                    } catch {
                      toast.error('请手动复制邀请码');
                    }
                  }}
                >
                  <Copy size={16} />
                </Button>
              </div>
            )}
            {invite && (
              <p className="text-xs text-muted-foreground">
                有效至{' '}
                {new Date(inviteExpiry).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  const result = await api.post<{ code: string; expiresAt: number }>(
                    '/api/pairing/invite',
                    {},
                  );
                  setInvite(result.code);
                  setInviteExpiry(result.expiresAt);
                })
              }
            >
              生成我的邀请码
            </Button>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void action(() => api.post('/api/pairing/join', { code }), '配对成功，开始聊天吧');
              }}
            >
              <Input
                aria-label="另一半的邀请码"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="输入 12 位邀请码"
                minLength={12}
                maxLength={12}
                required
              />
              <Button type="submit" disabled={busy}>
                连接
              </Button>
            </form>
          </>
        )}
      </Card>
      <Card className="gap-4 p-5">
        <h3 className="font-medium">个人资料</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(() => api.patch('/api/me', { name }), '昵称已更新');
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="profile-name">昵称</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
            />
          </div>
          <Button variant="outline" type="submit" disabled={busy}>
            保存
          </Button>
        </form>
        <div className="flex items-center justify-between border-t pt-4">
          <Label htmlFor="dark">
            <Moon size={16} />
            深色模式
          </Label>
          <Switch
            id="dark"
            checked={dark}
            onCheckedChange={(value) => {
              setDark(value);
              document.documentElement.classList.toggle('dark', value);
              localStorage.setItem('love.theme', value ? 'dark' : 'light');
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="push">
              <Bell size={16} />
              聊天通知
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {Capacitor.isNativePlatform() ? '安卓后台新消息通知' : '后台推送请使用安卓 APK'}
            </p>
          </div>
          <Switch
            id="push"
            checked={push}
            disabled={!Capacitor.isNativePlatform() || busy}
            onCheckedChange={(value) =>
              void action(async () => {
                if (value)
                  await enablePush(api, onChat, (message) => {
                    toast.error(message);
                    setPush(false);
                  });
                else {
                  await disablePush(api);
                  localStorage.removeItem('love.push.enabled');
                }
                setPush(value);
              })
            }
          />
        </div>
      </Card>
      <Card className="gap-4 p-5">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles size={18} className="text-primary" />
          AI 助手
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          在聊天中 @{profile.ai.name}，管理日期、待办和相册。消息及附件 ID 会发送给你配置的 AI
          服务。
        </p>
        <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
          <button
            type="button"
            disabled={busy}
            aria-label="更换 AI 头像"
            className="shrink-0 rounded-full"
            onClick={() => aiAvatarFile.current?.click()}
          >
            {profile.ai.avatar ? (
              <img
                alt="AI 头像"
                src={api.url(profile.ai.avatar.thumbnailUrl)}
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-14 place-items-center rounded-full border border-primary/20 bg-card text-primary">
                <Sparkles size={23} />
              </span>
            )}
          </button>
          <div>
            <p className="text-sm font-medium">{profile.ai.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              点击头像更换 · 在聊天里 @{profile.ai.name}
            </p>
          </div>
        </div>
        <input
          ref={aiAvatarFile}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void action(async () => {
                const media = await api.upload(file, () => {});
                await api.patch('/api/ai/profile', {
                  name: profile.ai.name,
                  avatarMediaId: media.id,
                });
                await cache.invalidateQueries({ queryKey: ['ai-settings'] });
              }, 'AI 头像已更新');
            e.target.value = '';
          }}
        />
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              await api.patch('/api/ai/profile', { name: aiName });
              await cache.invalidateQueries({ queryKey: ['ai-settings'] });
            }, 'AI 名称已更新');
          }}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="ai-name">AI 名称</Label>
            <Input
              id="ai-name"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              maxLength={24}
              required
              pattern="[^\s@]+"
            />
            <p className="text-[11px] text-muted-foreground">不含空格或 @，最多 24 个字符。</p>
          </div>
          <Button type="submit" variant="outline" disabled={busy}>
            保存 AI 名称
          </Button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              await api.post('/api/ai/settings', {
                baseUrl: aiUrl,
                model,
                enabled: aiEnabled,
                ...(apiKey ? { apiKey } : {}),
              });
              setApiKey('');
              await cache.invalidateQueries({ queryKey: ['ai-settings'] });
            }, 'AI 配置已保存');
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="ai-url">AI 服务 URL</Label>
            <Input
              id="ai-url"
              type="url"
              value={aiUrl}
              onChange={(e) => setAiUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-model">模型名称</Label>
            <Input
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="服务支持的模型 ID"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-key">API Key</Label>
            <Input
              id="ai-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              placeholder={config.data?.hasKey ? '已保存；留空保持现有密钥' : '无鉴权服务可留空'}
            />
            <p className="text-[11px] text-muted-foreground">
              密钥加密保存在你的服务器，不会返回到客户端。
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-enabled">开启 @{profile.ai.name}（兼容 @ai）</Label>
            <Switch id="ai-enabled" checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
          <Button
            variant="outline"
            className="w-full"
            type="submit"
            disabled={busy || config.isPending}
          >
            保存 AI 配置
          </Button>
        </form>
        {config.isError && (
          <p role="alert" className="text-xs text-destructive">
            AI 配置加载失败，请刷新后重试
          </p>
        )}
      </Card>
      <div className="px-1">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Server size={14} />
          <span className="truncate">{api.session.server}</span>
        </p>
        <Button
          variant="ghost"
          className="mt-3 h-auto px-0 text-muted-foreground"
          onClick={() => setSignout(true)}
        >
          <LogOut size={15} />
          退出登录 / 切换服务器
        </Button>
      </div>
      <p className="pb-4 text-center text-[10px] tracking-widest text-muted-foreground">
        love · 两个人的生活
      </p>
      <Dialog open={unpair} onOpenChange={setUnpair}>
        <DialogContent>
          <DialogTitle>解除配对？</DialogTitle>
          <DialogDescription>
            你们将离开当前共享空间。重新配对会创建新的空间，旧记录不会自动合并，也不会删除数据库中的历史记录。
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpair(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  await api.delete('/api/pairing');
                  setUnpair(false);
                  cache.removeQueries({ queryKey: ['messages'] });
                }, '配对已解除')
              }
            >
              解除配对
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={signout} onOpenChange={setSignout}>
        <DialogContent>
          <DialogTitle>退出当前账号？</DialogTitle>
          <DialogDescription>
            可以在登录界面选择另一台服务器。待发送消息仍保留在此设备中。
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignout(false)}>
              取消
            </Button>
            <Button disabled={busy} onClick={() => void action(logout)}>
              退出登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
