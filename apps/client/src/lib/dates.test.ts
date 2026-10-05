import { describe, it, expect } from 'vitest';
import { countdown, daysTogether, nextTodo, solarDate, lunarLabel } from './dates';
import { normalizeServer } from './api';
describe('calendar days', () => {
  it('counts inclusive relationship days', () => {
    expect(daysTogether('2026-10-01', '2026-10-05')).toBe(5);
  });
  it('handles leap-year anniversaries on the last valid February day', () => {
    expect(countdown('2024-02-29', true, '2026-02-28')).toBe(0);
  });
  it('rolls annual dates forward, preserving one-time dates', () => {
    expect(countdown('2020-10-01', true, '2026-10-05')).toBe(361);
    expect(countdown('2026-10-01', false, '2026-10-05')).toBe(-4);
  });
});
describe('backend URL', () => {
  it('normalizes a server origin', () =>
    expect(normalizeServer(' https://love.example.com/ ')).toBe('https://love.example.com'));
  it('rejects credentials, paths, unsafe protocols and remote cleartext', () => {
    for (const value of [
      'ftp://example.com',
      'https://user:pass@example.com',
      'https://example.com/api',
      'http://example.com',
      'https://example.com/?key=secret',
    ])
      expect(() => normalizeServer(value)).toThrow();
  });
  it('permits the Android emulator development host', () =>
    expect(normalizeServer('http://10.0.2.2:3000')).toBe('http://10.0.2.2:3000'));
});

describe('separate memories and scheduled lunar todos', () => {
  it('anniversaries count upward and never become a negative countdown', () => {
    expect(daysTogether('2025-01-01', '2026-01-01')).toBe(366);
    expect(daysTogether('2026-01-01', '2026-01-01')).toBe(1);
  });
});

describe('solar and lunar recurrence', () => {
  const qixi = {
    date: '2026-07-07',
    calendar: 'lunar' as const,
    leapMonth: false,
    repeat: 'yearly' as const,
  };
  it('converts Qixi and rolls the lunar holiday into the next lunar year', () => {
    expect(solarDate(qixi)).toBe('2026-08-19');
    expect(nextTodo(qixi, '2026-08-19')).toEqual({ date: '2026-08-19', days: 0 });
    expect(nextTodo(qixi, '2026-08-20')?.date).toBe('2027-08-08');
    expect(lunarLabel(qixi)).toBe('农历七月初七');
  });
  it('completion of a recurring todo advances the occurrence even when completed early', () => {
    expect(nextTodo({ ...qixi, completedDate: '2026-08-19' }, '2026-08-01')?.date).toBe(
      '2027-08-08',
    );
    expect(nextTodo({ ...qixi, repeat: 'none' }, '2026-08-20')?.days).toBe(-1);
  });
  it('handles real leap lunar months and rejects nonexistent dates', () => {
    expect(solarDate({ date: '2023-02-01', calendar: 'lunar', leapMonth: true })).toBe(
      '2023-03-22',
    );
    expect(() => solarDate({ date: '2026-02-01', calendar: 'lunar', leapMonth: true })).toThrow();
    expect(() => solarDate({ date: '2026-02-30', calendar: 'solar', leapMonth: false })).toThrow();
    expect(
      Date.parse(nextTodo({ ...qixi, date: '2023-02-01', leapMonth: true }, '2023-03-23')!.date),
    ).toBeGreaterThan(Date.parse('2023-03-22'));
  });
  it('does not create occurrences before the selected anchor year', () => {
    expect(
      nextTodo(
        { date: '2030-02-14', calendar: 'solar', leapMonth: false, repeat: 'yearly' },
        '2026-01-01',
      )?.date,
    ).toBe('2030-02-14');
  });
});
