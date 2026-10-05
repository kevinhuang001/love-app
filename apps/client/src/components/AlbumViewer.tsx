import { useEffect, useRef, useState } from 'react';
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
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  author: string;
  canEdit: boolean;
}) {
  const [zoom, setZoom] = useState(false),
    [failed, setFailed] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    setZoom(false);
    setFailed(false);
  }, [item?.id]);
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
              previous();
            }
            if (e.key === 'ArrowRight' && next) {
              e.preventDefault();
              next();
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
            onTouchStart={(e) => {
              touch.current =
                e.touches.length === 1
                  ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                  : null;
            }}
            onTouchEnd={(e) => {
              if (
                zoom ||
                item.media.kind === 'video' ||
                !touch.current ||
                e.changedTouches.length !== 1
              )
                return;
              const dx = e.changedTouches[0].clientX - touch.current.x,
                dy = e.changedTouches[0].clientY - touch.current.y;
              touch.current = null;
              if (Math.abs(dx) > 70 && Math.abs(dy) < 45) {
                if (dx < 0) next?.();
                else previous?.();
              }
            }}
          >
            {failed ? (
              <p role="alert" className="text-sm text-white/70">
                预览加载失败，请关闭后重试
              </p>
            ) : item.media.kind === 'video' ? (
              <video
                key={item.id}
                src={api.url(item.media.previewUrl)}
                poster={api.url(item.media.thumbnailUrl)}
                controls
                autoPlay
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
              />
            ) : (
              <img
                key={item.id}
                src={api.url(item.media.previewUrl)}
                alt="照片大图"
                onError={() => setFailed(true)}
                draggable={false}
              />
            )}
          </div>
          <footer className="album-viewer-footer shrink-0 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white"
                aria-label="上一项回忆"
                disabled={!previous || loading}
                onClick={() => previous?.()}
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
                disabled={!next || loading}
                onClick={() => next?.()}
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
