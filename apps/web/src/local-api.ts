import { ApiError } from './errors.js';
import { createHttpApi } from './http.js';

export function createLocalApi() {
  const worker = new Worker(new URL('./local-game.worker.ts', import.meta.url), { type: 'module' });
  let sequence = 0, failed = false;
  const pending = new Map<number, { resolve: (response: Response) => void; reject: (error: Error) => void }>();
  worker.addEventListener('message', ({ data }: MessageEvent<{ id: number; reply: [number, unknown] }>) => {
    const entry = pending.get(data.id);
    pending.delete(data.id);
    entry?.resolve(Response.json(data.reply[1], { status: data.reply[0] }));
  });
  worker.addEventListener('error', () => {
    failed = true;
    for (const entry of pending.values()) entry.reject(new ApiError('LOCAL_GAME_ERROR'));
    pending.clear();
  });
  const transport = (path: string, init: RequestInit) => new Promise<Response>((resolve, reject) => {
    if (failed) { reject(new ApiError('LOCAL_GAME_ERROR')); return; }
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, path, method: init.method ?? 'GET', body: init.body });
  });
  return {
    ...createHttpApi({ baseUrl: '', getToken: () => '', transport }),
    async copyFromAccount(baseUrl: string, token: string, saveId: string): Promise<void> {
      const response = await transport('/device-copy', { method: 'POST', body: JSON.stringify({ baseUrl, token, saveId }) });
      if (!response.ok) throw new ApiError('DEVICE_COPY_FAILED');
    },
  };
}
