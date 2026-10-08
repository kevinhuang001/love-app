import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api, readSession, saveSession, readLoginHints, saveLoginHints } from './api';
import { Preferences } from '@capacitor/preferences';

vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('persistent login state', () => {
  it('restores an existing session without retaining the password', async () => {
    const session = { server: 'http://192.168.1.10:8013', token: 'existing-session' };
    vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(session) });
    await expect(readSession()).resolves.toEqual(session);
    await saveSession(session);
    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'love.session',
      value: JSON.stringify(session),
    });
  });
  it('keeps server and username when logout removes the session', async () => {
    await saveLoginHints('https://love.example.com/', 'alice');
    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'love.login',
      value: JSON.stringify({ server: 'https://love.example.com', username: 'alice' }),
    });
    await saveSession(null);
    expect(Preferences.remove).toHaveBeenCalledWith({ key: 'love.session' });
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ server: 'https://love.example.com', username: 'alice' }),
    });
    await expect(readLoginHints()).resolves.toEqual({
      server: 'https://love.example.com',
      username: 'alice',
    });
  });
  it('ignores broken persisted state instead of blocking login', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: '{broken' });
    await expect(readLoginHints()).resolves.toBeNull();
    await expect(readSession()).resolves.toBeNull();
  });
});
describe('server connection feedback', () => {
  const api = new Api({ server: 'http://192.168.1.10:3000', token: '' });
  it('shows a Chinese connection error instead of the raw fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api.request('/api/auth/captcha')).rejects.toThrow('无法连接服务器');
  });
  it('keeps server rejection messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: '验证码不正确' }, { status: 400 })),
    );
    await expect(api.post('/api/auth/login', {})).rejects.toThrow('验证码不正确');
  });
  it('retains the timeout when the caller supplies a cancellation signal', async () => {
    const timeout = new AbortController();
    const caller = new AbortController();
    const timer = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal!.addEventListener('abort', () => reject(init.signal!.reason), {
              once: true,
            });
          }),
      ),
    );
    const result = api.request('/api/auth/captcha', { signal: caller.signal });
    const assertion = expect(result).rejects.toThrow('连接服务器超时');
    timeout.abort(new DOMException('Timed out', 'TimeoutError'));
    await assertion;
    expect(timer).toHaveBeenCalledWith(20_000);
    expect(caller.signal.aborted).toBe(false);
  });
  it('preserves caller cancellation when switching server', async () => {
    const caller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal!.addEventListener('abort', () => reject(init.signal!.reason), {
              once: true,
            });
          }),
      ),
    );
    const result = api.request('/api/auth/config', { signal: caller.signal });
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    caller.abort();
    await assertion;
  });
});

describe('connection test uses public Love endpoints', () => {
  const api = new Api({ server: 'http://192.168.1.10:3000', token: '' });
  const config = { registration: 'closed', registrationAvailable: false, mailAvailable: false };
  it('checks health and the usable login configuration without credentials', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          status: 'ok',
          version: '2.2.3',
          notifications: 'local',
          database: 'sqlite',
        }),
      )
      .mockResolvedValueOnce(Response.json(config));
    vi.stubGlobal('fetch', fetch);
    await expect(api.testConnection()).resolves.toEqual({ version: '2.2.3', config });
    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      'http://192.168.1.10:3000/api/health',
      'http://192.168.1.10:3000/api/auth/config',
    ]);
    for (const [, init] of fetch.mock.calls) {
      expect(init.body).toBeUndefined();
      expect(init.headers.Authorization).toBeUndefined();
    }
  });
  it('rejects unrelated servers, not just HTTP failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ status: 'ok', service: 'other' })),
    );
    await expect(api.testConnection()).rejects.toThrow('不是可用的 Love');
  });
  it('rejects malformed login configuration', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            status: 'ok',
            version: '2.2.3',
            notifications: 'local',
            database: 'postgres',
          }),
        )
        .mockResolvedValueOnce(Response.json({ registration: 'closed' })),
    );
    await expect(api.testConnection()).rejects.toThrow('登录接口响应异常');
  });
  it('explains an HTML page in Chinese', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>proxy</html>', { headers: { 'Content-Type': 'text/html' } }),
        ),
    );
    await expect(api.testConnection()).rejects.toThrow('没有返回有效的 Love 数据');
  });
});
