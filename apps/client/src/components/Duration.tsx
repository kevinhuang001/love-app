import { durationParts } from '@love/calendar';
import { cn } from '@/lib/utils';

export function Duration({
  seconds,
  variant = 'compact',
}: {
  seconds: number;
  variant?: 'compact' | 'featured';
}) {
  const value = durationParts(seconds);
  const featured = variant === 'featured';
  return (
    <span
      className={cn(
        'inline-flex flex-col tabular-nums',
        featured ? 'items-start gap-3' : 'items-end gap-1',
      )}
      data-testid="duration"
      data-seconds={seconds}
    >
      <span>
        <span
          className={
            featured ? 'text-6xl font-medium leading-none tracking-tight sm:text-7xl' : 'text-2xl'
          }
        >
          {value.days}
        </span>
        <span className={cn('ml-1', featured ? 'text-base' : 'text-xs')}>天</span>
      </span>
      <span className={cn('text-[11px] tracking-wider', featured && 'opacity-80')}>
        {[value.hours, value.minutes, value.seconds]
          .map((v) => String(v).padStart(2, '0'))
          .join(':')}
      </span>
    </span>
  );
}
