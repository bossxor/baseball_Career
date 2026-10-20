/** PCG-XSH-RR 64/32. Engine v1 seeding/draw order is a persisted contract (08/70). */
export interface RngState { state: string; increment: string; draws: number }
const MASK64 = (1n << 64n) - 1n;
const MULTIPLIER = 6364136223846793005n;
const uint64 = (value: bigint) => value & MASK64;

export function validateRng(snapshot: RngState): void {
  for (const value of [snapshot.state, snapshot.increment]) {
    if (!/^(0|[1-9][0-9]*)$/.test(value) || BigInt(value) > MASK64) throw new RangeError('Invalid PCG snapshot');
  }
  if ((BigInt(snapshot.increment) & 1n) !== 1n || !Number.isSafeInteger(snapshot.draws) || snapshot.draws < 0) throw new RangeError('Invalid PCG stream/cursor');
}

export function nextUint32(snapshot: RngState): { value: number; state: RngState } {
  validateRng(snapshot);
  if (!Number.isSafeInteger(snapshot.draws + 1)) throw new RangeError('PCG cursor overflow');
  const old = BigInt(snapshot.state);
  const shifted = Number(BigInt.asUintN(32, ((old >> 18n) ^ old) >> 27n));
  const rotation = Number(old >> 59n);
  return {
    value: ((shifted >>> rotation) | (shifted << ((-rotation) & 31))) >>> 0,
    state: { state: uint64(old * MULTIPLIER + BigInt(snapshot.increment)).toString(), increment: snapshot.increment, draws: snapshot.draws + 1 },
  };
}

export function seedPcg32(seed: bigint, sequence: bigint): RngState {
  if (seed < 0n || seed > MASK64 || sequence < 0n || sequence > MASK64) throw new RangeError('PCG seed must be uint64');
  let state: RngState = { state: '0', increment: uint64((sequence << 1n) | 1n).toString(), draws: 0 };
  state = nextUint32(state).state;
  state.state = uint64(BigInt(state.state) + seed).toString();
  state = nextUint32(state).state;
  return { ...state, draws: 0 };
}

export function nextFloat(snapshot: RngState) {
  const next = nextUint32(snapshot);
  return { ...next, value: next.value / 4_294_967_296 };
}

/** Rejection sampling avoids modulo bias; rejected draws are persisted too. */
export function nextInteger(snapshot: RngState, bound: number) {
  if (!Number.isInteger(bound) || bound < 1 || bound > 4_294_967_296) throw new RangeError('Invalid integer bound');
  const threshold = (4_294_967_296 - bound) % bound;
  let next = nextUint32(snapshot);
  while (next.value < threshold) next = nextUint32(next.state);
  return { ...next, value: next.value % bound };
}

export const STREAM_NAMES = ['game', 'pitchPlan', 'pitchCount', 'baserunning', 'injury', 'growth', 'event', 'worldCreation'] as const;
export type Streams = Record<(typeof STREAM_NAMES)[number], RngState>;

/** UTF-8 FNV-1a64, versioned seed namespace. No owner or physical row IDs. */
function hash64(text: string): bigint {
  let hash = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(text)) hash = uint64((hash ^ BigInt(byte)) * 1099511628211n);
  return hash;
}

export function createStreams(seed: string, simulationGameKey: string): Streams {
  if (!seed || !simulationGameKey) throw new RangeError('Seed and simulation game key required');
  const key = JSON.stringify(['engine-1', seed, simulationGameKey]);
  return Object.fromEntries(STREAM_NAMES.map(name => [name, seedPcg32(hash64(key), hash64(JSON.stringify([key, name])))])) as Streams;
}

/** World generation namespace is separate from persisted M1 game streams. */
export function createHandednessStream(seed: string, worldKey: string): RngState {
  if (!seed || !worldKey) throw new RangeError('WORLD_SEED_REQUIRED');
  const key=JSON.stringify(['world-1',seed,worldKey,'handedness']);
  return seedPcg32(hash64(key),hash64(JSON.stringify([key,'sequence'])));
}
