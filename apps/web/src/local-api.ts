import { ApiError } from './errors.js';
import { createHttpApi } from './http.js';
import type { AccountDeviceBackup } from './device-save-copy.js';

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
  async function accountRequest(path: string, baseUrl: string, token: string, saveId = ''): Promise<Response> {
    const response = await transport(path, { method: 'POST', body: JSON.stringify({ baseUrl, token, saveId }) });
    if (!response.ok) {
      const body = await response.json() as { code?: string };
      throw new ApiError(body.code ?? 'DEVICE_BACKUP_FAILED');
    }
    return response;
  }

  return {
    ...createHttpApi({ baseUrl: '', getToken: () => '', transport }),
    async copyFromAccount(baseUrl: string, token: string, saveId: string): Promise<void> {
      await accountRequest('/device-copy', baseUrl, token, saveId);
    },
    async backupToAccount(baseUrl: string, token: string, saveId: string): Promise<void> {
      await accountRequest('/device-backups/upload', baseUrl, token, saveId);
    },
    async accountBackups(baseUrl: string, token: string): Promise<readonly AccountDeviceBackup[]> {
      const response = await accountRequest('/device-backups/list', baseUrl, token);
      return (await response.json() as { items: AccountDeviceBackup[] }).items;
    },
    async restoreAccountBackup(baseUrl: string, token: string, backupId: string): Promise<void> {
      await accountRequest('/device-backups/restore', baseUrl, token, backupId);
    },
  };
}
