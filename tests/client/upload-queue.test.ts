import { afterEach, expect, test, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'web', isNativePlatform: () => false },
  registerPlugin: () => ({}),
}));
import { UploadQueue } from '../../apps/client/src/lib/upload-queue';
import { Api } from '../../apps/client/src/lib/api';
import type { Profile } from '../../apps/client/src/lib/types';
const queues: UploadQueue[] = [];
afterEach(() => {
  for (const q of queues) q.dispose();
  vi.unstubAllGlobals();
});
const profile = { user: { id: 'queue-user', coupleId: 'queue-pair' } } as Profile;
const make = () => {
  const q = new UploadQueue(
    new Api({ server: 'https://upload.test', token: 'private-fixture-token' }),
    profile,
    () => {},
  );
  queues.push(q);
  return q;
};
const until = async (fn: () => boolean) => {
  for (let i = 0; i < 150; i++) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('queue did not reach expected state');
};
let scopeCounter = 0;
function environment() {
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('navigator', { onLine: true });
  profile.user.id = 'user-' + ++scopeCounter;
}
test('abandoned startup cannot create a worker; a fresh queue transfers independently of the page', async () => {
  environment();
  let commits = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      expect(new Headers(init.headers).get('Authorization')).toBe('Bearer private-fixture-token');
      if (url.endsWith('/api/uploads')) return Response.json({ offsets: [0] });
      if (init.method === 'PUT') return Response.json({});
      if (url.endsWith('/complete')) {
        commits++;
        return Response.json({
          id: url.split('/').at(-2),
          kind: 'image',
          previewUrl: '/p',
          thumbnailUrl: '/t',
        });
      }
      throw new Error('unexpected request');
    }),
  );
  const abandoned = make(),
    start = abandoned.start();
  abandoned.dispose();
  await start;
  const queue = make();
  await queue.start();
  await queue.enqueue([
    { file: new File(['image-fixture'], 'photo.jpg', { type: 'image/jpeg' }), target: 'album' },
  ]);
  await until(() => queue.getSnapshot()[0]?.status === 'done');
  expect(commits).toBe(1);
  expect(queue.getSnapshot()[0]).toMatchObject({ progress: 100, bytes: 13, status: 'done' });
});
test('reopening a paused queue restores blobs and resumes after already accepted chunks', async () => {
  environment();
  let bytes = 0,
    hold = true,
    commits = 0;
  const accepted: number[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith('/api/uploads')) return Response.json({ offsets: [bytes] });
      if (init.method === 'PUT') {
        const index = Number(url.split('/').at(-1));
        if (index === 1 && hold)
          return new Promise<Response>((_resolve, reject) => {
            init.signal!.addEventListener(
              'abort',
              () => reject(new DOMException('paused', 'AbortError')),
              { once: true },
            );
          });
        accepted.push(index);
        bytes += (init.body as ArrayBuffer).byteLength;
        return Response.json({});
      }
      if (url.endsWith('/complete')) {
        commits++;
        return Response.json({
          id: url.split('/').at(-2),
          kind: 'image',
          previewUrl: '/p',
          thumbnailUrl: '/t',
        });
      }
      throw new Error('unexpected request');
    }),
  );
  const first = make();
  await first.start();
  const file = new File([new Uint8Array(2 * 1048576 + 17)], 'large.jpg', { type: 'image/jpeg' });
  await first.enqueue([{ file, target: 'album' }]);
  await until(() => bytes === 1048576);
  first.dispose();
  await new Promise((r) => setTimeout(r, 60));
  hold = false;
  const reopened = make();
  await reopened.start();
  await until(() => reopened.getSnapshot()[0]?.status === 'done');
  expect(accepted).toEqual([0, 1, 2]);
  expect(bytes).toBe(file.size);
  expect(commits).toBe(1);
  const history = make();
  await history.start();
  expect(history.getSnapshot()[0]).toMatchObject({
    status: 'done',
    progress: 100,
    total: file.size,
  });
  expect(commits).toBe(1);
});
test('a permanent capacity error preserves the file for manual retry and does not loop', async () => {
  environment();
  const calls = vi.fn(async () => Response.json({ error: '空间容量不足' }, { status: 413 }));
  vi.stubGlobal('fetch', calls);
  const q = make();
  await q.start();
  await q.enqueue([
    { file: new File(['image'], 'quota.jpg', { type: 'image/jpeg' }), target: 'album' },
  ]);
  await until(() => q.getSnapshot()[0]?.status === 'failed');
  expect(calls).toHaveBeenCalledTimes(1);
  expect(q.getSnapshot()[0].error).toBe('空间容量不足');
});
test('a late transient chunk failure cannot restart a confirmed cancellation', async () => {
  environment();
  let release: (response: Response) => void = () => {},
    chunks = 0,
    commits = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      if (init.method === 'DELETE') return new Response(null, { status: 204 });
      if (url.endsWith('/api/uploads')) return Response.json({ offsets: [0] });
      if (init.method === 'PUT') {
        chunks++;
        return new Promise<Response>((resolve) => {
          release = resolve;
        });
      }
      if (url.endsWith('/complete')) commits++;
      throw new Error('unexpected request');
    }),
  );
  const queue = make();
  await queue.start();
  await queue.enqueue([
    { file: new File(['image'], 'cancel.jpg', { type: 'image/jpeg' }), target: 'album' },
  ]);
  await until(() => chunks === 1);
  await queue.action(queue.getSnapshot()[0].id, 'cancel');
  release(Response.json({ error: 'temporary outage' }, { status: 503 }));
  queue.dispose();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(queue.getSnapshot()[0].status).toBe('cancelled');
  queue.dispose();
  const reopened = make();
  await reopened.start();
  expect(reopened.getSnapshot()[0].status).toBe('cancelled');
  expect(chunks).toBe(1);
  expect(commits).toBe(0);
});
