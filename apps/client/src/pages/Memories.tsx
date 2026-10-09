import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Film,
  Image,
  Search,
  SlidersHorizontal,
  Grid2X2,
  Grid3X3,
  Rows3,
  X,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { newId } from '@/lib/id';
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
import { Empty, Loading, MediaThumbnail, ErrorState } from '@/components/common';
import { AlbumViewer } from '@/components/AlbumViewer';
import { useApp } from '@/lib/context';
import type { Moment, UploadedMedia } from '@/lib/types';
import { today } from '@/lib/dates';
import { exportAlbum, type ExportFormat } from '@/lib/album-transfer';
import { albumDefaults, loadAlbumOptions, type AlbumOptions } from '@/lib/album';
type AlbumPage = { items: Moment[]; total: number; nextCursor: string | null };
type UploadFile = {
  id: string;
  file: File;
  media?: UploadedMedia;
  date: string;
  editDate: boolean;
  error?: string;
};
function UploadSelection({
  files,
  busy,
  onRemove,
  onChange,
}: {
  files: UploadFile[];
  busy: boolean;
  onRemove: (index: number) => void;
  onChange: (id: string, value: Partial<UploadFile>) => void;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = files.map((item) => URL.createObjectURL(item.file));
    setUrls(next);
    return () => next.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  return (
    <ul className="mt-3 max-h-[40dvh] space-y-3 overflow-y-auto">
      {files.map((item, index) => (
        <li
          key={item.id}
          data-testid="upload-file"
          data-file={item.file.name}
          className="space-y-3 rounded-xl border border-border p-3"
        >
          <div className="flex items-center gap-3">
            {item.file.type.startsWith('image/') ? (
              <img src={urls[index]} alt="待上传照片" className="size-12 rounded-lg object-cover" />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary">
                <Film className="size-5" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs">{item.file.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {(item.file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label={`移除文件${index + 1}`}
              disabled={busy}
              onClick={() => onRemove(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
          {!item.media ? (
            <p
              role={item.error ? 'alert' : 'status'}
              className={item.error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
            >
              {item.error || '正在上传并识别日期…'}
            </p>
          ) : item.editDate ? (
            <div className="space-y-2">
              <Label htmlFor={`capture-${item.id}`} className="block break-all text-xs">
                拍摄日期 · {item.file.name}
              </Label>
              {!item.media.capturedDate && (
                <p className="text-[11px] text-muted-foreground">
                  没有找到拍摄日期，请为这个文件填写。
                </p>
              )}
              <Input
                id={`capture-${item.id}`}
                type="date"
                required
                disabled={busy}
                min="1900-01-01"
                max="2100-12-31"
                value={item.date}
                onChange={(e) => onChange(item.id, { date: e.target.value })}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span>
                <span className="mr-2 text-muted-foreground">已识别</span>
                <time>{item.date}</time>
              </span>
              <button
                type="button"
                className="shrink-0 py-2 text-primary"
                disabled={busy}
                aria-label={`修改${item.file.name}的日期`}
                onClick={() => onChange(item.id, { editDate: true })}
              >
                修改日期
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
export function Memories() {
  const [transferOpen, setTransferOpen] = useState(false),
    [transferBusy, setTransferBusy] = useState(false),
    [transferStatus, setTransferStatus] = useState(''),
    [exportFormat, setExportFormat] = useState<ExportFormat>('archive');
  const archiveInput = useRef<HTMLInputElement>(null);

  const { api, profile, openUs } = useApp(),
    cache = useQueryClient();
  const preferenceKey = `love.album:${api.session.server}:${profile.user.id}:${profile.user.coupleId}`;
  const [options, setOptions] = useState<AlbumOptions>(() => loadAlbumOptions(preferenceKey));
  const [search, setSearch] = useState(''),
    [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(options));
    } catch {
      /* Storage may be unavailable; browsing still works. */
    }
  }, [options, preferenceKey]);
  const { sort, view, type, owner, from, to } = options;
  const query = useInfiniteQuery({
    queryKey: ['moments', profile.user.coupleId, { sort, type, owner, from, to, term }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ sort, type, owner, search: term });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (pageParam) params.set('cursor', pageParam);
      return api.request<AlbumPage>(`/api/moments?${params}`);
    },
    getNextPageParam: (page) => page.nextCursor || undefined,
    enabled: Boolean(profile.couple),
    refetchInterval: 300_000,
  });
  const items = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.items) || []).map((item) => [item.id, item]),
    ).values(),
  ];
  const total = query.data?.pages[0]?.total || 0;
  const [open, setOpen] = useState(false),
    [edit, setEdit] = useState<Moment | null>(null),
    [title, setTitle] = useState(''),
    [date, setDate] = useState(today()),
    [files, setFiles] = useState<UploadFile[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [uploadIndex, setUploadIndex] = useState(0),
    [remove, setRemove] = useState<Moment | null>(null);
  const [selected, setSelected] = useState<string | null>(null),
    [filterOpen, setFilterOpen] = useState(false),
    [draft, setDraft] = useState(options),
    [filterError, setFilterError] = useState('');
  const uploadController = useRef<AbortController | null>(null);
  const draftMedia = useRef(new Set<string>());
  async function releaseDrafts(ids = [...draftMedia.current]) {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        await api.delete(`/api/media/${id}`);
        draftMedia.current.delete(id);
      }),
    );
    if (ids.length) void cache.invalidateQueries({ queryKey: ['profile'] });
    if (results.some((result) => result.status === 'rejected'))
      toast.error('部分上传草稿未能清理，可稍后使用管理工具清理未使用媒体');
  }
  useEffect(
    () => () => {
      uploadController.current?.abort();
      void releaseDrafts();
    },
    [api],
  );
  function closeDraft() {
    if (busy && !uploadController.current) return;
    uploadController.current?.abort();
    uploadController.current = null;
    setBusy(false);
    setOpen(false);
    setFiles([]);
    void releaseDrafts();
  }
  const input = useRef<HTMLInputElement>(null),
    scroller = useRef<HTMLElement>(null);
  const index = items.findIndex((item) => item.id === selected),
    current = items[index] || null;
  useEffect(() => {
    if (selected && !query.isFetching && !current) setSelected(null);
  }, [selected, current, query.isFetching]);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [sort, type, owner, from, to, term]);
  function begin(item?: Moment) {
    setSelected(null);
    setEdit(item || null);
    setTitle(item?.title || '');
    setDate(item?.date || today());
    setFiles([]);
    setProgress(0);
    setOpen(true);
  }
  async function prepare(chosen: UploadFile[]) {
    const controller = new AbortController();
    uploadController.current = controller;
    setBusy(true);
    try {
      for (let i = 0; i < chosen.length; i++) {
        if (controller.signal.aborted) break;
        const item = chosen[i];
        if (item.media) continue;
        setUploadIndex(i + 1);
        setProgress(0);
        setFiles((items) => items.map((v) => (v.id === item.id ? { ...v, error: undefined } : v)));
        try {
          const media = await api.upload(item.file, setProgress, '/api/media', controller.signal);
          draftMedia.current.add(media.id);
          if (controller.signal.aborted) {
            void releaseDrafts([media.id]);
            break;
          }
          setFiles((items) =>
            items.map((v) =>
              v.id === item.id
                ? {
                    ...v,
                    media,
                    date: media.capturedDate || '',
                    editDate: !media.capturedDate,
                    error: undefined,
                  }
                : v,
            ),
          );
        } catch (error) {
          if (controller.signal.aborted) break;
          setFiles((items) =>
            items.map((v) => (v.id === item.id ? { ...v, error: (error as Error).message } : v)),
          );
        }
      }
    } finally {
      if (uploadController.current === controller) {
        uploadController.current = null;
        setBusy(false);
      }
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (edit) {
        await api.patch(`/api/moments/${edit.id}`, { title, date });
        setOpen(false);
        toast.success('回忆已更新');
      } else {
        if (!files.length) throw new Error('请选择照片或视频');
        const remaining: UploadFile[] = [];
        let saved = 0;
        const errors: string[] = [];
        for (let i = 0; i < files.length; i++) {
          setUploadIndex(i + 1);
          setProgress(0);
          try {
            const item = files[i];
            if (!item.media || !item.date) throw new Error('请先完成上传并填写这个文件的拍摄日期');
            await api.post('/api/moments', {
              title,
              date: item.date,
              mediaId: item.media.id,
              clientId: item.id,
            });
            draftMedia.current.delete(item.media.id);
            saved++;
          } catch (error) {
            remaining.push(files[i]);
            errors.push(`${files[i].file.name}：${(error as Error).message}`);
          }
        }
        setFiles(remaining);
        if (!remaining.length) {
          setOpen(false);
          toast.success(saved === 1 ? '回忆已保存' : `已保存 ${saved} 个回忆`);
        } else
          toast.error(
            `已保存 ${saved} 个，${remaining.length} 个失败。${errors[0]}；可重试剩余文件`,
            { duration: 6000 },
          );
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      await cache.invalidateQueries({ queryKey: ['moments'] });
      setBusy(false);
    }
  }
  async function advance() {
    if (index + 1 < items.length) {
      setSelected(items[index + 1].id);
      return;
    }
    if (query.hasNextPage && !query.isFetchingNextPage) {
      try {
        const result = await query.fetchNextPage();
        const all = result.data?.pages.flatMap((page) => page.items) || [];
        const i = all.findIndex((item) => item.id === selected);
        if (all[i + 1]) setSelected(all[i + 1].id);
      } catch (error) {
        toast.error((error as Error).message);
      }
    }
  }
  const extraFilters = Number(owner !== 'all') + Number(Boolean(from || to));
  const monthGroups = new Map<string, Moment[]>();
  for (const item of items) {
    const month = item.date.slice(0, 7);
    monthGroups.set(month, [...(monthGroups.get(month) || []), item]);
  }
  const tile = (item: Moment) => (
    <article
      key={item.id}
      data-testid="album-item"
      data-date={item.date}
      data-owner={item.ownerId}
      className="album-item min-w-0"
    >
      <MediaThumbnail
        api={api}
        media={item.media}
        onClick={() => setSelected(item.id)}
        label={`${item.media.kind === 'video' ? '播放视频' : '查看图片'}：${item.title || '未命名回忆'}`}
      />
      {view !== 'compact' && (
        <div className="pt-2">
          <p className="line-clamp-2 break-words text-xs leading-5">{item.title || '未命名回忆'}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {item.date} ·{' '}
            {item.ownerId === profile.user.id ? '我' : profile.partner?.name || '另一半'}
          </p>
        </div>
      )}
    </article>
  );
  if (!profile.couple)
    return (
      <Empty
        title="我们的回忆相册"
        detail="配对后共享照片与视频。"
        action={<Button onClick={openUs}>连接另一半</Button>}
      />
    );
  return (
    <section ref={scroller} className="page-scroll page-enter album-page">
      <div className="album-toolbar sticky top-0 z-10 space-y-3 bg-background px-5 pt-4 pb-4 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">回忆相册</h2>
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              {query.isPending ? '正在整理…' : `${total} 个回忆`}
              {query.isFetching && !query.isPending ? ' · 更新中…' : ''}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="导出或导入相册"
              onClick={() => setTransferOpen(true)}
            >
              <Download className="size-5" />
            </Button>
            <Button size="icon" aria-label="新增回忆" onClick={() => begin()}>
              <Plus className="size-5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" />
          <Input
            aria-label="搜索回忆"
            placeholder="搜索回忆描述"
            className="pl-9 pr-10"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              aria-label="清除搜索"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1" role="group" aria-label="媒体类型">
            {[
              ['all', '全部'],
              ['image', '照片'],
              ['video', '视频'],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={type === value ? 'secondary' : 'ghost'}
                aria-pressed={type === value}
                onClick={() => setOptions((v) => ({ ...v, type: value as AlbumOptions['type'] }))}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            aria-label="筛选相册"
            onClick={() => {
              setDraft(options);
              setFilterError('');
              setFilterOpen(true);
            }}
          >
            <SlidersHorizontal className="size-4" />
            筛选{extraFilters > 0 && <span className="text-[10px]">{extraFilters}</span>}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <select
            aria-label="排序方式"
            className="album-sort min-w-0 flex-1"
            value={sort}
            onChange={(e) =>
              setOptions((v) => ({ ...v, sort: e.target.value as AlbumOptions['sort'] }))
            }
          >
            <option value="date_desc">日期最新</option>
            <option value="date_asc">日期最早</option>
            <option value="uploaded_desc">最近上传</option>
          </select>
          <div
            className="album-view-controls flex shrink-0 gap-1"
            role="group"
            aria-label="相册查看方式"
          >
            {[
              ['grid', '网格查看', Grid2X2],
              ['compact', '紧凑查看', Grid3X3],
              ['timeline', '时间轴查看', Rows3],
            ].map(([value, label, Icon]) => {
              const Glyph = Icon as typeof Grid2X2;
              return (
                <Button
                  key={value as string}
                  size="icon"
                  variant={view === value ? 'secondary' : 'ghost'}
                  title={label as string}
                  aria-label={label as string}
                  aria-pressed={view === value}
                  onClick={() => setOptions((v) => ({ ...v, view: value as AlbumOptions['view'] }))}
                >
                  <Glyph className="size-4" />
                </Button>
              );
            })}
          </div>
        </div>
        {extraFilters > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              {owner === 'mine'
                ? '我上传的'
                : owner === 'partner'
                  ? `${profile.partner?.name || '另一半'}上传的`
                  : ''}
            </span>
            {(from || to) && (
              <span>
                {from || '不限'} — {to || '不限'}
              </span>
            )}
            <button
              className="ml-auto text-primary"
              onClick={() => setOptions((v) => ({ ...v, owner: 'all', from: '', to: '' }))}
            >
              清除筛选
            </button>
          </div>
        )}
      </div>
      <div className="px-5 pb-6 sm:px-8">
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : !items.length ? (
          <Empty
            title={
              term || type !== 'all' || extraFilters
                ? '没有找到符合条件的回忆'
                : '第一张回忆，等你来放'
            }
            detail={
              term || type !== 'all' || extraFilters
                ? '试试其他关键词，或清除筛选条件。'
                : '上传照片或视频，拍摄日期会自动识别。'
            }
            action={
              term || type !== 'all' || extraFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setOptions((v) => ({ ...albumDefaults, sort: v.sort, view: v.view }));
                  }}
                >
                  查看全部回忆
                </Button>
              ) : (
                <Button onClick={() => begin()}>收藏一个瞬间</Button>
              )
            }
          />
        ) : view === 'timeline' ? (
          <div className="album-timeline space-y-7">
            {[...monthGroups].map(([month, group]) => (
              <section key={month}>
                <h3 className="mb-3 flex items-center gap-3 text-sm font-medium">
                  <span>
                    {Number(month.slice(0, 4))} 年 {Number(month.slice(5))} 月
                  </span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {group.length} 个回忆
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </h3>
                <div className="album-grid">{group.map(tile)}</div>
              </section>
            ))}
          </div>
        ) : (
          <div className={view === 'compact' ? 'album-grid is-compact' : 'album-grid'}>
            {items.map(tile)}
          </div>
        )}
        {query.hasNextPage && (
          <div className="mt-6 text-center">
            <p className="mb-2 text-[11px] text-muted-foreground">
              已显示 {items.length} / {total} 个回忆
            </p>
            <Button
              variant="outline"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? '加载中…' : '加载更多回忆'}
            </Button>
          </div>
        )}
      </div>
      <Dialog
        open={transferOpen}
        onOpenChange={(value) => {
          if (!transferBusy) setTransferOpen(value);
        }}
      >
        <DialogContent>
          <DialogTitle>导出与导入相册</DialogTitle>
          <DialogDescription>导出整个两人相册，不受当前筛选影响。</DialogDescription>
          <div className="space-y-4">
            <label className="block space-y-2 text-sm">
              导出格式
              <select
                aria-label="相册导出格式"
                className="album-select mt-2 w-full"
                value={exportFormat}
                disabled={transferBusy}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              >
                <option value="pictures">普通照片 ZIP · JPEG 图片</option>
                <option value="archive">完整相册 ZIP · 可重新导入</option>
              </select>
            </label>
            <p className="text-xs leading-6 text-muted-foreground">
              {exportFormat === 'pictures'
                ? '仅导出照片为 JPEG，按相册日期命名，可直接解压查看。视频请使用完整相册导出。'
                : '保留照片、视频、日期、描述与已保存的原文件。仅保存压缩版本的媒体不会凭空恢复原文件。'}
            </p>
            <Button
              className="w-full"
              disabled={transferBusy}
              onClick={async () => {
                setTransferBusy(true);
                setTransferStatus('正在准备导出…');
                try {
                  toast.success(await exportAlbum(api, exportFormat, setTransferStatus));
                } catch (error) {
                  toast.error((error as Error).message || '导出失败，请重试');
                } finally {
                  setTransferBusy(false);
                  setTransferStatus('');
                }
              }}
            >
              导出相册 ZIP
            </Button>
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs leading-6 text-muted-foreground">
                导入完整相册 ZIP
                后，回忆由你发布，保留原日期和描述。原文件是否保存遵循当前两人空间设置；同一导入包重复选择不会重复添加。
              </p>
              <input
                ref={archiveInput}
                hidden
                type="file"
                accept="application/zip,.zip"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setTransferBusy(true);
                  setTransferStatus('正在上传导入包…');
                  try {
                    const result = await api.upload<{ imported: number; alreadyImported: boolean }>(
                      file,
                      (progress) =>
                        setTransferStatus(
                          progress === 100 ? '正在校验并导入…' : `上传 ${progress}%`,
                        ),
                      '/api/album/imports',
                    );
                    await cache.invalidateQueries({ queryKey: ['moments'] });
                    await cache.invalidateQueries({ queryKey: ['profile'] });
                    toast.success(
                      result.alreadyImported
                        ? '此导入包已导入，无需重复添加'
                        : `已导入 ${result.imported} 个回忆`,
                    );
                  } catch (error) {
                    toast.error((error as Error).message);
                  } finally {
                    setTransferBusy(false);
                    setTransferStatus('');
                  }
                }}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={transferBusy}
                onClick={() => archiveInput.current?.click()}
              >
                选择 ZIP 导入相册
              </Button>
            </div>
            {transferStatus && (
              <p className="text-xs text-muted-foreground" role="status">
                {transferStatus}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AlbumViewer
        api={api}
        item={current}
        index={index}
        total={total}
        previousItem={items[index - 1] || null}
        nextItem={items[index + 1] || null}
        previous={index > 0 ? () => setSelected(items[index - 1].id) : null}
        next={
          index >= 0 && (index + 1 < items.length || query.hasNextPage)
            ? () => void advance()
            : null
        }
        loading={query.isFetchingNextPage}
        onClose={() => setSelected(null)}
        onEdit={() => {
          if (current) begin(current);
        }}
        onDelete={() => {
          setRemove(current);
          setSelected(null);
        }}
        canEdit={current?.ownerId === profile.user.id}
        author={current?.ownerId === profile.user.id ? '我' : profile.partner?.name || '另一半'}
      />
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent>
          <DialogTitle>筛选相册</DialogTitle>
          <DialogDescription>
            按上传者和发生日期查找，照片与视频可在相册顶部切换。
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.from && draft.to && draft.from > draft.to) {
                setFilterError('开始日期不能晚于结束日期');
                return;
              }
              setOptions((v) => ({ ...v, owner: draft.owner, from: draft.from, to: draft.to }));
              setFilterOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="album-owner">上传者</Label>
              <select
                id="album-owner"
                className="album-select w-full"
                value={draft.owner}
                onChange={(e) =>
                  setDraft((v) => ({ ...v, owner: e.target.value as AlbumOptions['owner'] }))
                }
              >
                <option value="all">两个人</option>
                <option value="mine">我上传的</option>
                <option value="partner">{profile.partner?.name || '另一半'}上传的</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="album-from">开始日期</Label>
                <Input
                  id="album-from"
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  value={draft.from}
                  onChange={(e) => setDraft((v) => ({ ...v, from: e.target.value }))}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="album-to">结束日期</Label>
                <Input
                  id="album-to"
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  value={draft.to}
                  onChange={(e) => setDraft((v) => ({ ...v, to: e.target.value }))}
                />
              </div>
            </div>
            {filterError && (
              <p role="alert" className="text-xs text-destructive">
                {filterError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft((v) => ({ ...v, owner: 'all', from: '', to: '' }));
                  setFilterError('');
                }}
              >
                清除筛选
              </Button>
              <Button type="submit">应用筛选</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) closeDraft();
          else setOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? '编辑这个瞬间' : '收藏一个瞬间'}</DialogTitle>
            <DialogDescription>选择后自动上传并读取拍摄日期，每个文件分别保存。</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {!edit && (
              <div>
                <input
                  ref={input}
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/heic,video/mp4,video/quicktime,video/webm"
                  multiple
                  onChange={(e) => {
                    const chosen = Array.from(e.target.files || []);
                    const drafts = chosen.map((file) => ({
                      id: newId(),
                      file,
                      date: '',
                      editDate: false,
                    }));
                    void releaseDrafts();
                    setFiles(drafts);
                    e.target.value = '';
                    void prepare(drafts);
                  }}
                />
                <Button
                  className="h-20 w-full border-dashed"
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                >
                  {files.length ? (
                    <span className="truncate">已选择 {files.length} 个文件 · 点击重选</span>
                  ) : (
                    <>
                      <Plus size={18} />
                      选择照片或视频（可多选）
                    </>
                  )}
                </Button>
                {files.length > 0 && (
                  <UploadSelection
                    files={files}
                    busy={busy}
                    onRemove={(index) => {
                      const media = files[index]?.media;
                      if (media) void releaseDrafts([media.id]);
                      setFiles((items) => items.filter((_, i) => i !== index));
                    }}
                    onChange={(id, value) =>
                      setFiles((items) => items.map((v) => (v.id === id ? { ...v, ...value } : v)))
                    }
                  />
                )}
                {files.some((item) => item.error && !item.media) && (
                  <Button
                    className="mt-3"
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void prepare(files)}
                  >
                    重试上传失败的文件
                  </Button>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="memory-title">写下这一刻</Label>
              <Textarea
                id="memory-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={300}
                placeholder="为这张照片写点什么"
              />
            </div>
            {edit && (
              <div className="space-y-2">
                <Label htmlFor="memory-date">发生日期</Label>
                <Input
                  id="memory-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min="1900-01-01"
                  max="2100-12-31"
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy && !uploadController.current}
                onClick={closeDraft}
              >
                {uploadController.current ? '取消上传' : '取消'}
              </Button>
              <Button
                type="submit"
                disabled={busy || (!edit && (!files.length || files.some((item) => !item.media)))}
              >
                {busy
                  ? edit
                    ? '保存中…'
                    : `第 ${uploadIndex} / ${files.length} 个 · ${files.every((item) => item.media) ? '保存中…' : progress === 100 ? '处理并识别日期…' : `上传 ${progress}%`}`
                  : '保存回忆'}
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
