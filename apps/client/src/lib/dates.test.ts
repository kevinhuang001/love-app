import { describe, it, expect } from 'vitest';
import { countdown, daysTogether } from './dates';
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
