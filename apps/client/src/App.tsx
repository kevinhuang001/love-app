import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { Heart, MessageCircle, Images, CalendarDays, UsersRound, ListTodo } from 'lucide-react';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast, Toaster } from 'sonner';
import { Api, readSession, saveSession } from './lib/api';
import { AppContext } from './lib/context';
import {
  clearNotificationListener,
  disableNotifications,
  enableNotifications,
  notificationStatus,
} from './lib/notifications';
import type { Profile, Session, Message } from './lib/types';
import { AdminPortal } from './pages/Admin';
import { Auth } from './pages/Auth';
import { Chat } from './pages/Chat';
import { Memories } from './pages/Memories';
import { Dates } from './pages/Dates';
import { Todos } from './pages/Todos';
import { Us } from './pages/Us';
import { Loading, ErrorState } from './components/common';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
function Space({ session, end }: { session: Session; end: () => Promise<void> }) {
  const cache = useQueryClient(),
    [tab, setTab] = useState('chat'),
    [socket, setSocket] = useState<Socket | null>(null),
    [connected, setConnected] = useState(false),
    [unread, setUnread] = useState(0);
  const api = useMemo(
    () =>
      new Api(session, () => {
        void end();
      }),
    [session, end],
  );
  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.request<Profile>('/api/me'),
    refetchInterval: 30_000,
    retry: 1,
  });
  useEffect(() => {
    const connection = io(session.server, {
      auth: { token: session.token },
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 5000,
    });
    setSocket(connection);
    const reconnect = () => {
      setConnected(true);
      void cache.invalidateQueries();
    };
    connection.on('connect', reconnect);
    connection.on('disconnect', () => setConnected(false));
    connection.on('message:new', (message: Message) => {
      void cache.invalidateQueries({ queryKey: ['messages'] });
      if (message.senderId !== profile.data?.user.id || message.role === 'assistant')
        setUnread((count) => count + 1);
    });
    connection.on('message:read', () => void cache.invalidateQueries({ queryKey: ['messages'] }));
    connection.on('profile:changed', () => {
      void cache.invalidateQueries({ queryKey: ['profile'] });
      void cache.invalidateQueries({ queryKey: ['ai-settings'] });
    });
    connection.on('todos:changed', () => void cache.invalidateQueries({ queryKey: ['todos'] }));
    connection.on('moments:changed', () => void cache.invalidateQueries({ queryKey: ['moments'] }));
    connection.on(
      'anniversaries:changed',
      () => void cache.invalidateQueries({ queryKey: ['anniversaries'] }),
    );
    connection.on('connect_error', (err) => {
      setConnected(false);
      if (err.message === '登录已过期') void end();
    });
    const visible = () => {
      if (document.visibilityState === 'visible') {
        connection.connect();
        void cache.invalidateQueries();
      }
    };
    document.addEventListener('visibilitychange', visible);
    let cleanupNative: (() => void) | undefined;
    if (Capacitor.isNativePlatform())
      void NativeApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          connection.connect();
          void cache.invalidateQueries();
        }
      }).then((handle) => {
        cleanupNative = () => {
          void handle.remove();
        };
      });
    return () => {
      connection.disconnect();
      document.removeEventListener('visibilitychange', visible);
      cleanupNative?.();
    };
  }, [session, cache, end, profile.data?.user.id]);
  useEffect(() => {
    if (tab === 'chat') setUnread(0);
  }, [tab, unread]);
  const paired = Boolean(profile.data?.couple && profile.data.partner);
  useEffect(() => {
    if (!profile.data) return;
    if (!paired) {
      setTab('us');
      setUnread(0);
      for (const key of ['messages', 'moments', 'anniversaries', 'todos', 'ai-settings'])
        cache.removeQueries({ queryKey: [key] });
    }
    if (Capacitor.isNativePlatform()) {
      let active = true;
      void notificationStatus()
        .then(async (state) => {
          if (!active) return;
          if (!paired) await disableNotifications();
          else if (state.enabled)
            await enableNotifications(api, profile.data!, () => {
              setTab('chat');
              void cache.invalidateQueries();
            });
        })
        .catch((error) => toast.error(error.message));
      return () => {
        active = false;
        void clearNotificationListener();
      };
    }
  }, [api, paired, profile.data?.user.id, profile.data?.couple?.id, cache]);
  async function logout() {
    await disableNotifications();
    try {
      await api.post('/api/auth/logout', {});
    } finally {
      await end();
    }
  }
  if (profile.isPending) return <Loading />;
  if (profile.isError)
    return (
      <div className="mx-auto max-w-sm pt-12">
        <ErrorState error={profile.error} retry={() => void profile.refetch()} />
        <Button variant="ghost" className="mx-auto block" onClick={() => void end()}>
          返回登录
        </Button>
      </div>
    );
  return (
    <AppContext.Provider
      value={{ api, profile: profile.data, socket, connected, openUs: () => setTab('us') }}
    >
      <Tabs value={tab} onValueChange={setTab} className="app-shell gap-0">
        {(!paired || tab !== 'chat') && (
          <header className="app-bar flex shrink-0 items-center justify-between px-6 py-4">
            <h1 className="wordmark">
              love
              <span className="brand-dot" />
            </h1>
            <span className="text-[11px] text-muted-foreground">两个人的生活</span>
          </header>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          {!paired ? (
            <Us logout={logout} onChat={() => setTab('chat')} />
          ) : tab === 'chat' ? (
            <Chat key={profile.data.user.coupleId} />
          ) : tab === 'memories' ? (
            <Memories />
          ) : tab === 'dates' ? (
            <Dates />
          ) : tab === 'todos' ? (
            <Todos />
          ) : (
            <Us logout={logout} onChat={() => setTab('chat')} />
          )}
        </div>
        {paired && (
          <nav aria-label="主导航" className="bottom-nav shrink-0 border-t bg-card">
            <TabsList className="grid h-16 group-data-[orientation=horizontal]/tabs:h-16 w-full grid-cols-5 rounded-none bg-transparent p-1">
              {[
                ['chat', '聊天', MessageCircle],
                ['memories', '回忆', Images],
                ['dates', '纪念日', CalendarDays],
                ['todos', 'To Do', ListTodo],
                ['us', '我们', UsersRound],
              ].map(([value, label, Icon]) => {
                const Glyph = Icon as typeof MessageCircle;
                return (
                  <TabsTrigger
                    key={value as string}
                    value={value as string}
                    className="relative flex h-full flex-col gap-1.5 rounded-none border-0 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <Glyph className="size-5" size={20} strokeWidth={tab === value ? 2 : 1.6} />
                    <span className="text-[10px]">{label as string}</span>
                    {value === 'chat' && unread > 0 && (
                      <span className="absolute top-1 right-1/4 rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </nav>
        )}
      </Tabs>
    </AppContext.Provider>
  );
}
export default function App() {
  const [adminRoute, setAdminRoute] = useState(window.location.hash === '#admin');
  useEffect(() => {
    const change = () => setAdminRoute(window.location.hash === '#admin');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(false),
    cache = useQueryClient();
  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      localStorage.getItem('love.theme') === 'dark',
    );
    void readSession().then((value) => {
      setSession(value);
      setReady(true);
    });
  }, []);
  const end = useMemo(
    () => async () => {
      await disableNotifications();
      await saveSession(null);
      setSession(null);
      cache.clear();
    },
    [cache],
  );
  return (
    <>
      {adminRoute ? (
        <AdminPortal />
      ) : !ready ? (
        <Loading />
      ) : session ? (
        <Space session={session} end={end} />
      ) : (
        <Auth
          onSession={async (value) => {
            await saveSession(value);
            cache.clear();
            setSession(value);
          }}
        />
      )}
      <Toaster position="top-center" duration={2600} toastOptions={{ className: 'love-toast' }} />
    </>
  );
}
