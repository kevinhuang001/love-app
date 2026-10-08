import { durationParts } from '@love/calendar';
export function Duration({ seconds }: { seconds: number }) {
  const value = durationParts(seconds);
  return (
    <span
      className="inline-flex flex-col items-end gap-1 tabular-nums"
      data-testid="duration"
      data-seconds={seconds}
    >
      <span>
        <span className="text-2xl">{value.days}</span>
        <span className="ml-1 text-xs">天</span>
      </span>
      <span className="text-sm tracking-wide">
        {[value.hours, value.minutes, value.seconds]
          .map((v) => String(v).padStart(2, '0'))
          .join(':')}
      </span>
    </span>
  );
}
