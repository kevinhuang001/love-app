import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  Paperclip,
  Send,
  X,
  Sparkles,
  Check,
  CheckCheck,
  WifiOff,
  LoaderCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import type { Message, Media } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, Empty, MediaPreview, Loading, ErrorState } from '@/components/common';
type Pending = {
  clientId: string;
  content: string;
  mediaId?: string;
  media?: Media;
  failed?: boolean;
};
export function Chat() {
  const { api, profile, socket, connected, openUs } = useApp(),
    cache = useQueryClient();
  const key = `love.outbox:${api.session.server}:${profile.user.id}:${profile.user.coupleId}`;
  const [text, setText] = useState(''),
    [attachment, setAttachment] = useState<Media | null>(null),
    [uploading, setUploading] = useState<number | null>(null),
    [sending, setSending] = useState(false),
    [typing, setTyping] = useState(false);
  const [pending, setPending] = useState<Pending[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  });
  const file = useRef<HTMLInputElement>(null),
    scroller = useRef<HTMLDivElement>(null),
    bottom = useRef<HTMLDivElement>(null),
    typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    lock = useRef(false),
    autoScroll = useRef(true);
  const query = useInfiniteQuery({
    queryKey: ['messages', profile.user.coupleId],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) =>
      api.request<{ items: Message[]; hasMore: boolean }>(
        `/api/messages${pageParam ? `?before=${pageParam}` : ''}`,
      ),
    getNextPageParam: (last) => (last.hasMore ? last.items[0]?.id : undefined),
    enabled: Boolean(profile.couple),
    refetchInterval: 300_000,
  });
  const messages =
    query.data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.items) || [];
  const unique = [...new Map(messages.map((message) => [message.id, message])).values()].sort(
    (a, b) => a.id - b.id,
  );
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(pending));
  }, [key, pending]);
  useEffect(() => {
    if (!socket) return;
    const onTyping = () => {
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3500);
    };
    socket.on('typing', onTyping);
    return () => {
      socket.off('typing', onTyping);
      clearTimeout(typingTimer.current);
    };
  }, [socket]);
  useEffect(() => {
    if (autoScroll.current) bottom.current?.scrollIntoView({ behavior: 'instant' });
  }, [unique.length, pending.length, typing]);
  const lastId = unique.at(-1)?.id;
  useEffect(() => {
    const mark = () => {
      if (lastId && document.visibilityState === 'visible')
        void api.post('/api/messages/read', { throughId: lastId }).catch(() => {});
    };
    mark();
    document.addEventListener('visibilitychange', mark);
    return () => document.removeEventListener('visibilitychange', mark);
  }, [api, lastId]);
  async function deliver(item: Pending) {
    if (lock.current) return;
    lock.current = true;
    setSending(true);
    try {
      await api.post<Message>('/api/messages', {
        clientId: item.clientId,
        content: item.content,
        ...(item.mediaId ? { mediaId: item.mediaId } : {}),
      });
      setPending((items) => items.filter((entry) => entry.clientId !== item.clientId));
      await cache.invalidateQueries({ queryKey: ['messages'] });
    } catch (err) {
      setPending((items) =>
        items.map((entry) =>
          entry.clientId === item.clientId ? { ...entry, failed: true } : entry,
        ),
      );
      toast.error((err as Error).message);
    } finally {
      lock.current = false;
      setSending(false);
    }
  }
  useEffect(() => {
    if (connected && pending.length && !lock.current) void deliver(pending[0]);
    // Retry stored messages on reconnect; failed messages stay available for manual retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if ((!text.trim() && !attachment) || sending || uploading !== null) return;
    if (pending.length >= 100) {
      toast.error('请先处理待发送的消息');
      return;
    }
    const item: Pending = {
      clientId: crypto.randomUUID(),
      content: text.trim(),
      ...(attachment ? { mediaId: attachment.id, media: attachment } : {}),
    };
    setPending((items) => [...items, item]);
    setText('');
    setAttachment(null);
    autoScroll.current = true;
    await deliver(item);
  }
  async function attach(value?: File) {
    if (!value) return;
    setUploading(0);
    try {
      setAttachment(await api.upload(value, setUploading));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(null);
      if (file.current) file.current.value = '';
    }
  }
  if (!profile.partner)
    return (
      <Empty
        title="想说的话，都留在这里"
        detail="与另一半配对后，就可以实时聊天、分享照片和视频。"
        action={<Button onClick={openUs}>连接另一半</Button>}
      />
    );
  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="聊天">
      <div className="flex items-center gap-3 border-b bg-card px-5 py-3">
        {profile.partner.avatar ? (
          <img
            alt="另一半头像"
            src={api.url(profile.partner.avatar.thumbnailUrl)}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <Avatar name={profile.partner.name} />
        )}
        <div>
          <h2 className="text-sm font-semibold">{profile.partner.name}</h2>
          <p className="text-xs text-muted-foreground">
            {typing ? '正在输入…' : connected ? '我们的私密对话' : '连接中 · 消息可重试'}
          </p>
        </div>
        <span
          className={`ml-auto size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}
          aria-label={connected ? '实时连接正常' : '实时连接中'}
        />
      </div>
      {!connected && (
        <div className="flex items-center justify-center gap-2 bg-secondary py-2 text-xs text-muted-foreground">
          <WifiOff size={13} />
          网络中断时，待发送消息会保留
        </div>
      )}
      <div
        ref={scroller}
        className="chat-scroll px-4 py-5 sm:px-8"
        onScroll={() => {
          const node = scroller.current;
          if (node)
            autoScroll.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100;
        }}
      >
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : (
          <>
            {query.hasNextPage && (
              <div className="mb-6 text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={query.isFetchingNextPage}
                  onClick={async () => {
                    const node = scroller.current,
                      height = node?.scrollHeight || 0;
                    autoScroll.current = false;
                    await query.fetchNextPage();
                    requestAnimationFrame(() => {
                      if (node) node.scrollTop = node.scrollHeight - height;
                    });
                  }}
                >
                  {query.isFetchingNextPage ? '加载中…' : '查看更早的消息'}
                </Button>
              </div>
            )}
            {!unique.length && (
              <Empty
                title="从一句“在吗”开始"
                detail="在这里分享每一天。文字、照片和视频都会被好好保存。"
              />
            )}
            {unique.map((message, index) => {
              const mine = message.senderId === profile.user.id && message.role !== 'assistant',
                showDate =
                  index === 0 ||
                  message.createdAt.slice(0, 10) !== unique[index - 1].createdAt.slice(0, 10);
              return (
                <div key={message.id}>
                  {showDate && (
                    <p className="my-5 text-center text-[11px] text-muted-foreground">
                      {new Date(message.createdAt).toLocaleDateString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  <div className={`mb-4 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[82%] sm:max-w-[65%]">
                      <div
                        className={`overflow-hidden rounded-2xl px-3.5 py-2.5 ${mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-card'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                            {message.assistant?.avatar ? (
                              <img
                                alt={`${message.assistant.name}的头像`}
                                src={api.url(message.assistant.avatar.thumbnailUrl)}
                                className="size-7 rounded-full object-cover"
                              />
                            ) : (
                              <span className="grid size-7 place-items-center rounded-full bg-secondary">
                                <Sparkles size={13} />
                              </span>
                            )}
                            <span>{message.assistant?.name || '小爱'}</span>
                            <span className="text-[9px] text-muted-foreground">AI</span>
                          </div>
                        )}
                        {message.media && <MediaPreview media={message.media} api={api} compact />}
                        {message.content && (
                          <p
                            className={`whitespace-pre-wrap break-words text-sm leading-6 ${message.media ? 'mt-2' : ''}`}
                          >
                            {message.content}
                          </p>
                        )}
                      </div>
                      <p
                        className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground ${mine ? 'justify-end' : ''}`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {mine &&
                          (message.readAt ? (
                            <>
                              <CheckCheck size={13} />
                              <span>已读</span>
                            </>
                          ) : (
                            <Check size={13} />
                          ))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {pending.map((item) => (
          <div
            key={item.clientId}
            className="mb-4 ml-auto max-w-[82%] rounded-2xl border border-dashed border-primary/40 bg-secondary p-3 text-sm"
          >
            {item.media && <MediaPreview api={api} media={item.media} compact />}
            <p className="whitespace-pre-wrap break-words">{item.content}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{item.failed ? '发送失败，消息已保留' : '正在发送…'}</span>
              <button
                disabled={sending}
                onClick={() => void deliver(item)}
                className="text-primary"
              >
                重试
              </button>
              <button
                disabled={sending}
                onClick={() =>
                  setPending((items) => items.filter((entry) => entry.clientId !== item.clientId))
                }
              >
                移除
              </button>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="border-t bg-card px-3 py-3 sm:px-6">
        {(attachment || uploading !== null) && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
            {attachment ? (
              <>
                <img
                  alt="待发送附件"
                  src={api.url(attachment.thumbnailUrl)}
                  className="size-12 rounded-lg object-cover"
                />
                <span className="flex-1 text-xs">
                  {attachment.kind === 'video' ? '视频' : '照片'}已准备好
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="移除附件"
                  onClick={() => setAttachment(null)}
                >
                  <X size={16} />
                </Button>
              </>
            ) : (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                <span className="text-xs">
                  {uploading === 100 ? '正在压缩并生成预览…' : `上传中 ${uploading}%`}
                </span>
              </>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,video/mp4,video/quicktime,video/webm"
            hidden
            onChange={(e) => void attach(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            disabled={uploading !== null || sending}
            aria-label="添加图片或视频"
            onClick={() => file.current?.click()}
          >
            <Paperclip size={21} />
          </Button>
          <Textarea
            aria-label="消息内容"
            placeholder={`想和你说… 或 @${profile.ai.name} 帮我记下`}
            value={text}
            maxLength={4000}
            onChange={(e) => {
              setText(e.target.value);
              socket?.emit('typing');
            }}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                window.innerWidth >= 768
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            className="max-h-32 min-h-11 rounded-2xl bg-background"
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0 rounded-2xl"
            aria-label="发送消息"
            disabled={sending || uploading !== null || (!text.trim() && !attachment)}
          >
            {sending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </div>
      </form>
    </section>
  );
}
