import { Heart, LoaderCircle, Play, ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import type { Api } from '@/lib/api';
import type { Media } from '@/lib/types';
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-primary ${large ? 'size-20 text-3xl' : 'size-10 text-base'}`}
    >
      {Array.from(name)[0]}
    </span>
  );
}
export function Empty({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 grid size-16 place-items-center rounded-3xl bg-secondary text-primary">
        <Heart size={28} strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function Loading() {
  return (
    <div className="grid min-h-40 place-items-center" role="status">
      <LoaderCircle className="animate-spin text-primary" />
      <span className="sr-only">加载中</span>
    </div>
  );
}
export function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="p-8 text-center">
      <p role="alert" className="mb-3 text-sm text-destructive">
        {error.message}
      </p>
      <Button variant="outline" onClick={retry}>
        重新加载
      </Button>
    </div>
  );
}
export function MediaPreview({
  api,
  media,
  compact = false,
}: {
  api: Api;
  media: Media;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={media.kind === 'video' ? '播放视频' : '查看图片'}
        className={`relative block w-full overflow-hidden rounded-xl bg-secondary ${compact ? 'max-w-64' : ''}`}
        onClick={() => setOpen(true)}
      >
        {failed ? (
          <div className="grid aspect-square place-items-center">
            <ImageOff />
          </div>
        ) : (
          <img
            loading="lazy"
            decoding="async"
            src={api.url(media.thumbnailUrl)}
            onError={() => setFailed(true)}
            alt={media.kind === 'video' ? '视频封面' : '回忆照片'}
            className="max-h-72 w-full object-cover"
          />
        )}
        {media.kind === 'video' && (
          <>
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-10 place-items-center rounded-full bg-black/40 text-white">
                <Play size={18} fill="currentColor" />
              </span>
            </span>
            <span className="absolute right-2 bottom-2 rounded bg-black/50 px-1.5 text-xs text-white">
              {Math.round(media.duration || 0)} 秒
            </span>
          </>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{media.kind === 'video' ? '一起看这段回忆' : '一起看这张照片'}</DialogTitle>
          <DialogDescription>加载手机适用的压缩预览</DialogDescription>
          {open &&
            (media.kind === 'video' ? (
              <video
                src={api.url(media.previewUrl)}
                poster={api.url(media.thumbnailUrl)}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="max-h-[70dvh] w-full rounded-xl"
              />
            ) : (
              <img
                src={api.url(media.previewUrl)}
                alt="照片大图"
                className="max-h-[70dvh] w-full rounded-xl object-contain"
              />
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
