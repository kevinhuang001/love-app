import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Heart, CalendarHeart, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import { daysTogether, today } from '@/lib/dates';
import type { Anniversary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Empty, Loading, ErrorState } from '@/components/common';
export function Dates() {
  const { api, profile, openUs } = useApp(),
    cache = useQueryClient();
  const query = useQuery({
    queryKey: ['anniversaries', profile.user.coupleId],
    queryFn: () => api.request<Anniversary[]>('/api/anniversaries'),
    enabled: Boolean(profile.couple),
  });
  const [open, setOpen] = useState(false),
    [edit, setEdit] = useState<Anniversary | null>(null),
    [title, setTitle] = useState(''),
    [date, setDate] = useState(today()),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState<Anniversary | null>(null),
    [startOpen, setStartOpen] = useState(false),
    [start, setStart] = useState(profile.couple?.startDate || today());
  function begin(item?: Anniversary) {
    setEdit(item || null);
    setTitle(item?.title || '');
    setDate(item?.date || today());
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (edit) await api.patch(`/api/anniversaries/${edit.id}`, { title, date });
      else await api.post('/api/anniversaries', { title, date });
      await cache.invalidateQueries({ queryKey: ['anniversaries'] });
      setOpen(false);
      toast.success('纪念日已保存');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!profile.couple)
    return (
      <Empty
        title="记住故事发生的日子"
        detail="配对后记录相识、旅行与每个已经发生的美好瞬间。"
        action={<Button onClick={openUs}>连接另一半</Button>}
      />
    );
  return (
    <section className="page-scroll page-enter p-5 sm:p-8">
      <Card className="relative mb-7 overflow-hidden border-0 bg-primary p-6 text-primary-foreground">
        <Heart
          className="absolute -right-4 -bottom-6 size-36 rotate-12 opacity-10"
          strokeWidth={1}
        />
        <div className="flex justify-between">
          <p className="text-xs tracking-widest opacity-80">从那天起 · 一直是我们</p>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-inherit"
            aria-label="设置在一起的日期"
            onClick={() => setStartOpen(true)}
          >
            <Pencil size={15} />
          </Button>
        </div>
        {profile.couple.startDate ? (
          <>
            <p className="my-4 text-5xl font-light tabular-nums">
              {daysTogether(profile.couple.startDate)}
              <span className="ml-2 text-sm">天</span>
            </p>
            <p className="text-xs opacity-80">{profile.couple.startDate} · 我们的故事开始了</p>
          </>
        ) : (
          <Button
            variant="ghost"
            className="mt-5 w-fit bg-white/15 text-inherit"
            onClick={() => setStartOpen(true)}
          >
            记录故事开始的那天
          </Button>
        )}
      </Card>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">我们的纪念日</h2>
          <p className="mt-2 text-xs text-muted-foreground">从过去数到今天，每一天都算数。</p>
        </div>
        <Button
          size="icon"
          aria-label="新增纪念日"
          className="rounded-full"
          onClick={() => begin()}
        >
          <Plus size={20} />
        </Button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <Empty title="记录第一个重要的日子" detail="未来的安排和节日倒计时，在 To Do 中添加。" />
      ) : (
        <div className="space-y-3">
          {query.data.map((item) => (
            <Card key={item.id} className="flex flex-row items-center gap-3 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                <CalendarHeart size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-medium">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums text-primary">
                  {daysTogether(item.date)}
                </p>
                <p className="text-[10px] text-muted-foreground">第几天 · 累计</p>
              </div>
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`编辑${item.title}`}
                  onClick={() => begin(item)}
                >
                  <Pencil size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`删除${item.title}`}
                  onClick={() => setRemove(item)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v);
        }}
      >
        <DialogContent>
          <DialogTitle>{edit ? '编辑纪念日' : '添加一个纪念日'}</DialogTitle>
          <DialogDescription>纪念日从当天开始累计；未来日期请添加为 To Do。</DialogDescription>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-title">名称</Label>
              <Input
                id="date-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-value">日期</Label>
              <Input
                id="date-value"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min="1900-01-01"
                max={today()}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? '保存中…' : '保存纪念日'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogTitle>我们的故事，从哪天开始？</DialogTitle>
          <DialogDescription>设置在一起的日期，两个人都能看到。</DialogDescription>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.patch('/api/couple', { startDate: start });
                await cache.invalidateQueries({ queryKey: ['profile'] });
                setStartOpen(false);
                toast.success('开始日期已保存');
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <Label htmlFor="start-date">开始日期</Label>
            <Input
              id="start-date"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              min="1900-01-01"
              max={today()}
              required
            />
            <Button type="submit" className="w-full">
              保存日期
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
      >
        <DialogContent>
          <DialogTitle>删除纪念日？</DialogTitle>
          <DialogDescription>“{remove?.title}”会从你们的列表中移除。</DialogDescription>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await api.delete(`/api/anniversaries/${remove!.id}`);
                setRemove(null);
                await cache.invalidateQueries({ queryKey: ['anniversaries'] });
                toast.success('纪念日已删除');
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            确认删除
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
