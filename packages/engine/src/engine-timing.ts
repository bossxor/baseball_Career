export type EngineTimingCategory = 'simulation' | 'dayClose' | 'validation' | 'clone' | 'seal';

interface EngineTimingObserver {
  now(): number;
  record(category: EngineTimingCategory, elapsedMs: number): void;
}

let observer: EngineTimingObserver | undefined;
let frame: { nestedMs: number } | undefined;

/** Install only around a synchronous engine command in an isolated profiler. */
export function setEngineTimingObserver(value?: EngineTimingObserver): void {
  observer = value;
}

export function measureEngine<T>(category: EngineTimingCategory, operation: () => T): T {
  const active = observer;
  if (!active) return operation();
  const parent = frame, current = { nestedMs: 0 }, start = active.now();
  frame = current;
  try {
    return operation();
  } finally {
    const elapsedMs = active.now() - start;
    frame = parent;
    if (parent) parent.nestedMs += elapsedMs;
    active.record(category, elapsedMs - current.nestedMs);
  }
}

export function measureEngineClone<T>(source: T): T {
  return measureEngine('clone', () => structuredClone(source));
}
