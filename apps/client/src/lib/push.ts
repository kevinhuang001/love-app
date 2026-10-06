import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Api } from './api';
type Provider = 'fcm' | 'jpush';
type Device = { provider: Provider; token: string };
const ChinaPush = registerPlugin<{
  register(): Promise<{ token: string }>;
  unregister(): Promise<void>;
  status(): Promise<{ manufacturer: string; vendor: string }>;
  consumeOpen(): Promise<{ opened: boolean }>;
  addListener(
    event: 'registration',
    listener: (data: { token: string }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(event: 'openChat', listener: () => void): Promise<PluginListenerHandle>;
}>('ChinaPush');
let device: Device | undefined;
let handles: PluginListenerHandle[] = [];
let generation = 0;
let enabledProvider: Provider | undefined;
export function getDeviceToken() {
  return device ? `${device.provider}:${device.token}` : undefined;
}
function installationId() {
  let value = localStorage.getItem('love.push.installation');
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem('love.push.installation', value);
  }
  return value;
}
export async function clearPushListeners() {
  generation++;
  await Promise.all(handles.map((handle) => handle.remove()));
  handles = [];
}
export async function disablePush(api: Api) {
  const current = device;
  await clearPushListeners();
  try {
    if (current)
      await api.request('/api/devices', { method: 'DELETE', body: JSON.stringify(current) });
  } finally {
    device = undefined;
    try {
      if (Capacitor.isNativePlatform()) {
        if (enabledProvider === 'jpush') await ChinaPush.unregister();
        if (enabledProvider === 'fcm') await PushNotifications.unregister();
      }
    } finally {
      enabledProvider = undefined;
      localStorage.removeItem('love.push.enabled');
    }
  }
}

export async function pushDescription() {
  if (enabledProvider !== 'jpush') return enabledProvider === 'fcm' ? 'FCM 通知已连接' : '';
  const state = await ChinaPush.status();
  return state.vendor ? `${state.vendor}厂商通道已注册` : '国内推送已连接 · 厂商通道待注册';
}
export async function enablePush(api: Api, onOpen: () => void, onError: (message: string) => void) {
  if (!Capacitor.isNativePlatform())
    throw new Error('安卓 APK 支持后台通知；Web 打开时可实时收消息');
  const build = await fetch('/push-build.json')
    .then((r) => r.json())
    .catch(() => ({ firebaseConfigured: false, jpushConfigured: false }));
  const health = await api.request<{ pushProviders: Provider[] }>('/api/health');
  // Prefer domestic routing on every device in this China-oriented APK, including GMS devices.
  const provider: Provider | undefined =
    build.jpushConfigured && health.pushProviders.includes('jpush')
      ? 'jpush'
      : build.firebaseConfigured && health.pushProviders.includes('fcm')
        ? 'fcm'
        : undefined;
  if (!provider) throw new Error('推送尚未配置：APK 和服务器需要配置同一种推送渠道');
  await clearPushListeners();
  const current = generation;
  enabledProvider = provider;
  async function register(token: string) {
    if (generation !== current) return;
    await api.post('/api/devices', { provider, token, installationId: installationId() });
    if (generation !== current) {
      await api.request('/api/devices', {
        method: 'DELETE',
        body: JSON.stringify({ provider, token }),
      });
      return;
    }
    device = { provider: provider!, token };
    localStorage.setItem('love.push.enabled', 'true');
  }
  if (provider === 'jpush') {
    handles = await Promise.all([
      ChinaPush.addListener('registration', ({ token }) => {
        void register(token).catch((err) => onError(err.message));
      }),
      ChinaPush.addListener('openChat', onOpen),
    ]);
    try {
      const { token } = await ChinaPush.register();
      await register(token);
      if ((await ChinaPush.consumeOpen()).opened) onOpen();
    } catch (error) {
      await clearPushListeners();
      await ChinaPush.unregister();
      enabledProvider = undefined;
      device = undefined;
      localStorage.removeItem('love.push.enabled');
      throw error;
    }
  } else {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') throw new Error('请在系统设置中允许通知');
    await PushNotifications.createChannel({
      id: 'messages',
      name: '聊天消息',
      description: '另一半的新消息',
      importance: 5,
      visibility: 0,
      vibration: true,
    });
    let resolveRegistration: () => void, rejectRegistration: (error: Error) => void;
    const registration = new Promise<void>((resolve, reject) => {
      resolveRegistration = resolve;
      rejectRegistration = reject;
    });
    const timeout = window.setTimeout(
      () => rejectRegistration(new Error('FCM 注册超时，请检查 Google 服务连接')),
      30_000,
    );
    handles = await Promise.all([
      PushNotifications.addListener('registration', ({ value }) => {
        void register(value)
          .then(() => resolveRegistration())
          .catch((err) => {
            rejectRegistration(err);
            onError(err.message);
          });
      }),
      PushNotifications.addListener('registrationError', (event) =>
        rejectRegistration(new Error(event.error || 'FCM 注册失败')),
      ),
      PushNotifications.addListener('pushNotificationActionPerformed', () => {
        onOpen();
        void PushNotifications.removeAllDeliveredNotifications();
      }),
    ]);
    try {
      await PushNotifications.register();
      await registration;
    } catch (error) {
      await clearPushListeners();
      await PushNotifications.unregister();
      enabledProvider = undefined;
      device = undefined;
      localStorage.removeItem('love.push.enabled');
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }
}
