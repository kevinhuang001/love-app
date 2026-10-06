import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import type { Api } from './api';
const mock = vi.hoisted(() => ({
  listeners: {} as Record<string, (...args: any[]) => void>,
  china: {
    register: vi.fn(),
    unregister: vi.fn(),
    status: vi.fn(),
    consumeOpen: vi.fn(),
    addListener: vi.fn(),
  },
  fcm: {
    register: vi.fn(),
    unregister: vi.fn(),
    requestPermissions: vi.fn(),
    createChannel: vi.fn(),
    addListener: vi.fn(),
    removeAllDeliveredNotifications: vi.fn(),
  },
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
  registerPlugin: () => mock.china,
}));
vi.mock('@capacitor/push-notifications', () => ({ PushNotifications: mock.fcm }));
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mock.listeners = {};
  const items = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => items.set(k, v),
    removeItem: (k: string) => items.delete(k),
  });
  vi.stubGlobal('window', { setTimeout, clearTimeout });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({
        json: async () => ({ jpushConfigured: true, firebaseConfigured: true }),
      }),
  );
  mock.china.addListener.mockImplementation(async (event, callback) => {
    mock.listeners[event] = callback;
    return {
      remove: async () => {
        delete mock.listeners[event];
      },
    };
  });
  mock.china.register.mockResolvedValue({ token: 'china-registration-id' });
  mock.china.consumeOpen.mockResolvedValue({ opened: false });
  mock.china.status.mockResolvedValue({ manufacturer: 'Xiaomi', vendor: '小米' });
  mock.china.unregister.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());
function api(providers = ['fcm', 'jpush']) {
  return {
    request: vi.fn().mockResolvedValue({ pushProviders: providers }),
    post: vi.fn().mockResolvedValue(undefined),
  };
}
test('China routing wins over configured FCM, registration is scoped to one installation and vendor status is truthful', async () => {
  const push = await import('./push'),
    server = api();
  await push.enablePush(server as unknown as Api, vi.fn(), vi.fn());
  expect(mock.fcm.register).not.toHaveBeenCalled();
  expect(server.post).toHaveBeenCalledWith('/api/devices', {
    provider: 'jpush',
    token: 'china-registration-id',
    installationId: expect.any(String),
  });
  expect(push.getDeviceToken()).toBe('jpush:china-registration-id');
  expect(await push.pushDescription()).toBe('小米厂商通道已注册');
  mock.china.status.mockResolvedValue({ manufacturer: 'Xiaomi', vendor: '' });
  expect(await push.pushDescription()).toContain('厂商通道待注册');
  await push.disablePush(server as unknown as Api);
  expect(server.request).toHaveBeenLastCalledWith('/api/devices', {
    method: 'DELETE',
    body: JSON.stringify({ provider: 'jpush', token: 'china-registration-id' }),
  });
  expect(mock.china.unregister).toHaveBeenCalledOnce();
  expect(push.getDeviceToken()).toBeUndefined();
});
test('cold notification opening reaches chat and refreshed RID replaces the same installation', async () => {
  const push = await import('./push'),
    server = api(),
    open = vi.fn();
  mock.china.consumeOpen.mockResolvedValue({ opened: true });
  await push.enablePush(server as unknown as Api, open, vi.fn());
  expect(open).toHaveBeenCalledOnce();
  const installationId = server.post.mock.calls[0][1].installationId;
  mock.listeners.registration({ token: 'refreshed-registration-id' });
  await vi.waitFor(() =>
    expect(server.post).toHaveBeenCalledWith('/api/devices', {
      provider: 'jpush',
      token: 'refreshed-registration-id',
      installationId,
    }),
  );
  await push.disablePush(server as unknown as Api);
});
test('a server registration failure stops native push; no silent FCM fallback', async () => {
  const push = await import('./push'),
    server = api();
  server.post.mockRejectedValue(new Error('服务器拒绝注册'));
  await expect(push.enablePush(server as unknown as Api, vi.fn(), vi.fn())).rejects.toThrow(
    '服务器拒绝注册',
  );
  expect(mock.china.unregister).toHaveBeenCalledOnce();
  expect(mock.fcm.register).not.toHaveBeenCalled();
  expect(localStorage.getItem('love.push.enabled')).toBeNull();
});
test('push stays stopped even when removing the remote device fails', async () => {
  const push = await import('./push'),
    server = api();
  await push.enablePush(server as unknown as Api, vi.fn(), vi.fn());
  server.request.mockRejectedValue(new Error('网络断开'));
  await expect(push.disablePush(server as unknown as Api)).rejects.toThrow('网络断开');
  expect(mock.china.unregister).toHaveBeenCalledOnce();
  expect(push.getDeviceToken()).toBeUndefined();
  expect(localStorage.getItem('love.push.enabled')).toBeNull();
});
test('no shared configured provider means no SDK registration', async () => {
  const push = await import('./push');
  await expect(push.enablePush(api([]) as unknown as Api, vi.fn(), vi.fn())).rejects.toThrow(
    '同一种推送渠道',
  );
  expect(mock.china.register).not.toHaveBeenCalled();
});
