import { useEffect, useRef } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

export class BackNavigation {
  private next = 0;
  private handlers = new Map<number, { priority: number; action: () => boolean }>();
  register(action: () => boolean, priority = 0) {
    const id = this.next++;
    this.handlers.set(id, { priority, action });
    return () => {
      this.handlers.delete(id);
    };
  }
  dispatch() {
    for (const [, handler] of [...this.handlers].sort(
      (a, b) => b[1].priority - a[1].priority || b[0] - a[0],
    ))
      if (handler.action()) return true;
    return false;
  }
}
export const backNavigation = new BackNavigation();
export function useBackHandler(active: boolean, action: () => boolean, priority = 0) {
  const latest = useRef(action);
  latest.current = action;
  useEffect(
    () => (active ? backNavigation.register(() => latest.current(), priority) : undefined),
    [active, priority],
  );
}

export function attachNativeBack({
  app = NativeApp,
  keyboard = Keyboard,
  navigation = backNavigation,
} = {}) {
  let disposed = false,
    keyboardVisible = false;
  const listeners: PluginListenerHandle[] = [];
  const track = async (pending: Promise<PluginListenerHandle>) => {
    const listener = await pending;
    if (disposed) await listener.remove();
    else listeners.push(listener);
  };
  const ready = Promise.all([
    track(
      keyboard.addListener('keyboardDidShow', () => {
        keyboardVisible = true;
      }),
    ),
    track(
      keyboard.addListener('keyboardDidHide', () => {
        keyboardVisible = false;
      }),
    ),
    track(
      app.addListener('backButton', () => {
        if (keyboardVisible) {
          keyboardVisible = false;
          void keyboard.hide().catch(() => {});
        } else if (!navigation.dispatch()) void app.minimizeApp().catch(() => {});
      }),
    ),
  ]);
  return {
    ready,
    remove: () => {
      disposed = true;
      return Promise.all(listeners.map((listener) => listener.remove()));
    },
  };
}
export function useNativeBack() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    const listener = attachNativeBack();
    void listener.ready.catch(() => console.error('Android 返回键监听未能启动'));
    return () => {
      void listener.remove();
    };
  }, []);
}
