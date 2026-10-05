import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Film, Image, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Empty, Loading, MediaPreview, ErrorState } from '@/components/common';
import { useApp } from '@/lib/context';
import type { Moment } from '@/lib/types';
import { today } from '@/lib/dates';
export function Memories() {
  const { api, profile, openUs } = useApp(),
    cache = useQueryClient();
  const query = useQuery({
    queryKey: ['moments', profile.user.coupleId],
    queryFn: () => api.request<Moment[]>('/api/moments'),
    enabled: Boolean(profile.couple),
    refetchInterval: 300_000,
  });
  const [open, setOpen] = useState(false),
    [edit, setEdit] = useState<Moment | null>(null),
    [title, setTitle] = useState(''),
    [date, setDate] = useState(today()),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [remove, setRemove] = useState<Moment | null>(null);
  const input = useRef<HTMLInputElement>(null);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (edit) await api.patch(`/api/moments/${edit.id}`, { title, date });
      else {
        if (!file) throw new Error('请选择照片或视频');
        const media = await api.upload(file, setProgress);
        await api.post('/api/moments', { title, date, mediaId: media.id });
      }
      await cache.invalidateQueries({ queryKey: ['moments'] });
      setOpen(false);
      toast.success(edit ? '回忆已更新' : '又收藏了一个美好瞬间');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function begin(moment?: Moment) {
    setEdit(moment || null);
    setTitle(moment?.title || '');
    setDate(moment?.date || today());
    setFile(null);
    setProgress(0);
    setOpen(true);
  }
  if (!profile.couple)
    return (
      <Empty
        title="我们的回忆相册"
        detail="配对后，把一起经历的瞬间收进相册。支持照片和视频。"
        action={<Button onClick={openUs}>连接另一半</Button>}
      />
    );
  return (
    <section className="page-scroll page-enter p-5 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">那些一起的时刻</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.data?.length || 0} 个值得珍藏的瞬间
          </p>
        </div>
        <Button size="icon" aria-label="新增回忆" onClick={() => begin()} className="rounded-full">
          <Plus size={20} />
        </Button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <Empty
          title="第一张回忆，等你来放"
          detail="上传一张照片或一段视频，写下那天的故事。"
          action={<Button onClick={() => begin()}>收藏一个瞬间</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {query.data.map((moment) => (
            <article key={moment.id} className="overflow-hidden rounded-2xl border bg-card">
              <MediaPreview api={api} media={moment.media} />
              <div className="p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {moment.media.kind === 'video' ? <Film size={12} /> : <Image size={12} />}
                  {moment.date}
                </div>
                <p className="line-clamp-3 min-h-5 break-words text-sm">
                  {moment.title || '一个美好瞬间'}
                </p>
                {moment.ownerId === profile.user.id && (
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="编辑回忆"
                      onClick={() => begin(moment)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      aria-label="删除回忆"
                      onClick={() => setRemove(moment)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? '编辑这个瞬间' : '收藏一个瞬间'}</DialogTitle>
            <DialogDescription>
              照片和视频会生成压缩预览。单个文件最多 100 MB，视频最长 5 分钟。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {!edit && (
              <div>
                <input
                  ref={input}
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/heic,video/mp4,video/quicktime,video/webm"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Button
                  className="h-20 w-full border-dashed"
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                >
                  {file ? (
                    <span className="truncate">{file.name}</span>
                  ) : (
                    <>
                      <Plus size={18} />
                      选择照片或视频
                    </>
                  )}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="memory-title">写下这一刻</Label>
              <Textarea
                id="memory-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={300}
                placeholder="那天的风，刚刚好…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory-date">发生日期</Label>
              <Input
                id="memory-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? (progress === 100 ? '压缩处理中…' : `保存中 ${progress}%`) : '保存回忆'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(remove)}
        onOpenChange={(value) => {
          if (!value) setRemove(null);
        }}
      >
        <DialogContent>
          <DialogTitle>删除这个回忆？</DialogTitle>
          <DialogDescription>这条回忆会从两个人的相册中移除。</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await api.delete(`/api/moments/${remove!.id}`);
                  setRemove(null);
                  await cache.invalidateQueries({ queryKey: ['moments'] });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
