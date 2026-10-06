import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import type { Api } from './api';
import type { Profile } from './types';
export type NotificationStatus = { enabled: boolean; connected: boolean; batteryExempt: boolean };
const Native = registerPlugin<{
  start(config: { server: string; token: string; userId: string; coupleId: string }): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<NotificationStatus>;
  consumeOpen(): Promise<{ opened: boolean }>;
  batterySettings(): Promise<void>;
  addListener(event: 'openChat', callback: () => void): Promise<PluginListenerHandle>;
}>('LocalNotifications');
let handle: PluginListenerHandle | undefined;
let generation = 0;
export async function clearNotificationListener() {
  generation++;
  await handle?.remove();
  handle = undefined;
}
export async function notificationStatus(): Promise<NotificationStatus> {
  return Capacitor.isNativePlatform()
    ? Native.status()
    : { enabled: false, connected: false, batteryExempt: false };
}
export async function disableNotifications() {
  await clearNotificationListener();
  if (Capacitor.isNativePlatform()) await Native.stop();
}
export async function enableNotifications(api: Api, profile: Profile, onOpen: () => void) {
  if (!Capacitor.isNativePlatform()) throw new Error('本地通知请使用安卓 APK');
  if (!profile.couple || !profile.partner) throw new Error('请先与另一半配对');
  await clearNotificationListener();
  const current = generation;
  const listener = await Native.addListener('openChat', () => {
    if (current === generation) onOpen();
  });
  if (current !== generation) {
    await listener.remove();
    return;
  }
  handle = listener;
  try {
    await Native.start({
      server: api.session.server,
      token: api.session.token,
      userId: profile.user.id,
      coupleId: profile.couple.id,
    });
    if (current !== generation) {
      return;
    }
    if ((await Native.consumeOpen()).opened) onOpen();
  } catch (error) {
    if (current === generation) await disableNotifications();
    throw error;
  }
}
export const openBatterySettings = () => Native.batterySettings();
