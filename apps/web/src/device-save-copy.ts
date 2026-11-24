import { STATE_PART_BYTES, StateDecoder } from '../../../packages/db/src/state-codec.js';
import type { SaveState } from '../../api/src/engine-command.js';

type SnapshotMeta = { id: string; mode: 'CAREER' | 'CLUB'; revision: string; phase: string; summary: Record<string, unknown> };
export type AccountDeviceBackup = SnapshotMeta & { createdAt: string };

function isMeta(value: unknown, sourceId: string): value is SnapshotMeta {
  if (!value || typeof value !== 'object') return false;
  const meta = value as Partial<SnapshotMeta> & { version?: unknown };
  return meta.version === 1 && meta.id === sourceId && (meta.mode === 'CAREER' || meta.mode === 'CLUB')
    && typeof meta.revision === 'string' && /^[1-9]\d{0,18}$/.test(meta.revision)
    && typeof meta.phase === 'string' && !!meta.summary && typeof meta.summary === 'object' && !Array.isArray(meta.summary);
}

export async function readDeviceSaveCopy(body: ReadableStream<Uint8Array>, sourceId: string): Promise<{ meta: SnapshotMeta; state: SaveState }> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const state = new StateDecoder();
  let meta: SnapshotMeta | undefined, pending = '', parts = 0, ended = false;
  const corrupt = (): never => { throw new Error('DEVICE_COPY_CORRUPT'); };
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) { pending += decoder.decode(); break; }
      pending += decoder.decode(chunk.value, { stream: true });
      let newline: number;
      while ((newline = pending.indexOf('\n')) >= 0) {
        const line = pending.slice(0, newline);
        pending = pending.slice(newline + 1);
        const frame: unknown = JSON.parse(line);
        if (ended || !Array.isArray(frame) || frame.length !== 2) corrupt();
        const [tag, value] = frame as [unknown, unknown];
        if (!meta && tag === 'save' && isMeta(value, sourceId)) meta = value;
        else if (meta && tag === 'part' && typeof value === 'string') { state.push(value); parts++; }
        else if (meta && tag === 'end' && parts > 0 && value === parts) ended = true;
        else corrupt();
      }
      if (pending.length > 2 * STATE_PART_BYTES + 256) corrupt();
    }
    if (!meta || !ended || pending) throw new Error('DEVICE_COPY_CORRUPT');
    const saved = state.finish();
    if (!saved || typeof saved !== 'object' || (saved as SaveState).schemaVersion !== 1) throw new Error('UNSUPPORTED_SAVE_VERSION');
    return { meta, state: saved as SaveState };
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
