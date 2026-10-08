import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarClock, Check, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import { today, clockTime, nextTodoInstant, lunarLabel } from '@/lib/dates';
import { useClock } from '@/lib/useClock';
import { Duration } from '@/components/Duration';
import type { Todo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Empty, Loading, ErrorState } from '@/components/common';
const selectStyle = 'flex h-10 w-full rounded-md border bg-background px-3 text-sm';
export function Todos() {
  const { api, profile, openUs } = useApp(),
    cache = useQueryClient();
  const query = useQuery({
    queryKey: ['todos', profile.user.coupleId],
    queryFn: () => api.request<Todo[]>('/api/todos'),
    enabled: Boolean(profile.couple),
  });
  const now = useClock();
  const [open, setOpen] = useState(false),
    [edit, setEdit] = useState<Todo | null>(null),
    [title, setTitle] = useState(''),
    [date, setDate] = useState(today()),
    [time, setTime] = useState(clockTime()),
    [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar'),
    [leapMonth, setLeapMonth] = useState(false),
    [repeat, setRepeat] = useState<'none' | 'yearly'>('none'),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState<Todo | null>(null);
  function begin(item?: Todo) {
    setEdit(item || null);
    setTitle(item?.title || '');
    setDate(item?.date || today());
    setTime(item?.time || clockTime());
    setCalendar(item?.calendar || 'solar');
    setLeapMonth(Boolean(item?.leapMonth));
    setRepeat(item?.repeat || 'none');
    setOpen(true);
  }
  const value = { title, date, time, calendar, leapMonth, repeat };
  let preview: ReturnType<typeof nextTodoInstant> = null,
    error = '';
  try {
    preview = nextTodoInstant(value, now);
  } catch (e) {
    error = (e as Error).message;
  }
  async function refresh() {
    await cache.invalidateQueries({ queryKey: ['todos'] });
  }
  async function complete(item: Todo, completed: boolean) {
    setBusy(true);
    try {
      await api.post(`/api/todos/${item.id}/completion`, { completed });
      await refresh();
      toast.success(
        completed
          ? item.repeat === 'yearly'
            ? '本次已完成，已更新到下一次'
            : '待办已完成'
          : '已撤销完成',
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const items = (query.data || [])
    .map((item) => ({ item, next: nextTodoInstant(item, now) }))
    .sort(
      (a, b) =>
        Number(a.item.completed) - Number(b.item.completed) ||
        (a.next?.seconds ?? Infinity) - (b.next?.seconds ?? Infinity),
    );
  if (!profile.couple)
    return (
      <Empty
        title="一起期待下一件小事"
        detail="配对后添加未来的安排、公历和农历节日。"
        action={<Button onClick={openUs}>连接另一半</Button>}
      />
    );
  return (
    <section className="page-scroll page-enter p-5 sm:p-8">
      <div className="mb-5 flex justify-between">
        <div>
          <h2 className="text-2xl font-medium">待办与倒计时</h2>
        </div>
        <Button
          size="icon"
          className="rounded-full"
          aria-label="新增 To Do"
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
        <Empty title="下一件想一起做的事" />
      ) : (
        <div className="todo-list space-y-3">
          {items.map(({ item, next }) => (
            <Card
              key={item.id}
              className={`todo-item gap-3 p-4 ${item.completed ? 'opacity-65' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <CalendarClock size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-sm font-medium break-words ${item.completed ? 'line-through' : ''}`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lunarLabel(item)} {item.time}
                    {item.repeat === 'yearly' ? ' · 每年重复' : ''}
                  </p>
                  {item.calendar === 'lunar' && next && (
                    <p className="mt-1 text-[11px] text-muted-foreground">对应公历 {next.date}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {item.completed ? (
                    <span className="text-sm">完成</span>
                  ) : !next ? (
                    '—'
                  ) : (
                    <Duration seconds={next.seconds} />
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {item.completed
                      ? '已完成'
                      : !next
                        ? '超出日期范围'
                        : next.seconds < 0
                          ? '已逾期'
                          : '倒计时'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <div className="min-w-0">
                  {item.completedDate && item.repeat === 'yearly' && (
                    <p className="text-[10px] text-muted-foreground">已完成 {item.completedDate}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-0 text-xs"
                    disabled={busy}
                    aria-label={`${item.completed ? '撤销' : '完成'}${item.title}`}
                    onClick={() => void complete(item, !item.completed)}
                  >
                    {item.completed ? <RotateCcw size={13} /> : <Check size={13} />}{' '}
                    {item.completed ? '撤销完成' : '完成本次'}
                  </Button>
                  {item.completedDate && item.repeat === 'yearly' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 px-1 text-xs"
                      disabled={busy}
                      aria-label={`撤销完成${item.title}`}
                      onClick={() => void complete(item, false)}
                    >
                      撤销
                    </Button>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`编辑待办${item.title}`}
                    onClick={() => begin(item)}
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`删除待办${item.title}`}
                    onClick={() => setRemove(item)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
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
          <DialogTitle>{edit ? '编辑 To Do' : '添加 To Do'}</DialogTitle>
          <DialogDescription className="sr-only">
            设置待办的日期、时间与重复规则。
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (error) {
                toast.error(error);
                return;
              }
              setBusy(true);
              try {
                if (edit) await api.patch(`/api/todos/${edit.id}`, value);
                else await api.post('/api/todos', value);
                await refresh();
                setOpen(false);
                toast.success('To Do 已保存');
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="todo-title">待办名称</Label>
              <Input
                id="todo-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="todo-calendar">历法</Label>
                <select
                  id="todo-calendar"
                  className={selectStyle}
                  value={calendar}
                  onChange={(e) => {
                    setCalendar(e.target.value as typeof calendar);
                    setLeapMonth(false);
                    setDate(`${today().slice(0, 4)}-01-01`);
                  }}
                >
                  <option value="solar">公历</option>
                  <option value="lunar">农历</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-repeat">重复规则</Label>
                <select
                  id="todo-repeat"
                  className={selectStyle}
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as typeof repeat)}
                >
                  <option value="none">不重复</option>
                  <option value="yearly">每年重复</option>
                </select>
              </div>
            </div>
            {calendar === 'solar' ? (
              <div className="space-y-2">
                <Label htmlFor="todo-date">待办日期</Label>
                <Input
                  id="todo-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min="1900-01-01"
                  max="2100-12-31"
                  required
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['农历年份', 'year', 0, 1900, 2100],
                    ['农历月份', 'month', 1, 1, 12],
                    ['农历日期', 'day', 2, 1, 30],
                  ].map(([label, id, index, min, max]) => (
                    <div className="space-y-2" key={String(id)}>
                      <Label htmlFor={`lunar-${id}`}>{String(label)}</Label>
                      <Input
                        id={`lunar-${id}`}
                        type="number"
                        inputMode="numeric"
                        min={Number(min)}
                        max={Number(max)}
                        value={Number(date.split('-')[Number(index)]) || ''}
                        onChange={(e) => {
                          const parts = date.split('-');
                          parts[Number(index)] = e.target.value.padStart(
                            Number(index) === 0 ? 4 : 2,
                            '0',
                          );
                          setDate(parts.join('-'));
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Label htmlFor="todo-leap">农历闰月</Label>
                  <Switch id="todo-leap" checked={leapMonth} onCheckedChange={setLeapMonth} />
                </div>
                <p className="text-[11px] leading-5 text-muted-foreground">
                  普通节日不选闰月。重复日期若无三十，按该月最后一天；闰月只在对应闰月出现的年份重复。
                </p>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="todo-time">待办时间</Label>
              <Input
                id="todo-time"
                type="time"
                step="1"
                value={time}
                onChange={(e) =>
                  setTime(e.target.value.length === 5 ? e.target.value + ':00' : e.target.value)
                }
                required
              />
            </div>
            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : (
              <div className="rounded-xl bg-secondary p-3 text-xs leading-6">
                {preview ? (
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {calendar === 'lunar' ? `对应公历 ${preview.date} ${time}` : ''}
                      <span className="block">{preview.seconds < 0 ? '已逾期' : '倒计时'}</span>
                    </span>
                    <Duration seconds={preview.seconds} />
                  </div>
                ) : (
                  '已超过 2100 年支持范围'
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy || !!error}>
              {busy ? '保存中…' : '保存 To Do'}
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
          <DialogTitle>删除 To Do？</DialogTitle>
          <DialogDescription>“{remove?.title}”会从两个人的列表中移除。</DialogDescription>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await api.delete(`/api/todos/${remove!.id}`);
                setRemove(null);
                await refresh();
                toast.success('To Do 已删除');
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
