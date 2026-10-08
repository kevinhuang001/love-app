import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Pencil, Trash2 } from 'lucide-react';
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
  const [zoom, setZoom] = useState(false),
    [failed, setFailed] = useState(false),
    [offset, setOffset] = useState(0),
    [animated, setAnimated] = useState(false),
    [moving, setMoving] = useState(false);
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
    setZoom(false);
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
    setZoom(false);
    setFailed(false);
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
            onPointerDown={(e) => {
              if (
                zoom ||
                item.media.kind === 'video' ||
                moving ||
                loading ||
                !e.isPrimary ||
                e.button !== 0
              )
                return;
              gesture.current = {
                x: e.clientX,
                y: e.clientY,
                time: performance.now(),
                horizontal: false,
              };
              setAnimated(false);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const start = gesture.current;
              if (!start) return;
              const dx = e.clientX - start.x,
                dy = e.clientY - start.y;
              if (!start.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
                gesture.current = null;
                return;
              }
              if (Math.abs(dx) > 8) start.horizontal = true;
              if (start.horizontal) {
                const available = dx < 0 ? next : previous;
                setOffset(available ? dx : dx * 0.22);
              }
            }}
            onPointerUp={(e) => {
              const start = gesture.current;
              gesture.current = null;
              if (!start) return;
              const dx = e.clientX - start.x,
                dy = e.clientY - start.y;
              const width = e.currentTarget.clientWidth;
              const velocity = Math.abs(dx) / Math.max(1, performance.now() - start.time);
              if (
                start.horizontal &&
                Math.abs(dx) > Math.abs(dy) &&
                (Math.abs(dx) > Math.min(90, width * 0.22) ||
                  (Math.abs(dx) > 24 && velocity > 0.5)) &&
                (dx < 0 ? next : previous)
              )
                change(dx < 0 ? 1 : -1);
              else {
                setAnimated(true);
                setOffset(0);
              }
            }}
            onPointerCancel={() => {
              gesture.current = null;
              setAnimated(true);
              setOffset(0);
            }}
          >
            {zoom ? (
              <img src={api.url(item.media.previewUrl)} alt="照片大图" draggable={false} />
            ) : (
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
                    ) : moment.media.kind === 'video' && position === 1 ? (
                      <video
                        key={moment.id}
                        src={api.url(moment.media.previewUrl)}
                        poster={api.url(moment.media.thumbnailUrl)}
                        controls
                        autoPlay
                        playsInline
                        preload="metadata"
                        onError={() => setFailed(true)}
                      />
                    ) : (
                      <img
                        src={api.url(
                          moment.media.kind === 'video'
                            ? moment.media.thumbnailUrl
                            : moment.media.previewUrl,
                        )}
                        alt={position === 1 ? '照片大图' : ''}
                        onError={position === 1 ? () => setFailed(true) : undefined}
                        draggable={false}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
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
              {item.media.kind === 'image' && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white"
                  aria-label={zoom ? '还原照片' : '放大照片'}
                  onClick={() => setZoom((v) => !v)}
                >
                  {zoom ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
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
