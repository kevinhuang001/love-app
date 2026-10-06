import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Api } from './api';
let deviceToken: string | undefined;
let handles: PluginListenerHandle[] = [];
export function getDeviceToken() {
  return deviceToken;
}
export async function disablePush(api: Api) {
  const token = deviceToken;
  if (token)
    await api.request('/api/devices', { method: 'DELETE', body: JSON.stringify({ token }) });
  deviceToken = undefined;
  await Promise.all(handles.map((handle) => handle.remove()));
  handles = [];
  if (Capacitor.isNativePlatform()) await PushNotifications.unregister();
}
export async function clearPushListeners() {
  await Promise.all(handles.map((handle) => handle.remove()));
  handles = [];
}
export async function enablePush(api: Api, onOpen: () => void, onError: (message: string) => void) {
  if (!Capacitor.isNativePlatform())
    throw new Error('安卓 APK 支持后台通知；Web 打开时可实时收消息');
  const build = await fetch('/push-build.json')
    .then((response) => response.json())
    .catch(() => ({ firebaseConfigured: false }));
  if (!build.firebaseConfigured)
    throw new Error('此 APK 未配置 Firebase，请配置 GOOGLE_SERVICES_JSON 后重新构建');
  const health = await api.request<{ pushConfigured: boolean }>('/api/health');
  if (!health.pushConfigured) throw new Error('服务器尚未配置 Firebase 推送凭据');
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') throw new Error('请在系统设置中允许通知');
  await clearPushListeners();
  await PushNotifications.createChannel({
    id: 'messages',
    name: '聊天消息',
    description: '另一半的新消息',
    importance: 5,
    visibility: 0,
    vibration: true,
  });
  handles = await Promise.all([
    PushNotifications.addListener('registration', async (token) => {
      try {
        await api.post('/api/devices', { token: token.value });
        deviceToken = token.value;
        localStorage.setItem('love.push.enabled', 'true');
      } catch (err) {
        onError((err as Error).message);
      }
    }),
    PushNotifications.addListener('registrationError', (event) =>
      onError(event.error || '推送注册失败，请检查 APK Firebase 配置'),
    ),
    PushNotifications.addListener('pushNotificationActionPerformed', () => {
      onOpen();
      void PushNotifications.removeAllDeliveredNotifications();
    }),
  ]);
  await PushNotifications.register();
}
