import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  Paperclip,
  Send,
  X,
  Check,
  CheckCheck,
  WifiOff,
  LoaderCircle,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { newId } from '@/lib/id';
import { aiMention, completeMention } from '@/lib/chat';
import { useApp } from '@/lib/context';
import type { Message, Media } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, Empty, MediaPreview, Loading, ErrorState } from '@/components/common';
type Pending = {
  clientId: string;
  content: string;
  attachments: Media[];
  failed?: boolean;
};
export function Chat() {
  const { api, profile, socket, connected, partnerOnline, openUs } = useApp(),
    cache = useQueryClient();
  const key = `love.outbox.v2:${api.session.server}:${profile.user.id}:${profile.user.coupleId}`;
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null),
    [editedContent, setEditedContent] = useState(''),
    [editingMessage, setEditingMessage] = useState(false);
  const [text, setText] = useState(''),
    [attachments, setAttachments] = useState<Media[]>([]),
    [uploading, setUploading] = useState<{ index: number; total: number; percent: number } | null>(
      null,
    ),
    [caret, setCaret] = useState(0),
    [mentionDismissed, setMentionDismissed] = useState(false),
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
    composer = useRef<HTMLTextAreaElement>(null),
    uploadLock = useRef(false),
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
        mediaIds: item.attachments.map((media) => media.id),
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
    if ((!text.trim() && !attachments.length) || sending || uploadLock.current) return;
    if (pending.length >= 100) {
      toast.error('请先处理待发送的消息');
      return;
    }
    const item: Pending = {
      clientId: newId(),
      content: text.trim(),
      attachments,
    };
    setPending((items) => [...items, item]);
    setText('');
    setAttachments([]);
    setMentionDismissed(true);
    autoScroll.current = true;
    await deliver(item);
  }
  async function attach(values: File[]) {
    if (!values.length || uploadLock.current) return;
    uploadLock.current = true;
    try {
      for (const [index, value] of values.entries()) {
        setUploading({ index: index + 1, total: values.length, percent: 0 });
        try {
          const media = await api.upload(value, (percent) =>
            setUploading({ index: index + 1, total: values.length, percent }),
          );
          setAttachments((items) => [...items, media]);
        } catch (err) {
          toast.error(`${value.name}：${(err as Error).message}`);
        }
      }
    } finally {
      uploadLock.current = false;
      setUploading(null);
      if (file.current) file.current.value = '';
    }
  }
  const mention = mentionDismissed ? null : aiMention(text, caret, profile.ai.name);
  function chooseAI() {
    if (!mention) return;
    const completed = completeMention(text, mention, profile.ai.name);
    setText(completed.text);
    setCaret(completed.caret);
    setMentionDismissed(true);
    requestAnimationFrame(() => {
      composer.current?.focus();
      composer.current?.setSelectionRange(completed.caret, completed.caret);
    });
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
      <div className="conversation-heading flex items-center gap-3 border-b bg-card px-5 py-5">
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
          <h2 className="text-base font-medium">{profile.partner.name}</h2>
          <p
            aria-live="polite"
            data-testid="partner-presence"
            className="text-xs text-muted-foreground"
          >
            {partnerOnline === null
              ? '正在确认状态…'
              : typing && partnerOnline
                ? '正在输入…'
                : partnerOnline
                  ? '在线'
                  : '离线'}
          </p>
        </div>
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
              const sender =
                message.role === 'assistant'
                  ? { name: message.assistant?.name || '小爱', avatar: message.assistant?.avatar }
                  : mine
                    ? profile.user
                    : profile.partner!;
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
                  <div
                    data-own={mine}
                    data-role={message.role}
                    className={`message-row mb-5 flex items-start gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar
                      small
                      name={sender.name}
                      src={
                        sender.avatar
                          ? api.url(sender.avatar.thumbnailUrl)
                          : message.role === 'assistant'
                            ? '/images/ai-avatar.webp'
                            : undefined
                      }
                      alt={
                        message.role === 'assistant'
                          ? `${sender.name}的头像`
                          : mine
                            ? '你的聊天头像'
                            : `${sender.name}的聊天头像`
                      }
                    />
                    <div className="min-w-0 max-w-[calc(100%-44px)] sm:max-w-[65%]">
                      {message.role === 'assistant' && (
                        <p className="mb-1.5 text-[11px] text-muted-foreground">
                          {message.assistant?.name || '小爱'}
                          <span className="ml-1.5 text-[9px]">AI</span>
                        </p>
                      )}
                      <div
                        className={`message-bubble overflow-hidden rounded-2xl px-3.5 py-2.5 ${mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-card'}`}
                      >
                        {message.attachments.length > 0 && (
                          <div
                            className={`grid gap-1.5 ${message.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                            data-testid="message-attachments"
                          >
                            {message.attachments.map((media) => (
                              <MediaPreview key={media.id} media={media} api={api} compact />
                            ))}
                          </div>
                        )}
                        {message.content && (
                          <p
                            className={`whitespace-pre-wrap break-words text-sm leading-6 ${message.attachments.length ? 'mt-2' : ''}`}
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
                        <button
                          type="button"
                          aria-label={`修改消息 ${message.id}`}
                          className="ml-1 rounded p-1 text-muted-foreground"
                          onClick={() => {
                            setSelectedMessage(message);
                            setEditedContent(message.content);
                          }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
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
            className="message-row mb-5 flex flex-row-reverse items-start gap-2.5"
          >
            <Avatar
              small
              name={profile.user.name}
              src={profile.user.avatar ? api.url(profile.user.avatar.thumbnailUrl) : undefined}
              alt="你的聊天头像"
            />
            <div className="min-w-0 max-w-[calc(100%-44px)] rounded-2xl border border-dashed border-primary/40 bg-secondary p-3 text-sm">
              <div
                className={`grid gap-1.5 ${item.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
              >
                {item.attachments.map((media) => (
                  <MediaPreview key={media.id} api={api} media={media} compact />
                ))}
              </div>
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
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="chat-composer relative border-t bg-card px-3 py-3 sm:px-6">
        {mention && (
          <div
            id="ai-mentions"
            role="listbox"
            aria-label="提及助手"
            className="absolute right-3 bottom-full left-3 mb-2 rounded-2xl border bg-card p-1.5 shadow-lg sm:right-6 sm:left-6"
          >
            <button
              type="button"
              role="option"
              id="ai-mention-option"
              aria-selected="true"
              aria-label={`提及 ${profile.ai.name}`}
              onPointerDown={(e) => e.preventDefault()}
              onClick={chooseAI}
              className="flex w-full items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2.5 text-left"
            >
              <Avatar
                small
                name={profile.ai.name}
                src={
                  profile.ai.avatar
                    ? api.url(profile.ai.avatar.thumbnailUrl)
                    : '/images/ai-avatar.webp'
                }
              />
              <span className="flex-1 text-sm font-medium">{profile.ai.name}</span>
              <span className="text-[11px] text-muted-foreground">AI 助手</span>
            </button>
          </div>
        )}
        {attachments.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1" aria-label="待发送附件">
            {attachments.map((media, index) => (
              <div
                key={media.id}
                className="relative shrink-0 rounded-xl border bg-secondary p-1.5"
              >
                <img
                  alt={`待发送${media.kind === 'video' ? '视频' : '图片'} ${index + 1}`}
                  src={api.url(media.thumbnailUrl)}
                  className="size-16 rounded-lg object-cover"
                />
                <button
                  type="button"
                  aria-label={`移除附件 ${index + 1}`}
                  onClick={() =>
                    setAttachments((items) => items.filter((item) => item.id !== media.id))
                  }
                  className="absolute top-0 right-0 grid size-6 place-items-center rounded-full bg-card shadow-sm"
                >
                  <X size={14} />
                </button>
                {media.kind === 'video' && (
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1 text-[10px] text-white">
                    视频
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {uploading && (
          <p role="status" className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle size={14} className="animate-spin" />
            {uploading.index}/{uploading.total} ·{' '}
            {uploading.percent === 100 ? '正在压缩并生成预览…' : `上传中 ${uploading.percent}%`}
          </p>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={file}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,video/mp4,video/quicktime,video/webm"
            hidden
            onChange={(e) => void attach(Array.from(e.target.files || []))}
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
            ref={composer}
            aria-label="消息内容"
            placeholder={`发消息，或 @${profile.ai.name}`}
            value={text}
            maxLength={4000}
            aria-controls={mention ? 'ai-mentions' : undefined}
            aria-expanded={Boolean(mention)}
            aria-autocomplete="list"
            aria-activedescendant={mention ? 'ai-mention-option' : undefined}
            onChange={(e) => {
              setText(e.target.value);
              setCaret(e.target.selectionStart);
              setMentionDismissed(false);
              socket?.emit('typing');
            }}
            onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
            onBlur={() => setMentionDismissed(true)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (mention && ['Enter', 'Tab'].includes(e.key)) {
                e.preventDefault();
                chooseAI();
                return;
              }
              if (mention && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
                return;
              }
              if (e.key === 'Escape') setMentionDismissed(true);
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
            className="max-h-32 min-h-11 rounded-2xl border-transparent bg-secondary"
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0 rounded-2xl"
            aria-label="发送消息"
            disabled={sending || uploading !== null || (!text.trim() && !attachments.length)}
          >
            {sending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </div>
      </form>
      <Dialog
        open={Boolean(selectedMessage)}
        onOpenChange={(open) => {
          if (!open && !editingMessage) setSelectedMessage(null);
        }}
      >
        <DialogContent>
          <DialogTitle>修改消息</DialogTitle>
          <DialogDescription>修改或删除会同步到两个人的聊天中。</DialogDescription>
          <Textarea
            aria-label="消息内容"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            maxLength={8000}
          />
          <Button
            disabled={
              editingMessage || (!editedContent.trim() && !selectedMessage?.attachments.length)
            }
            onClick={async () => {
              setEditingMessage(true);
              try {
                await api.patch(`/api/messages/${selectedMessage!.id}`, { content: editedContent });
                await cache.invalidateQueries({ queryKey: ['messages'] });
                setSelectedMessage(null);
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setEditingMessage(false);
              }
            }}
          >
            保存消息
          </Button>
          <Button
            variant="destructive"
            disabled={editingMessage}
            onClick={async () => {
              setEditingMessage(true);
              try {
                await api.delete(`/api/messages/${selectedMessage!.id}`);
                await cache.invalidateQueries({ queryKey: ['messages'] });
                setSelectedMessage(null);
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setEditingMessage(false);
              }
            }}
          >
            删除这条消息
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
