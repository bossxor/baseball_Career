/** Stable error codes the UI maps to screen states. */
export class ApiError extends Error {
  constructor(readonly code: string, readonly currentRevision?: number) {
    super(code);
    this.name = 'ApiError';
  }
}

export const stateFromError = (err: unknown): 'conflict' | 'error' =>
  err instanceof ApiError && err.code === 'REVISION_CONFLICT' ? 'conflict' : 'error';
