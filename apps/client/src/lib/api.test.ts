import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api } from './api';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
