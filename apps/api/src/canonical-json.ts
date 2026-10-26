import { createHash } from 'node:crypto';

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) out[key] = sortValue(obj[key]);
  return out;
}

/** request_hash = type/payload/expectedRevision only (28). */
export function requestHash(input: {
  type: string;
  payload: unknown;
  expectedRevision: number | string | bigint;
}): string {
  const canonical = JSON.stringify(
    sortValue({
      type: input.type,
      payload: input.payload,
      expectedRevision: String(input.expectedRevision),
    }),
  );
  return createHash('sha256').update(canonical).digest('hex');
}
