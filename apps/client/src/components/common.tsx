import { MessageCircle, LoaderCircle, Play, ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import type { Api } from '@/lib/api';
import type { Media } from '@/lib/types';
export function Avatar({
  name,
  large = false,
  src,
  alt,
  small = false,
}: {
  name: string;
  large?: boolean;
  small?: boolean;
  src?: string;
  alt?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const classes = `person-avatar shrink-0 rounded-full ${large ? 'size-20 text-2xl' : small ? 'size-8 text-xs' : 'size-10 text-sm'}`;
  if (src && failedSrc !== src)
    return (
      <img
        alt={alt || `${name}的头像`}
        src={src}
        onError={() => setFailedSrc(src)}
        className={`${classes} object-cover`}
      />
    );
  return (
    <span
      role="img"
      aria-label={alt || `${name}的头像`}
      className={`${classes} grid place-items-center bg-secondary font-medium text-primary`}
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
      <div className="mb-5 grid size-12 place-items-center rounded-full border text-muted-foreground">
        <MessageCircle size={21} strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 max-w-xs text-xs leading-6 text-muted-foreground">{detail}</p>
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
export function MediaThumbnail({
  api,
  media,
  onClick,
  label,
  className = '',
}: {
  api: Api;
  media: Media;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      aria-label={label || (media.kind === 'video' ? '播放视频' : '查看图片')}
      className={`media-thumbnail relative block w-full overflow-hidden rounded-xl bg-secondary ${className}`}
      onClick={onClick}
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
          <span className="absolute right-2 bottom-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
            {Math.floor((media.duration || 0) / 60)}:
            {String(Math.round(media.duration || 0) % 60).padStart(2, '0')}
          </span>
        </>
      )}
    </button>
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <MediaThumbnail
        api={api}
        media={media}
        onClick={() => setOpen(true)}
        className={compact ? 'max-w-64' : ''}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{media.kind === 'video' ? '视频预览' : '照片预览'}</DialogTitle>
          <DialogDescription>轻点关闭返回聊天</DialogDescription>
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
