import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Heart, Trash2, CalendarHeart, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import { countdown, daysTogether, today } from '@/lib/dates';
import type { Anniversary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    [title, setTitle] = useState(''),
    [date, setDate] = useState(today()),
    [yearly, setYearly] = useState(true),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState<Anniversary | null>(null),
    [startOpen, setStartOpen] = useState(false),
    [start, setStart] = useState(profile.couple?.startDate || today()),
    [remove, setRemove] = useState<Anniversary | null>(null);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (edit) await api.patch(`/api/anniversaries/${edit.id}`, { title, date, yearly });
      else await api.post('/api/anniversaries', { title, date, yearly });
      setOpen(false);
      await cache.invalidateQueries({ queryKey: ['anniversaries'] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function begin(item?: Anniversary) {
    setEdit(item || null);
    setTitle(item?.title || '');
    setDate(item?.date || today());
    setYearly(item ? Boolean(item.yearly) : true);
    setOpen(true);
  }
  if (!profile.couple)
    return (
      <Empty
        title="每个重要的日子，都记得"
        detail="与另一半配对，一起记录相识的日子和那些值得期待的日期。"
        action={<Button onClick={openUs}>连接另一半</Button>}
      />
    );
  const items =
    query.data
      ?.map((item) => ({ ...item, days: countdown(item.date, Boolean(item.yearly)) }))
      .sort((a, b) => a.days - b.days) || [];
  return (
    <section className="page-scroll page-enter p-5 sm:p-8">
      <Card className="relative mb-8 overflow-hidden border-0 bg-primary p-6 text-primary-foreground">
        <Heart
          className="absolute -right-4 -bottom-6 size-36 rotate-12 opacity-10"
          strokeWidth={1}
        />
        <div className="flex justify-between">
          <p className="text-xs tracking-widest opacity-80">从那天起 · 一直是我们</p>
          <Button
            className="size-7 text-inherit hover:bg-white/10"
            variant="ghost"
            size="icon"
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
            className="mt-6 w-fit bg-white/15 text-inherit hover:bg-white/25"
            variant="ghost"
            onClick={() => setStartOpen(true)}
          >
            记录故事开始的那天
          </Button>
        )}
      </Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">值得期待的日子</h2>
        <Button
          size="icon"
          className="rounded-full"
          aria-label="新增纪念日"
          onClick={() => begin()}
        >
          <Plus size={20} />
        </Button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !items.length ? (
        <Empty title="为期待留一个位置" detail="生日、纪念日、下次旅行，都可以记在这里。" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-row items-center gap-4 p-4">
              <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary">
                <CalendarHeart size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.date}
                  {item.yearly ? ' · 每年' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold tabular-nums text-primary">
                  {item.days === 0 ? '今天' : Math.abs(item.days)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.days === 0 ? '好好庆祝' : item.days < 0 ? '天前' : '天后'}
                </p>
              </div>
              <div className="flex flex-col">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label={`编辑${item.title}`}
                  onClick={() => begin(item)}
                >
                  <Pencil size={13} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{edit ? '编辑纪念日' : '添加一个重要的日子'}</DialogTitle>
          <DialogDescription>给你们的期待一个名字。</DialogDescription>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-title">名称</Label>
              <Input
                id="date-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                placeholder="我们的纪念日"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-value">日期</Label>
              <Input
                id="date-value"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="yearly">每年重复</Label>
              <Switch id="yearly" checked={yearly} onCheckedChange={setYearly} />
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
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
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.patch('/api/couple', { startDate: start });
                await cache.invalidateQueries({ queryKey: ['profile'] });
                setStartOpen(false);
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
            className="space-y-4"
          >
            <Label htmlFor="start-date">开始日期</Label>
            <Input
              id="start-date"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
              max={today()}
            />
            <Button type="submit" className="w-full">
              保存日期
            </Button>
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
          <DialogTitle>删除纪念日？</DialogTitle>
          <DialogDescription>“{remove?.title}”会从你们的列表中移除。</DialogDescription>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await api.delete(`/api/anniversaries/${remove!.id}`);
                setRemove(null);
                await cache.invalidateQueries({ queryKey: ['anniversaries'] });
              } catch (err) {
                toast.error((err as Error).message);
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
