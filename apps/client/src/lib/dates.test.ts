import { describe, it, expect } from 'vitest';
import { daysTogether, nextTodo, solarDate, lunarLabel } from './dates';
import { normalizeServer } from './api';
import {
  clockTime,
  durationParts,
  elapsedSeconds,
  nextTodoInstant,
  scheduleInstant,
  validTime,
} from '@love/calendar';
describe('second-precision schedules in Shanghai time', () => {
  it('retains selected seconds and uses a fixed shared timezone', () => {
    expect(clockTime(Date.parse('2026-10-08T04:05:06Z'))).toBe('12:05:06');
    expect(scheduleInstant('2026-10-08', '12:05:06')).toBe(Date.parse('2026-10-08T04:05:06Z'));
    for (const time of ['24:00:00', '12:60:00', '12:00:60', '12:00', 'bad'])
      expect(validTime(time)).toBe(false);
    expect(() => scheduleInstant('2026-02-31', '00:00:00')).toThrow();
  });
  it('counts elapsed and remaining seconds accurately across midnight', () => {
    const current = scheduleInstant('2026-10-09', '00:00:05');
    expect(elapsedSeconds('2026-10-08', '23:59:55', current)).toBe(10);
    expect(
      nextTodoInstant(
        {
          date: '2026-10-09',
          time: '00:00:15',
          calendar: 'solar',
          leapMonth: false,
          repeat: 'none',
        },
        current,
      )?.seconds,
    ).toBe(10);
    expect(durationParts(90061)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 });
  });
  it('rolls annual solar dates only after the selected time, preserving leap-year rules', () => {
    const todo = {
      date: '2024-02-29',
      time: '20:30:40',
      calendar: 'solar' as const,
      leapMonth: false,
      repeat: 'yearly' as const,
    };
    expect(nextTodoInstant(todo, scheduleInstant('2026-02-28', '20:30:39'))?.seconds).toBe(1);
    expect(nextTodoInstant(todo, scheduleInstant('2026-02-28', '20:30:40'))?.seconds).toBe(0);
    expect(nextTodoInstant(todo, scheduleInstant('2026-02-28', '20:30:41'))?.date).toBe(
      '2027-02-28',
    );
  });
  it('preserves the time through lunar recurrence and early completion', () => {
    const todo = {
      date: '2026-07-07',
      time: '20:30:40',
      calendar: 'lunar' as const,
      leapMonth: false,
      repeat: 'yearly' as const,
    };
    expect(nextTodoInstant(todo, scheduleInstant('2026-08-19', '20:30:39'))?.seconds).toBe(1);
    const next = nextTodoInstant(todo, scheduleInstant('2026-08-19', '20:30:41'));
    expect(next?.date).toBe('2027-08-08');
    expect(next?.time).toBe('20:30:40');
    expect(
      nextTodoInstant(
        { ...todo, completedDate: '2026-08-19' },
        scheduleInstant('2026-08-01', '00:00:00'),
      )?.date,
    ).toBe('2027-08-08');
  });
});
describe('calendar days', () => {
  it('counts inclusive relationship days', () => {
    expect(daysTogether('2026-10-01', '2026-10-05')).toBe(5);
  });
  it('handles leap-year anniversaries on the last valid February day', () => {
    expect(
      nextTodo(
        { date: '2024-02-29', calendar: 'solar', leapMonth: false, repeat: 'yearly' },
        '2026-02-28',
      )?.days,
    ).toBe(0);
  });
  it('rolls annual dates forward, preserving one-time dates', () => {
    expect(
      nextTodo(
        { date: '2020-10-01', calendar: 'solar', leapMonth: false, repeat: 'yearly' },
        '2026-10-05',
      )?.days,
    ).toBe(361);
    expect(
      nextTodo(
        { date: '2026-10-01', calendar: 'solar', leapMonth: false, repeat: 'none' },
        '2026-10-05',
      )?.days,
    ).toBe(-4);
  });
});
describe('backend URL', () => {
  it('normalizes a server origin', () =>
    expect(normalizeServer(' https://love.example.com/ ')).toBe('https://love.example.com'));
  it('rejects credentials, paths, unsafe protocols and incomplete addresses', () => {
    for (const value of [
      'ftp://example.com',
      'https://user:pass@example.com',
      'https://example.com/api',
      '192.168.1.10:3000',
      '',
      'http://0.0.0.0:3000',
      'http://[::]:3000',
      'https://example.com/?key=secret',
      'https://example.com/#token',
    ])
      expect(() => normalizeServer(value)).toThrow();
  });
  it('permits HTTP self-hosted domains and IPv4/IPv6 addresses', () => {
    for (const value of [
      'http://example.com',
      'http://192.168.1.10:3000',
      'http://203.0.113.10:8080',
      'http://[2001:db8::1]:3000',
    ])
      expect(normalizeServer(` ${value}/ `)).toBe(value);
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
