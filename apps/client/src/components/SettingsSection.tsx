import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <details
      className="settings-section group rounded-2xl border bg-card text-card-foreground"
      data-section={title}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={16}
          className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-4 border-t px-5 py-5">{children}</div>
    </details>
  );
}
