/** A bounded event stream: no complete career JSON string is ever assembled. */
export const STATE_PART_BYTES = 1024 * 1024;
const STRING_PIECE = 16 * 1024;
type Event = [string, ...unknown[]];
function invalid(): never { throw new Error('SAVE_STATE_CORRUPT'); }
const primitive = (value: unknown) => value === null || typeof value !== 'object';
function jsonValue(value: unknown, key: string): unknown {
  return value && typeof value === 'object' && 'toJSON' in value && typeof value.toJSON === 'function' ? value.toJSON(key) : value;
}

function* textEvents(kind: string, text: string): Generator<Event> {
  if (!text.length) { yield [kind, '', true]; return; }
  for (let start = 0; start < text.length;) {
    let end = Math.min(start + STRING_PIECE, text.length);
    if (end < text.length && text.charCodeAt(end - 1) >= 0xd800 && text.charCodeAt(end - 1) <= 0xdbff && text.charCodeAt(end) >= 0xdc00 && text.charCodeAt(end) <= 0xdfff) end--;
    yield [kind, text.slice(start, end), end === text.length];
    start = end;
  }
}

export function* encodeStateParts(state: unknown): Generator<string> {
  const ancestors = new Set<object>();
  function* visit(value: unknown, depth: number): Generator<Event> {
    if (depth > 1000) throw new Error('SAVE_STATE_TOO_DEEP');
    if (typeof value === 'string') { yield* textEvents('s', value); return; }
    if (primitive(value)) { yield ['v', value ?? null]; return; }
    if (ancestors.has(value as object)) throw new Error('SAVE_STATE_CIRCULAR');
    // Flat stat rows dominate game history; keep them compact without stringifying a large subtree.
    const keys = Object.keys(value as object);
    if (!('toJSON' in (value as object)) && (!Array.isArray(value) || value.length <= 64) && keys.length <= 64 && keys.every(key => key.length <= STRING_PIECE && primitive((value as Record<string, unknown>)[key]) && (typeof (value as Record<string, unknown>)[key] !== 'string' || ((value as Record<string, string>)[key]!.length <= STRING_PIECE)))) {
      const encoded = JSON.stringify(value);
      if (encoded.length < STATE_PART_BYTES / 8) { yield ['v', JSON.parse(encoded)]; return; }
    }
    ancestors.add(value as object);
    if (Array.isArray(value)) {
      yield ['a'];
      for (let i = 0; i < value.length; i++) yield* visit(jsonValue(value[i], String(i)), depth + 1);
    } else {
      yield ['o'];
      for (const key of keys) {
        const child = jsonValue((value as Record<string, unknown>)[key], key);
        if (child === undefined || typeof child === 'function' || typeof child === 'symbol') continue;
        yield* textEvents('k', key);
        yield* visit(child, depth + 1);
      }
    }
    yield ['e'];
    ancestors.delete(value as object);
  }
  let buffer = '', bytes = 0;
  for (const event of visit(jsonValue(state, ''), 0)) {
    const line = JSON.stringify(event) + '\n', size = Buffer.byteLength(line);
    if (size > STATE_PART_BYTES) throw new Error('SAVE_STATE_TOKEN_TOO_LARGE');
    if (bytes + size > STATE_PART_BYTES) { yield buffer; buffer = ''; bytes = 0; }
    buffer += line; bytes += size;
  }
  if (buffer) yield buffer;
}

type Frame = { value: Record<string, unknown> | unknown[]; key?: string };
export class StateDecoder {
  private stack: Frame[] = [];
  private root: unknown;
  private hasRoot = false;
  private text: string[] = [];
  private textKind: string | null = null;
  private attach(value: unknown) {
    const frame = this.stack.at(-1);
    if (!frame) {
      if (this.hasRoot) invalid();
      this.root = value; this.hasRoot = true;
    } else if (Array.isArray(frame.value)) frame.value.push(value);
    else {
      if (frame.key === undefined || Object.hasOwn(frame.value, frame.key)) invalid();
      Object.defineProperty(frame.value, frame.key, { value, enumerable: true, configurable: true, writable: true });
      delete frame.key;
    }
  }
  push(part: string) {
    if (!part || Buffer.byteLength(part) > STATE_PART_BYTES || !part.endsWith('\n')) invalid();
    for (const line of part.slice(0, -1).split('\n')) {
      const event: unknown = JSON.parse(line);
      if (!Array.isArray(event) || typeof event[0] !== 'string') invalid();
      const [kind, value, done] = event;
      if (this.textKind && kind !== this.textKind) invalid();
      if (kind === 's' || kind === 'k') {
        if (event.length !== 3 || typeof value !== 'string' || typeof done !== 'boolean') invalid();
        this.textKind = kind; this.text.push(value);
        if (done) {
          const text = this.text.join(''); this.text = []; this.textKind = null;
          if (kind === 's') this.attach(text);
          else {
            const frame = this.stack.at(-1);
            if (!frame || Array.isArray(frame.value) || frame.key !== undefined) invalid();
            frame.key = text;
          }
        }
      } else if (kind === 'v' && event.length === 2) this.attach(value);
      else if ((kind === 'o' || kind === 'a') && event.length === 1) {
        if (this.stack.length > 1000) invalid();
        const container = kind === 'a' ? [] : {};
        this.attach(container); this.stack.push({ value: container });
      } else if (kind === 'e' && event.length === 1) {
        const frame = this.stack.pop();
        if (!frame || frame.key !== undefined) invalid();
      } else invalid();
    }
  }
  finish(): unknown {
    if (!this.hasRoot || this.stack.length || this.textKind) invalid();
    return this.root;
  }
}
