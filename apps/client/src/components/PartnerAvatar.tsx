import { useState } from 'react';
import { Avatar } from './common';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import type { Api } from '@/lib/api';
import type { User } from '@/lib/types';

export function PartnerAvatar({
  partner,
  api,
  small = false,
}: {
  partner: User;
  api: Api;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const src = partner.avatar ? api.url(partner.avatar.thumbnailUrl) : undefined;
  return (
    <>
      <button
        type="button"
        className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`查看${partner.name}的资料`}
        onClick={() => setOpen(true)}
      >
        <Avatar name={partner.name} src={src} small={small} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{partner.name}的资料</DialogTitle>
          <DialogDescription>你的另一半</DialogDescription>
          <div className="flex flex-col items-center gap-4 py-3">
            <Avatar name={partner.name} src={src} large />
            <dl className="grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">昵称</dt>
              <dd className="break-words">{partner.name}</dd>
              <dt className="text-muted-foreground">用户名</dt>
              <dd className="break-words">{partner.username}</dd>
            </dl>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
