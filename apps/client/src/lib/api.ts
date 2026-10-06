import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import type { Session, UploadedMedia } from './types';
export function normalizeServer(input: string): string {
  const url = new URL(input.trim());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== '/' && url.pathname !== '')
  )
    throw new Error('请输入服务器根地址，例如 https://love.example.com');
  if (
    url.protocol !== 'https:' &&
    !['localhost', '127.0.0.1', '10.0.2.2', '[::1]'].includes(url.hostname)
  )
    throw new Error('服务器必须使用 HTTPS；本地开发可以使用 HTTP');
  return url.origin;
}
export class Api {
  constructor(
    public session: Session,
    public unauthorized: () => void = () => {},
  ) {}
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.session.server}${path}`, {
      ...init,
      headers: {
        ...(init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(this.session.token ? { Authorization: `Bearer ${this.session.token}` } : {}),
        ...init.headers,
      },
      signal: init.signal || AbortSignal.timeout(init.body instanceof FormData ? 240_000 : 20_000),
    });
    if (response.status === 401 && this.session.token) this.unauthorized();
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `服务器返回 ${response.status}`);
    }
    return response.status === 204 ? (undefined as T) : response.json();
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }
  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }
  delete(path: string) {
    return this.request<void>(path, { method: 'DELETE' });
  }
  url(path: string) {
    return `${this.session.server}${path}`;
  }
  async upload(file: File, onProgress: (progress: number) => void, path = '/api/media'): Promise<UploadedMedia> {
    if (file.size > 100 * 1024 * 1024) throw new Error('文件不能超过 100 MB');
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.url(path));
      xhr.timeout = 240_000;
      xhr.setRequestHeader('Authorization', `Bearer ${this.session.token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onerror = () => reject(new Error('上传失败，请检查网络'));
      xhr.ontimeout = () => reject(new Error('处理超时，请使用更短的视频'));
      xhr.onload = () => {
        const result = (() => {
          try {
            return JSON.parse(xhr.responseText);
          } catch {
            return {};
          }
        })();
        if (xhr.status === 401) this.unauthorized();
        xhr.status >= 200 && xhr.status < 300
          ? resolve(result)
          : reject(new Error(result.error || '上传失败'));
      };
      const form = new FormData();
      form.append('file', file);
      xhr.send(form);
    });
  }
}
// Session tokens stay scoped to the selected backend. Android Preferences persist across app restarts.
export async function readSession(): Promise<Session | null> {
  const { value } = await Preferences.get({ key: 'love.session' });
  try {
    const s = value ? JSON.parse(value) : null;
    return s && typeof s.token === 'string' && s.token && typeof s.server === 'string'
      ? { server: normalizeServer(s.server), token: s.token }
      : null;
  } catch {
    return null;
  }
}
export async function saveSession(session: Session | null) {
  if (session) await Preferences.set({ key: 'love.session', value: JSON.stringify(session) });
  else await Preferences.remove({ key: 'love.session' });
}
export function defaultServer() {
  return (
    import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? '' : window.location.origin)
  );
}
