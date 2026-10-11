import { sha256 } from '@noble/hashes/sha256';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { Api } from './api';
import type { UploadedMedia, Profile } from './types';
import { newId } from './id';
export const nativeUploads = Capacitor.getPlatform() === 'android';
export type UploadTarget = 'album' | 'draft' | 'avatar' | 'ai-avatar';
export type PickedFile = File & { nativeUri?: string };
export type Task = {
  id: string;
  name: string;
  target: UploadTarget;
  status:
    | 'queued'
    | 'preparing'
    | 'uploading'
    | 'processing'
    | 'retrying'
    | 'done'
    | 'failed'
    | 'cancelled'
    | 'paused';
  progress: number;
  bytes: number;
  total: number;
  created: number;
  updated: number;
  error?: string;
  attempt?: number;
  result?: UploadedMedia;
  claimed?: boolean;
};
type Spec = {
  id: string;
  files: { name: string; type: string; size: number }[];
  target: UploadTarget;
  title: string;
  date?: string;
};
type Stored = Task & { key: string; scope: string; spec: Spec; files?: File[] };
interface UploadPlugin {
  pick(options: {
    multiple: boolean;
    imagesOnly?: boolean;
  }): Promise<{ files: { uri: string; name: string; type: string; size: number }[] }>;
  configure(options: { scope: string; server: string; token: string }): Promise<void>;
  enqueue(options: { scope: string; tasks: { spec: Spec; uris: string[] }[] }): Promise<void>;
  list(options: { scope: string }): Promise<{ tasks: Task[] }>;
  action(options: {
    scope: string;
    id: string;
    action: 'retry' | 'cancel' | 'claim' | 'clear';
  }): Promise<void>;
  pause(): Promise<void>;
  consumeOpen(): Promise<{ opened: boolean }>;
  addListener(event: string, callback: () => void): Promise<PluginListenerHandle>;
}
export const BackgroundUploads = registerPlugin<UploadPlugin>('BackgroundUploads');
export async function pickNativeFiles(multiple = true, imagesOnly = false): Promise<PickedFile[]> {
  const { files } = await BackgroundUploads.pick({ multiple, imagesOnly });
  return files.map((f) => {
    const file = new File([], f.name, { type: f.type }) as PickedFile;
    Object.defineProperty(file, 'size', { value: f.size });
    file.nativeUri = f.uri;
    return file;
  });
}
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ||= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('love.uploads.v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('tasks', { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('无法保存上传任务，请检查设备存储空间'));
  }));
}
async function save(records: Stored[]) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction('tasks', 'readwrite');
    for (const record of records) tx.objectStore('tasks').put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('无法保存上传任务，请检查设备存储空间'));
    tx.onabort = () => reject(new Error('无法保存上传任务，请检查设备存储空间'));
  });
}
async function records(scope: string) {
  const database = await db();
  return new Promise<Stored[]>((resolve, reject) => {
    const r = database.transaction('tasks').objectStore('tasks').getAll();
    r.onsuccess = () => resolve(r.result.filter((t: Stored) => t.scope === scope));
    r.onerror = () => reject(r.error);
  });
}
export const pendingTask = (t: Task) =>
  !['done', 'failed', 'cancelled', 'paused'].includes(t.status);
class TransferError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
export class UploadQueue {
  readonly scope: string;
  private tasks: Stored[] = [];
  private snapshot: Task[] = [];
  private listeners = new Set<() => void>();
  private running = false;
  private disposed = false;
  private controller = new AbortController();
  private interval?: ReturnType<typeof setInterval>;
  private listener?: PluginListenerHandle;
  private refreshed = new Map<string, number>();
  private signed = new Map<string, UploadedMedia>();
  constructor(
    public api: Api,
    profile: Profile,
    private changed: (task?: Task) => void,
  ) {
    this.scope = JSON.stringify([api.session.server, profile.user.id, profile.user.coupleId]);
  }
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };
  getSnapshot = () => this.snapshot;
  private emit() {
    this.snapshot = this.tasks.map(({ key: _k, scope: _s, spec: _p, files: _f, ...t }) => t);
    for (const listener of this.listeners) listener();
  }
  async start() {
    if (nativeUploads) {
      await BackgroundUploads.configure({
        scope: this.scope,
        server: this.api.session.server,
        token: this.api.session.token,
      });
      if (this.disposed) return;
      const listener = await BackgroundUploads.addListener(
        'changed',
        () => void this.refresh().catch(() => {}),
      );
      if (this.disposed) {
        await listener.remove();
        return;
      }
      this.listener = listener;
      this.interval = setInterval(() => void this.refresh().catch(() => {}), 1000);
      await this.refresh();
    } else {
      const saved = await records(this.scope);
      if (this.disposed) return;
      this.tasks = saved;
      this.interval = setInterval(() => void this.refreshDrafts(), 60_000);
      for (const task of this.tasks)
        if (pendingTask(task) || task.status === 'paused') task.status = 'queued';
      this.emit();
      void this.refreshDrafts();
      void this.run();
    }
  }
  async refresh() {
    if (this.disposed) return;
    const { tasks } = await BackgroundUploads.list({ scope: this.scope });
    const completed = tasks.filter(
      (t) => t.status === 'done' && this.tasks.find((v) => v.id === t.id)?.status !== 'done',
    );
    const newlyFinished = completed.filter((t) => this.tasks.some((v) => v.id === t.id));
    if (this.disposed) return;
    this.tasks = tasks.map((t) => ({
      ...t,
      ...(this.signed.has(t.id) ? { result: this.signed.get(t.id) } : {}),
    })) as Stored[];
    this.emit();
    if (completed.length) {
      if (newlyFinished.length) for (const task of newlyFinished) this.changed(task);
      else this.changed();
    }
    void this.refreshDrafts();
  }
  private async refreshDrafts() {
    for (const task of this.tasks)
      if (
        task.target === 'draft' &&
        task.status === 'done' &&
        !task.claimed &&
        Date.now() - (this.refreshed.get(task.id) || 0) > 10 * 60_000
      ) {
        this.refreshed.set(task.id, Date.now());
        try {
          const state = await this.api.request<{ result?: UploadedMedia }>(
            `/api/uploads/${task.id}`,
          );
          if (state.result) {
            task.result = state.result;
            this.signed.set(task.id, state.result);
            if (!nativeUploads) await save([task]);
            this.emit();
          }
        } catch {
          this.refreshed.delete(task.id);
        }
      }
  }
  async enqueue(
    inputs: {
      id?: string;
      file: PickedFile;
      liveVideo?: PickedFile;
      target: UploadTarget;
      title?: string;
      date?: string;
    }[],
  ) {
    const now = Date.now();
    const jobs = inputs.map((input) => {
      const files = [input.file, ...(input.liveVideo ? [input.liveVideo] : [])];
      const id = input.id || newId();
      const spec: Spec = {
        id,
        files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
        target: input.target,
        title: input.title || '',
        ...(input.date ? { date: input.date } : {}),
      };
      return {
        key: this.scope + ':' + id,
        scope: this.scope,
        id,
        name: input.file.name,
        target: input.target,
        status: 'queued' as const,
        progress: 0,
        bytes: 0,
        total: files.reduce((n, f) => n + f.size, 0),
        created: now,
        updated: now,
        spec,
        files,
      };
    });
    if (jobs.some((t) => t.total === 0)) throw new Error('请选择非空文件');
    if (nativeUploads) {
      if (jobs.some((t) => t.files.some((f) => !f.nativeUri)))
        throw new Error('请使用应用内文件选择器选择媒体');
      await BackgroundUploads.enqueue({
        scope: this.scope,
        tasks: jobs.map((t) => ({ spec: t.spec, uris: t.files.map((f) => f.nativeUri!) })),
      });
      await this.refresh();
    } else {
      await save(jobs);
      this.tasks.push(...jobs);
      this.emit();
      void this.run();
    }
  }
  private async update(task: Stored, patch: Partial<Task>) {
    Object.assign(task, patch, { updated: Date.now() });
    await save([task]);
    this.emit();
  }
  private async request<T>(task: Stored, path: string, init: RequestInit = {}): Promise<T> {
    for (let attempt = 0; attempt < 12; attempt++) {
      this.controller.signal.throwIfAborted();
      while (!navigator.onLine) {
        await this.update(task, { status: 'retrying', error: '等待网络连接' });
        await wait(2000, this.controller.signal);
      }
      try {
        const response = await fetch(this.api.url(path), {
          ...init,
          headers: { Authorization: `Bearer ${this.api.session.token}`, ...init.headers },
          signal: AbortSignal.any([
            this.controller.signal,
            AbortSignal.timeout(path.endsWith('/complete') ? 15 * 60_000 : 60_000),
          ]),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new TransferError(result.error || `服务器返回 ${response.status}`, response.status);
        return result as T;
      } catch (error) {
        this.controller.signal.throwIfAborted();
        const status = (error as TransferError).status || 0;
        if ((status && status !== 408 && status !== 429 && status < 500) || attempt === 11)
          throw error;
        await this.update(task, {
          status: 'retrying',
          attempt: attempt + 1,
          error: (error as Error).message,
        });
        await wait(Math.min(1000 * 2 ** attempt, 30_000), this.controller.signal);
      }
    }
    throw new Error('上传重试次数已用尽');
  }
  private async transfer(task: Stored) {
    const files = task.files;
    if (!files?.length) throw new Error('本地文件已丢失，请重新选择文件');
    const state = await this.request<{ offsets: number[]; result?: UploadedMedia }>(
      task,
      '/api/uploads',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task.spec),
      },
    );
    let bytes = state.offsets.reduce((n, v) => n + v, 0);
    if (!state.result)
      for (let part = 0; part < files.length; part++) {
        const file = files[part];
        for (let offset = state.offsets[part]; offset < file.size; offset += 1048576) {
          this.controller.signal.throwIfAborted();
          if (String(task.status) === 'cancelled') return;
          const chunk = await file.slice(offset, offset + 1048576).arrayBuffer();
          const sha = Array.from(sha256(new Uint8Array(chunk)))
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('');
          await this.update(task, { status: 'uploading', error: undefined });
          await this.request(task, `/api/uploads/${task.id}/${part}/${offset / 1048576}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/octet-stream', 'X-Chunk-Sha256': sha },
            body: chunk,
          });
          if (String(task.status) === 'cancelled') return;
          bytes += chunk.byteLength;
          await this.update(task, { bytes, progress: Math.round((bytes / task.total) * 100) });
        }
      }
    if (String(task.status) === 'cancelled') return;
    await this.update(task, { status: 'processing', progress: 100, error: undefined });
    const result =
      state.result ||
      (await this.request<UploadedMedia>(task, `/api/uploads/${task.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }));
    task.files = undefined;
    await this.update(task, {
      status: 'done',
      result,
      progress: 100,
      bytes: task.total,
      error: undefined,
    });
    this.changed(task);
  }
  private async run() {
    if (this.running || this.disposed) return;
    this.running = true;
    try {
      for (const task of this.tasks)
        if (pendingTask(task)) {
          try {
            await this.transfer(task);
          } catch (error) {
            if (this.disposed) {
              task.status = 'paused';
              await save([task]);
              break;
            }
            if (task.status !== 'cancelled')
              await this.update(task, { status: 'failed', error: (error as Error).message });
          }
        }
    } finally {
      this.running = false;
    }
  }
  async action(id: string, action: 'retry' | 'cancel' | 'claim' | 'clear') {
    if (nativeUploads) {
      await BackgroundUploads.action({ scope: this.scope, id, action });
      await this.refresh();
      return;
    }
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    if (action === 'retry') {
      await this.update(task, { status: 'queued', error: undefined });
      void this.run();
    } else if (action === 'claim') await this.update(task, { claimed: true });
    else if (action === 'cancel') {
      // The server serializes cancellation against commit. A completed upload remains completed.
      try {
        await this.api.delete(`/api/uploads/${id}`);
      } catch (error) {
        const state = await this.api
          .request<{ result?: UploadedMedia }>(`/api/uploads/${id}`)
          .catch(() => null);
        if (state?.result) {
          task.files = undefined;
          await this.update(task, { status: 'done', result: state.result, error: undefined });
          this.changed();
          return;
        }
        throw error;
      }
      task.files = undefined;
      await this.update(task, { status: 'cancelled', error: undefined });
    } else if (action === 'clear') {
      if (pendingTask(task) || (task.target === 'draft' && !task.claimed && task.status === 'done'))
        return;
      const database = await db();
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction('tasks', 'readwrite');
        tx.objectStore('tasks').delete(task.key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.emit();
    }
  }
  dispose() {
    this.disposed = true;
    this.controller.abort(new DOMException('上传已暂停', 'AbortError'));
    clearInterval(this.interval);
    void this.listener?.remove();
  }
}
export async function pauseNativeUploads() {
  if (nativeUploads) await BackgroundUploads.pause();
}
