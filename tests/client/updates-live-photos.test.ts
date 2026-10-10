import { describe, expect, it } from 'vitest';
import { newerVersion } from '../../apps/client/src/lib/updates';
import { pairLivePhotos } from '../../apps/client/src/lib/live-photos';
import { annualDate, nextTodoInstant, scheduleInstant } from '@love/calendar';

describe('Android versions and Live Photo file pairing', () => {
  it('compares numeric versions and avoids offering downgrades', () => {
    expect(newerVersion('v2.10.0', '2.9.4')).toBe(true);
    expect(newerVersion('v2.9.4', '2.10.0')).toBe(false);
    expect(newerVersion('v2.10.0', '2.10.0')).toBe(false);
    expect(() => newerVersion('latest', '2.10.0')).toThrow();
  });
  it('pairs a matching exported MOV once while keeping unrelated videos separate', () => {
    const photo = { name: 'IMG_1234.HEIC' } as File,
      video = { name: 'img_1234.MOV' } as File,
      separate = { name: 'trip.mov' } as File;
    expect(pairLivePhotos([photo, video, separate])).toEqual([
      { file: photo, liveVideo: video },
      { file: separate, liveVideo: undefined },
    ]);
    expect(pairLivePhotos([photo, video, { name: 'IMG_1234.mov' } as File])).toHaveLength(3);
  });
  it('annual month/day values accept leap days without asking for an anchor year', () => {
    const date = annualDate('02-29');
    const next = nextTodoInstant(
      { date, calendar: 'solar', repeat: 'yearly', leapMonth: false, time: '12:00:00' },
      scheduleInstant('2026-02-01', '12:00:00'),
    );
    expect(next?.date).toBe('2026-02-28');
    expect(() => annualDate('02-30')).toThrow();
    const lunar = annualDate('02-01', 'lunar', true);
    expect(
      nextTodoInstant(
        { date: lunar, calendar: 'lunar', repeat: 'yearly', leapMonth: true },
        scheduleInstant('2026-01-01'),
      ),
    ).not.toBeNull();
  });
});
