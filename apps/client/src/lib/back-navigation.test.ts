import { test, expect, vi } from 'vitest';
import { BackNavigation, attachNativeBack } from './back-navigation';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

test('back closes the most recent overlay before a page and unregisters closed handlers', () => {
  const navigation = new BackNavigation(),
    actions: string[] = [];
  navigation.register(() => {
    actions.push('page');
    return true;
  });
  const first = navigation.register(() => {
    actions.push('first');
    return true;
  }, 100);
  const second = navigation.register(() => {
    actions.push('second');
    return true;
  }, 100);
  expect(navigation.dispatch()).toBe(true);
  second();
  navigation.dispatch();
  first();
  navigation.dispatch();
  expect(actions).toEqual(['second', 'first', 'page']);
});
test('native back hides keyboard, consumes overlays and pages, then minimizes without clearing session', async () => {
  const navigation = new BackNavigation(),
    events = new Map<string, () => void>();
  const remove = vi.fn(async () => {}),
    minimizeApp = vi.fn(async () => {}),
    hide = vi.fn(async () => {});
  const addListener = vi.fn(async (event: string, action: () => void) => {
    events.set(event, action);
    return { remove };
  });
  const listener = attachNativeBack({
    navigation,
    app: { addListener, minimizeApp } as unknown as typeof App,
    keyboard: { addListener, hide } as unknown as typeof Keyboard,
  });
  await listener.ready;
  let dialog = 0,
    page = 0;
  const unregisterPage = navigation.register(() => {
    page++;
    unregisterPage();
    return true;
  });
  const unregisterDialog = navigation.register(() => {
    dialog++;
    unregisterDialog();
    return true;
  }, 100);
  events.get('keyboardDidShow')!();
  events.get('backButton')!();
  expect(hide).toHaveBeenCalledOnce();
  expect(dialog).toBe(0);
  events.get('keyboardDidHide')!();
  events.get('backButton')!();
  expect(dialog).toBe(1);
  expect(page).toBe(0);
  events.get('backButton')!();
  expect(page).toBe(1);
  events.get('backButton')!();
  expect(minimizeApp).toHaveBeenCalledOnce();
  await listener.remove();
  expect(remove).toHaveBeenCalledTimes(3);
});
test('listeners resolving after unmount are removed rather than retained', async () => {
  const remove = vi.fn(async () => {});
  const pending: Array<(listener: { remove: typeof remove }) => void> = [];
  const addListener = vi.fn(
    () => new Promise<{ remove: typeof remove }>((resolve) => pending.push(resolve)),
  );
  const listener = attachNativeBack({
    app: { addListener } as unknown as typeof App,
    keyboard: { addListener } as unknown as typeof Keyboard,
  });
  await listener.remove();
  for (const resolve of pending) resolve({ remove });
  await listener.ready;
  expect(remove).toHaveBeenCalledTimes(3);
});
