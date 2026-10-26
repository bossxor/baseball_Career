const KEY = 'playball.jwt';

export function readToken(): string | null {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}
export function writeToken(token: string): void {
  try { sessionStorage.setItem(KEY, token); } catch { /* ignore */ }
}
export function clearToken(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Neon Managed Auth email sign-in → JWT (`/token`). */
export async function signInForJwt(input: {
  authBaseUrl: string; email: string; password: string; origin?: string;
}): Promise<string> {
  const origin = input.origin ?? location.origin;
  const base = input.authBaseUrl.replace(/\/$/, '');
  const signIn = await fetch(`${base}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email: input.email, password: input.password }),
    credentials: 'include',
  });
  if (!signIn.ok) throw new Error('LOGIN_FAILED');
  const tokenRes = await fetch(`${base}/token`, {
    headers: { Origin: origin },
    credentials: 'include',
  });
  if (!tokenRes.ok) throw new Error('TOKEN_FAILED');
  const json = await tokenRes.json() as { token?: string };
  if (!json.token) throw new Error('TOKEN_MISSING');
  return json.token;
}
