import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CloudUpload, RotateCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import { UploadQueue, pendingTask, nativeUploads, BackgroundUploads } from '@/lib/upload-queue';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
const Context = createContext<UploadQueue | null>(null);
export function UploadProvider({ children }: { children: React.ReactNode }) {
  const { api, profile } = useApp(),
    cache = useQueryClient();
  const makeQueue = () =>
    new UploadQueue(api, profile, () => {
      void cache.invalidateQueries({ queryKey: ['moments'] });
      void cache.invalidateQueries({ queryKey: ['profile'] });
      void cache.invalidateQueries({ queryKey: ['ai-settings'] });
    });
  const [queue, setQueue] = useState(makeQueue);
  useEffect(() => {
    const active = makeQueue();
    setQueue(active);
    void active.start().catch((error) => toast.error((error as Error).message));
    return () => active.dispose();
  }, [api, profile.user.id, profile.user.coupleId, cache]);
  return <Context.Provider value={queue}>{children}</Context.Provider>;
}
export function useUploads() {
  const queue = useContext(Context);
  if (!queue) throw new Error('上传队列不可用');
  const tasks = useSyncExternalStore(queue.subscribe, queue.getSnapshot);
  return { queue, tasks };
}
const labels = {
  queued: '等待上传',
  preparing: '正在保存本地文件',
  uploading: '正在上传',
  processing: '正在处理并保存',
  retrying: '正在重试',
  done: '上传完成',
  failed: '上传失败',
  cancelled: '已取消',
  paused: '已暂停',
};
export function UploadButton() {
  const { queue, tasks } = useUploads(),
    [open, setOpen] = useState(false),
    [tab, setTab] = useState<'active' | 'history'>('active');
  useEffect(() => {
    if (!nativeUploads) return;
    let active = true;
    const handle = BackgroundUploads.addListener('openUploads', () => {
      setOpen(true);
      setTab('active');
    });
    void BackgroundUploads.consumeOpen().then((value) => {
      if (value.opened) setOpen(true);
    });
    return () => {
      active = false;
      void handle.then((listener) => listener.remove());
    };
  }, []);
  const active = tasks.filter(pendingTask),
    remaining = tasks.filter((t) => ['failed', 'paused'].includes(t.status));
  const shown = tasks
    .filter((t) =>
      tab === 'active'
        ? pendingTask(t) || ['failed', 'paused'].includes(t.status)
        : !pendingTask(t),
    )
    .slice()
    .sort((a, b) => b.created - a.created);
  const action = (id: string, value: 'retry' | 'cancel' | 'clear') =>
    void queue.action(id, value).catch((e) => toast.error((e as Error).message));
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label="上传中心"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs"
      >
        <CloudUpload size={17} />
        {active.length
          ? `上传中 ${active.length}`
          : remaining.length
            ? `上传待处理 ${remaining.length}`
            : '上传记录'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>上传中心</DialogTitle>
          <DialogDescription>
            {nativeUploads
              ? '可以离开上传页面或切到后台，进度也会显示在系统通知中。'
              : '可以离开上传页面；浏览器恢复运行后自动续传未完成任务。'}
          </DialogDescription>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tab === 'active' ? 'secondary' : 'ghost'}
              onClick={() => setTab('active')}
            >
              进行中 {active.length + remaining.length}
            </Button>
            <Button
              size="sm"
              variant={tab === 'history' ? 'secondary' : 'ghost'}
              onClick={() => setTab('history')}
            >
              上传历史
            </Button>
          </div>
          <div className="max-h-[55dvh] space-y-3 overflow-auto">
            {!shown.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {tab === 'active' ? '没有正在上传的任务' : '还没有上传记录'}
              </p>
            )}
            {shown.map((task) => (
              <article key={task.id} className="space-y-2 rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.target === 'album'
                        ? '相册'
                        : task.target === 'draft'
                          ? '聊天附件'
                          : task.target === 'avatar'
                            ? '个人头像'
                            : 'AI 头像'}{' '}
                      · {labels[task.status]}
                      {task.target === 'draft' && task.status === 'done' && !task.claimed
                        ? '，待发送'
                        : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {['failed', 'paused'].includes(task.status) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`重试 ${task.name}`}
                        onClick={() => action(task.id, 'retry')}
                      >
                        <RotateCw size={15} />
                      </Button>
                    )}
                    {(pendingTask(task) || ['failed', 'paused'].includes(task.status)) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`取消 ${task.name}`}
                        onClick={() => action(task.id, 'cancel')}
                      >
                        <X size={15} />
                      </Button>
                    )}
                    {!pendingTask(task) &&
                      !(task.target === 'draft' && !task.claimed && task.status === 'done') && (
                        <Button variant="ghost" size="sm" onClick={() => action(task.id, 'clear')}>
                          清除记录
                        </Button>
                      )}
                  </div>
                </div>
                <progress
                  className="h-1.5 w-full accent-primary"
                  value={task.progress}
                  max={100}
                  aria-label={`${task.name} 上传进度`}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>
                    {(task.bytes / 1024 ** 2).toFixed(1)} / {(task.total / 1024 ** 2).toFixed(1)} MB
                    · {task.progress}%
                  </span>
                  <span>{new Date(task.created).toLocaleString()}</span>
                </div>
                {task.error && (
                  <p className="break-words text-xs text-destructive" role="status">
                    {task.error}
                    {task.attempt ? `（第 ${task.attempt} 次重试）` : ''}
                  </p>
                )}
              </article>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
