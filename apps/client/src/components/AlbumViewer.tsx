import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Pencil, Trash2, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import type { Api } from '@/lib/api';
import type { Moment } from '@/lib/types';
export function AlbumViewer({
  api,
  item,
  index,
  total,
  previous,
  next,
  previousItem,
  nextItem,
  loading,
  onClose,
  onEdit,
  onDelete,
  author,
  canEdit,
}: {
  api: Api;
  item: Moment | null;
  index: number;
  total: number;
  previous: (() => void) | null;
  next: (() => void) | null;
  previousItem: Moment | null;
  nextItem: Moment | null;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  author: string;
  canEdit: boolean;
}) {
  const [scale, setScale] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [playing, setPlaying] = useState(false),
    [failed, setFailed] = useState(false),
    [offset, setOffset] = useState(0),
    [animated, setAnimated] = useState(false),
    [moving, setMoving] = useState(false);
  const zoom = scale > 1;
  const points = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{
    distance: number;
    scale: number;
    pan: { x: number; y: number };
    center: { x: number; y: number };
  } | null>(null);
  function transform(nextScale: number, nextPan = pan) {
    const value = Math.max(1, Math.min(5, nextScale));
    const bounds = viewport.current?.getBoundingClientRect();
    const width = bounds?.width || 0,
      height = bounds?.height || 0;
    const fit = item ? Math.min(width / (item.media.width || width), height / (item.media.height || height)) : 1;
    const maxX = Math.max(0, ((item?.media.width || width) * fit * value - width) / 2);
    const maxY = Math.max(0, ((item?.media.height || height) * fit * value - height) / 2);
    setScale(value);
    setPan({
      x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
      y: Math.max(-maxY, Math.min(maxY, nextPan.y)),
    });
  }
  function resetZoom() {
    setScale(1);
    setPan({ x: 0, y: 0 });
    points.current.clear();
    pinch.current = null;
  }
  function startPinch() {
    const [a, b] = [...points.current.values()];
    if (!a || !b) return;
    pinch.current = {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      scale,
      pan,
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
    gesture.current = null;
    setOffset(0);
  }
  const viewport = useRef<HTMLDivElement>(null),
    gesture = useRef<{ x: number; y: number; time: number; horizontal: boolean } | null>(null),
    navigation = useRef<{
      direction: number;
      commit: (() => void) | null;
      fetching: boolean;
    } | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finish = () => {
    const pending = navigation.current;
    if (!pending?.commit || pending.fetching) return;
    const commit = pending.commit;
    pending.commit = null;
    clearTimeout(timer.current);
    commit();
  };
  function change(direction: -1 | 1) {
    const commit = direction === 1 ? next : previous;
    if (!commit || moving || loading || navigation.current) return;
    resetZoom();
    setMoving(true);
    const width = viewport.current?.clientWidth || window.innerWidth;
    const ready = direction === 1 ? nextItem : previousItem;
    navigation.current = { direction, commit: ready ? commit : null, fetching: !ready };
    if (!ready) {
      commit();
      return;
    }
    setAnimated(true);
    setOffset(-direction * width);
    timer.current = setTimeout(
      finish,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
    );
  }
  useLayoutEffect(() => {
    const pending = navigation.current;
    clearTimeout(timer.current);
    navigation.current = null;
    gesture.current = null;
    resetZoom();
    setFailed(false);
    setPlaying(false);
    setMoving(false);
    setAnimated(false);
    if (pending?.fetching && item) {
      setOffset(pending.direction * (viewport.current?.clientWidth || window.innerWidth));
      const frame = requestAnimationFrame(() => {
        setAnimated(true);
        setOffset(0);
      });
      return () => cancelAnimationFrame(frame);
    }
    setOffset(0);
  }, [item?.id]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!loading && navigation.current?.fetching) {
      // Pagination can fail without replacing the image; keep the current preview usable.
      navigation.current = null;
      setMoving(false);
      setAnimated(true);
      setOffset(0);
    }
  }, [loading]);
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      {item && (
        <DialogContent
          showCloseButton={false}
          fullScreen
          className="album-viewer"
          onKeyDown={(e) => {
            if (
              e.target instanceof HTMLVideoElement ||
              e.target instanceof HTMLInputElement ||
              e.target instanceof HTMLTextAreaElement ||
              e.altKey ||
              e.ctrlKey ||
              e.metaKey
            )
              return;
            if (e.key === 'ArrowLeft' && previous) {
              e.preventDefault();
              change(-1);
            }
            if (e.key === 'ArrowRight' && next) {
              e.preventDefault();
              change(1);
            }
          }}
        >
          <header className="album-viewer-header flex shrink-0 items-start gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate pr-0 text-base text-white">
                {item.title || '未命名回忆'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-white/60">
                {item.date} · {author}上传
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="关闭"
              onClick={onClose}
              className="text-white"
            >
              <X className="size-5" />
            </Button>
          </header>
          <div
            className={`album-viewer-media ${zoom ? 'is-zoomed' : ''}`}
            ref={viewport}
            onWheel={(e) => {
              if (item.media.kind === 'video' || playing) return;
              transform(scale * Math.exp(-e.deltaY * 0.002));
            }}
            onDoubleClick={() => {
              if (item.media.kind !== 'video' && !playing) transform(zoom ? 1 : 2);
            }}
            onPointerDown={(e) => {
              if (item.media.kind === 'video' || playing || moving || loading || e.button !== 0)
                return;
              points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              e.currentTarget.setPointerCapture(e.pointerId);
              if (points.current.size === 2) {
                startPinch();
                return;
              }
              gesture.current = {
                x: e.clientX,
                y: e.clientY,
                time: performance.now(),
                horizontal: false,
              };
              setAnimated(false);
            }}
            onPointerMove={(e) => {
              const old = points.current.get(e.pointerId);
              if (!old) return;
              points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              const pair = pinch.current;
              if (points.current.size >= 2 && pair) {
                const [a, b] = [...points.current.values()];
                const nextScale = Math.max(
                  1,
                  Math.min(
                    5,
                    (pair.scale * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, pair.distance),
                  ),
                );
                const ratio = nextScale / pair.scale;
                const bounds = viewport.current!.getBoundingClientRect();
                const focal = {
                  x: pair.center.x - bounds.left - bounds.width / 2,
                  y: pair.center.y - bounds.top - bounds.height / 2,
                };
                transform(nextScale, {
                  x: focal.x + (pair.pan.x - focal.x) * ratio + (a.x + b.x) / 2 - pair.center.x,
                  y: focal.y + (pair.pan.y - focal.y) * ratio + (a.y + b.y) / 2 - pair.center.y,
                });
                return;
              }
              if (zoom) {
                transform(scale, { x: pan.x + e.clientX - old.x, y: pan.y + e.clientY - old.y });
                return;
              }
              const start = gesture.current;
              if (!start) return;
              const dx = e.clientX - start.x,
                dy = e.clientY - start.y;
              if (!start.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
                gesture.current = null;
                return;
              }
              if (Math.abs(dx) > 8) start.horizontal = true;
              if (start.horizontal) setOffset((dx < 0 ? next : previous) ? dx : dx * 0.22);
            }}
            onPointerUp={(e) => {
              points.current.delete(e.pointerId);
              if (pinch.current || zoom) {
                pinch.current = null;
                gesture.current = null;
                return;
              }
              const start = gesture.current;
              gesture.current = null;
              if (!start) return;
              const dx = e.clientX - start.x,
                dy = e.clientY - start.y;
              const velocity = Math.abs(dx) / Math.max(1, performance.now() - start.time);
              if (
                start.horizontal &&
                Math.abs(dx) > Math.abs(dy) &&
                (Math.abs(dx) > Math.min(90, e.currentTarget.clientWidth * 0.22) ||
                  (Math.abs(dx) > 24 && velocity > 0.5)) &&
                (dx < 0 ? next : previous)
              )
                change(dx < 0 ? 1 : -1);
              else {
                setAnimated(true);
                setOffset(0);
              }
            }}
            onPointerCancel={(e) => {
              points.current.delete(e.pointerId);
              pinch.current = null;
              gesture.current = null;
              setAnimated(true);
              setOffset(0);
            }}
          >
            {
              <div
                className="album-viewer-track"
                data-moving={moving}
                style={{
                  transform: `translate3d(calc(-100% + ${offset}px),0,0)`,
                  transition: animated ? 'transform 280ms cubic-bezier(.22,.68,0,1)' : 'none',
                }}
                onTransitionEnd={(e) => {
                  if (e.target === e.currentTarget && e.propertyName === 'transform') finish();
                }}
              >
                {[previousItem, item, nextItem].map((moment, position) => (
                  <div
                    key={moment?.id || `empty-${position}`}
                    className="album-viewer-slide"
                    aria-hidden={position !== 1}
                  >
                    {!moment ? null : position === 1 && failed ? (
                      <p role="alert" className="text-sm text-white/70">
                        预览加载失败，请关闭后重试
                      </p>
                    ) : (moment.media.kind === 'video' ||
                        (moment.media.kind === 'live' && playing)) &&
                      position === 1 ? (
                      <video
                        key={moment.id}
                        src={api.url(moment.media.motionUrl || moment.media.previewUrl)}
                        poster={api.url(moment.media.thumbnailUrl)}
                        controls
                        autoPlay
                        playsInline
                        preload="metadata"
                        onEnded={() => setPlaying(false)}
                        onError={() => setFailed(true)}
                      />
                    ) : (
                      <img
                        src={api.url(
                          moment.media.kind === 'video'
                            ? moment.media.thumbnailUrl
                            : moment.media.previewUrl,
                        )}
                        style={
                          position === 1
                            ? {
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                                cursor: zoom ? 'grab' : 'default',
                              }
                            : undefined
                        }
                        alt={position === 1 ? '照片大图' : ''}
                        onError={position === 1 ? () => setFailed(true) : undefined}
                        draggable={false}
                      />
                    )}
                  </div>
                ))}
              </div>
            }
          </div>
          <footer className="album-viewer-footer shrink-0 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white"
                aria-label="上一项回忆"
                disabled={!previous || loading || moving}
                onClick={() => change(-1)}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span aria-live="polite" className="text-xs tabular-nums text-white/70">
                {index + 1} / {total}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="text-white"
                aria-label="下一项回忆"
                disabled={!next || loading || moving}
                onClick={() => change(1)}
              >
                <ChevronRight className="size-5" />
              </Button>
              {item.media.kind !== 'video' && !playing && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white"
                  aria-label={zoom ? '还原照片' : '放大照片'}
                  onClick={() => transform(zoom ? 1 : 2)}
                >
                  {zoom ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
                </Button>
              )}
              {item.media.kind === 'live' && (
                <Button
                  variant="ghost"
                  className="text-white"
                  aria-label={playing ? '停止实况' : '播放实况'}
                  onClick={() => {
                    resetZoom();
                    setPlaying((v) => !v);
                  }}
                >
                  <Play size={16} />
                  {playing ? '停止' : '实况'}
                </Button>
              )}
              {canEdit && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white"
                    aria-label="编辑回忆"
                    onClick={onEdit}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white"
                    aria-label="删除回忆"
                    onClick={onDelete}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </footer>
        </DialogContent>
      )}
    </Dialog>
  );
}
