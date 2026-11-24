import type { Context } from 'hono';
import { readOwnedSave } from './save-state.js';
import type { AppVariables } from './auth.js';
import { encodeStateParts } from '@playball/db';

export async function getDeviceSaveCopy(c: Context<{ Variables: AppVariables }>) {
  const id = c.req.param('id');
  if (!id) return c.json({ code: 'INVALID_REQUEST' }, 400);
  const save = await readOwnedSave(c.get('db'), c.get('subject'), id);
  if (!save || save.revision === 0n) return c.json({ code: 'SAVE_NOT_FOUND' }, 404);
  const metadata = { version: 1, id: save.id, mode: save.mode, revision: save.revision.toString(), phase: save.phase, summary: save.summary };
  const state = save.state;

  function* frames() {
    yield ['save', metadata];
    let count = 0;
    for (const part of encodeStateParts(state)) {
      yield ['part', part];
      count++;
    }
    yield ['end', count];
  }
  const encoder = new TextEncoder();
  const source = frames();
  return new Response(new ReadableStream({
    pull(controller) {
      const frame = source.next();
      if (frame.done) controller.close();
      else controller.enqueue(encoder.encode(JSON.stringify(frame.value) + '\n'));
    },
    cancel() { source.return(undefined); },
  }), { headers: {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}
